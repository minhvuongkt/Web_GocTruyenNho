import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import {
  extractPayOSPaymentData,
  isValidPayOSResponse,
  extractPayOSErrorMessage,
  getPaymentQRCode,
  checkPaymentStatus,
  generateVietQRImageUrl
} from "@/utils/payos-helpers";
import QRCode from "qrcode";
import ReactQRCode from "react-qr-code";

// Add a declaration file for QRCode to fix TypeScript error
declare module "qrcode";

interface PayOSDirectCheckoutProps {
  amount: number;
  description?: string;
  onSuccess: (orderCode: string) => void;
  onCancel?: () => void;
  expiryTime?: number; // Thời gian hết hạn (giây), mặc định là 10 phút (600 giây)
}

export function PayOSDirectCheckout({
  amount,
  description = "Nạp xu mở chương khoá website goctruyennho.io.vn",
  onSuccess,
  onCancel,
  expiryTime = 15,
}: PayOSDirectCheckoutProps) {
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  // Handle QR code generation and payment creation
  const handleCreatePayment = async () => {
    setIsCreatingLink(true);
    setMessage("");

    try {
      // Tạo giao dịch mới trực tiếp qua PayOS API
      const response = await apiRequest("POST", "/api/payment/payos/create-payment-link", {
        amount: amount,
        description: description.length > 25 ? description.substring(0, 25) : description,
        // orderCode được tạo tự động bên phía server
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server không phản hồi");
      }

      // Lấy thông tin giao dịch vừa tạo
      const paymentData = await response.json();
      console.log("Payment created:", paymentData);
      
      // Kiểm tra phản hồi API và xác nhận dữ liệu đầy đủ
      if (!paymentData || !paymentData.payment) {
        throw new Error("Không nhận được dữ liệu thanh toán từ server");
      }
      
      // Lưu mã giao dịch để sử dụng sau này
      const newTransactionId = paymentData.payment.transactionId;
      if (newTransactionId) {
        setOrderCode(newTransactionId);
      } else {
        throw new Error("Không nhận được mã giao dịch từ server");
      }
      
      // Lấy mã QR và URL thanh toán trực tiếp từ response
      if (paymentData.qrCode) {
        setQrCode(paymentData.qrCode);
        console.log("QR code received:", paymentData.qrCode.substring(0, 50) + "...");
      } else {
        console.error("No QR code in response");
      }
      
      if (paymentData.paymentLink) {
        setCheckoutUrl(paymentData.paymentLink);
      }
      
      // Tính thời gian còn lại dựa trên expiresAt từ server
      if (paymentData.expiresAt) {
        const expiryDate = new Date(paymentData.expiresAt);
        const now = new Date();
        const secondsRemaining = Math.floor(
          (expiryDate.getTime() - now.getTime()) / 1000
        );
        
        // Đảm bảo không đặt giá trị âm
        setCountdown(secondsRemaining > 0 ? secondsRemaining : expiryTime * 60);
        console.log("Setting countdown to:", secondsRemaining > 0 ? secondsRemaining : expiryTime * 60);
      } else {
        // Sử dụng giá trị mặc định nếu server không trả về thời gian hết hạn
        setCountdown(expiryTime * 60);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi tạo thanh toán",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
      console.error("PayOS payment error:", error);
    } finally {
      setIsCreatingLink(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);

          // Khi hết thời gian, tự động hủy thanh toán hiện tại
          toast({
            title: "Hết thời gian thanh toán",
            description: "Mã QR đã hết hiệu lực. Vui lòng tạo mới để tiếp tục.",
            variant: "destructive",
          });

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, toast]);

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Poll for payment status if we have an orderCode, thực hiện kiểm tra real-time
  useEffect(() => {
    if (!orderCode || countdown <= 0) return;

    const checkStatus = async () => {
      try {
        // Sử dụng hàm tiện ích để kiểm tra trạng thái thanh toán với PayOS
        const statusData = await checkPaymentStatus(orderCode);
        console.log("Payment status check response:", statusData);

        // Kiểm tra trạng thái từ phản hồi
        // Xử lý cả 2 dạng response - nếu status trực tiếp hoặc apiStatus từ PayOS API
        const isCompleted = 
          statusData.status === "completed" || 
          statusData.apiStatus === "PAID";
        
        const isFailed = 
          statusData.status === "failed" || 
          statusData.apiStatus === "CANCELLED" || 
          statusData.apiStatus === "EXPIRED";
        
        if (isCompleted) {
          setMessage("Thanh toán thành công!");
          onSuccess(orderCode);
          // Stop checking after success
          return true; // trả về true để dừng interval
        }
        
        if (isFailed) {
          setMessage("Thanh toán đã bị hủy hoặc hết hạn");
          onCancel?.();
          return true; // trả về true để dừng interval
        }
        
        return false; // tiếp tục kiểm tra
      } catch (error) {
        console.error("Error checking payment status:", error);
        return false; // tiếp tục kiểm tra nếu có lỗi
      }
    };

    // Kiểm tra ngay lập tức lần đầu tiên
    checkStatus();
    
    // Tiếp tục kiểm tra mỗi 5 giây
    const interval = setInterval(async () => {
      const shouldStop = await checkStatus();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderCode, countdown, onSuccess, onCancel]);

  // Handle payment completion manually
  const handleConfirmPayment = async () => {
    if (!orderCode) return;

    toast({
      title: "Đang xác nhận thanh toán",
      description: "Vui lòng đợi trong giây lát...",
    });

    try {
      // Sử dụng hàm tiện ích để kiểm tra trạng thái thanh toán với PayOS
      const statusData = await checkPaymentStatus(orderCode);
      console.log("Manual payment check response:", statusData);

      // Kiểm tra trạng thái từ phản hồi
      // Xử lý cả 2 dạng response - từ database hoặc từ PayOS API
      const isCompleted = 
        statusData.status === "completed" || 
        statusData.apiStatus === "PAID";
      
      if (isCompleted) {
        setMessage("Thanh toán thành công!");
        onSuccess(orderCode);
      } else {
        toast({
          title: "Thanh toán chưa hoàn tất",
          description:
            "Hệ thống chưa nhận được thanh toán. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error checking manual payment:", error);
      toast({
        title: "Lỗi xác nhận",
        description:
          "Không thể xác nhận trạng thái thanh toán. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  };

  // Handle cancel with PayOS API call
  const handleCancel = async () => {
    if (!orderCode) {
      toast({
        title: "Không thể hủy thanh toán",
        description: "Không tìm thấy mã giao dịch",
        variant: "destructive",
      });
      return;
    }

    // Hiển thị toast thông báo đang hủy giao dịch
    toast({
      title: "Đang hủy giao dịch",
      description: "Vui lòng đợi trong giây lát...",
    });

    try {
      console.log("Sending cancel request for:", orderCode);
      const response = await apiRequest(
        "POST",
        `/api/payos/cancel/${orderCode}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error during cancel:", errorData);
        throw new Error(errorData.error || "Không thể hủy thanh toán");
      }

      const result = await response.json();
      console.log("Cancel payment response:", result);

      // Xóa thông tin thanh toán hiện tại
      setQrCode(null);
      setOrderCode(null);
      setCheckoutUrl(null);
      setCountdown(0);

      // Hiển thị thông báo thành công
      toast({
        title: "Đã hủy thanh toán",
        description: "Giao dịch đã được hủy thành công",
        variant: "default",
      });

      // Gọi callback nếu có
      if (onCancel) onCancel();
    } catch (error: any) {
      console.error("Error cancelling payment:", error);
      toast({
        title: "Lỗi hủy thanh toán",
        description: error.message || "Đã xảy ra lỗi khi hủy thanh toán",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {message ? (
        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 font-medium">{message}</p>
          <Button
            onClick={() => setMessage("")}
            variant="outline"
            className="mt-2"
          >
            Quay lại
          </Button>
        </div>
      ) : (
        <>
          {!qrCode ? (
            <div className="w-full">
              {isCreatingLink ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Đang tạo mã thanh toán...</span>
                </div>
              ) : (
                <Button className="w-full" onClick={handleCreatePayment}>
                  Thanh toán qua PayOS
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col items-center space-y-4">
                <h3 className="font-semibold text-lg">Quét mã để thanh toán</h3>

                {countdown > 0 && (
                  <div className="text-center">
                    <span className="text-sm text-gray-500">
                      Thời gian còn lại:{" "}
                    </span>
                    <span className="font-medium">{formatTime(countdown)}</span>
                  </div>
                )}

                <div className="bg-white p-2 border border-gray-200 rounded-md">
                  {qrCode ? (
                    <>
                      {/* Phát hiện loại QR code và hiển thị phù hợp */}
                      {qrCode.startsWith("000201") ||
                      qrCode.startsWith("00020101") ? (
                        // QR Code VietQR 
                        <div className="w-48 mx-auto">
                          {/* Hiển thị mã QR bằng react-qr-code */}
                          <div className="bg-white p-3 border border-gray-200 rounded-lg mb-3">
                            <ReactQRCode
                              value={qrCode}
                              size={180}
                              level="M"
                              className="mx-auto"
                            />
                          </div>
                          
                          <div className="text-xs text-left w-full bg-yellow-50 p-2 rounded-md border border-yellow-200">
                            <p className="font-medium text-yellow-700 mb-1">
                              Thông tin chuyển khoản:
                            </p>
                            <p>
                              - Mã GD: <span className="font-medium">{orderCode}</span>
                            </p>
                            <p>
                              - Số tiền:{" "}
                              <span className="font-medium">
                                {amount?.toLocaleString("vi-VN")}đ
                              </span>
                            </p>
                          </div>
                        </div>
                      ) : qrCode.startsWith("data:image") ? (
                        // QR code dạng data URL
                        <img
                          src={qrCode}
                          alt="QR Code thanh toán"
                          className="w-48 h-48 mx-auto"
                        />
                      ) : qrCode.startsWith("http") ? (
                        // QR code dạng URL
                        <img
                          src={qrCode}
                          alt="QR Code thanh toán"
                          className="w-48 h-48 mx-auto"
                        />
                      ) : (
                        // QR code dạng chuỗi - sử dụng React QR Code
                        <div className="w-48 mx-auto">
                          <ReactQRCode 
                            value={qrCode} 
                            size={192}
                            level="M"
                            className="mx-auto"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-48 h-48 mx-auto flex items-center justify-center bg-gray-100">
                      <p className="text-sm text-gray-500">
                        Không thể tải mã QR
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-center space-y-1">
                  <p className="text-sm text-gray-700">
                    Số tiền:{" "}
                    <span className="font-medium">
                      {new Intl.NumberFormat("vi-VN").format(amount)} VND
                    </span>
                  </p>
                  <p className="text-sm text-gray-700">
                    Mã giao dịch:{" "}
                    <span className="font-medium">{orderCode}</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                  {checkoutUrl && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open(checkoutUrl, "_blank")}
                    >
                      Mở cổng thanh toán
                    </Button>
                  )}

                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={handleConfirmPayment}
                  >
                    Tôi đã thanh toán
                  </Button>

                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={handleCancel}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
