import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { extractPayOSPaymentData, isValidPayOSResponse, extractPayOSErrorMessage } from '@/utils/payos-helpers';
import QRCode from 'qrcode';

// Add a declaration file for QRCode to fix TypeScript error
declare module 'qrcode';

interface PayOSDirectCheckoutProps {
  amount: number;
  description?: string;
  onSuccess: (orderCode: string) => void;
  onCancel?: () => void;
  expiryTime?: number; // Thời gian hết hạn (giây), mặc định là 10 phút (600 giây)
}

export function PayOSDirectCheckout({ 
  amount, 
  description = "Nạp tiền", 
  onSuccess, 
  onCancel,
  expiryTime = 600 // Mặc định 10 phút
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
    
    try {
      // Generate a unique order code
      const newOrderCode = `ORDER${Date.now().toString().slice(-6)}`;
      setOrderCode(newOrderCode);
      
      // Generate appropriate return/cancel URLs
      const appUrl = window.location.origin;
      const returnUrl = `${appUrl}/payment-callback?code=00&status=PAID&orderCode=${newOrderCode}`;
      const cancelUrl = `${appUrl}/payment-callback?cancel=true&orderCode=${newOrderCode}`;
      
      // Call API to create payment with expiry time
      const response = await apiRequest("POST", "/api/payos/create-payment", {
        amount,
        orderCode: newOrderCode,
        description: description.length > 25 ? description.substring(0, 25) : description,
        returnUrl,
        cancelUrl,
        expiryTime // Truyền thời gian hết hạn đã được cấu hình
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server không phản hồi');
      }

      const result = await response.json();
      console.log("PayOS response:", result);
      
      // Sử dụng utility để trích xuất dữ liệu từ các định dạng khác nhau
      const paymentData = extractPayOSPaymentData(result);
      console.log("Extracted payment data:", paymentData);
      
      // Kiểm tra xem phản hồi có hợp lệ không
      if (!isValidPayOSResponse(paymentData)) {
        throw new Error(extractPayOSErrorMessage(result));
      }
      
      // Lưu giá trị đã trích xuất
      setQrCode(paymentData.qrCode || null);
      setCheckoutUrl(paymentData.checkoutUrl || null);
      
      // Đặt thời gian đếm ngược dựa trên thời gian hết hạn từ server
      // Nếu server trả về thời gian hết hạn, sử dụng giá trị này
      if (paymentData.expiresAt) {
        const expiryDate = new Date(paymentData.expiresAt);
        const now = new Date();
        const secondsRemaining = Math.floor((expiryDate.getTime() - now.getTime()) / 1000);
        
        // Đảm bảo không đặt giá trị âm
        setCountdown(secondsRemaining > 0 ? secondsRemaining : expiryTime);
      } else {
        // Sử dụng giá trị mặc định nếu server không trả về thời gian hết hạn
        setCountdown(expiryTime);
      }
      
    } catch (error: any) {
      toast({
        title: 'Lỗi tạo thanh toán',
        description: error.message || 'Đã xảy ra lỗi, vui lòng thử lại sau',
        variant: 'destructive',
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
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          
          // Khi hết thời gian, tự động hủy thanh toán hiện tại
          toast({
            title: "Hết thời gian thanh toán",
            description: "Mã QR đã hết hiệu lực. Vui lòng tạo mới để tiếp tục.",
            variant: "destructive"
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
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Poll for payment status if we have an orderCode
  useEffect(() => {
    if (!orderCode || countdown <= 0) return;
    
    const checkStatus = async () => {
      try {
        const response = await apiRequest("GET", `/api/payos/status/${orderCode}`);
        
        if (!response.ok) return;
        
        const data = await response.json();
        console.log("Payment status check response:", data);
        
        // Sử dụng utility để trích xuất dữ liệu từ các định dạng khác nhau
        const paymentData = extractPayOSPaymentData(data);
        
        // Kiểm tra trạng thái thanh toán
        const isPaid = paymentData.status === 'PAID';
        
        if (isPaid) {
          setMessage("Thanh toán thành công!");
          onSuccess(orderCode);
          
          // Stop checking after success
          return;
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    };
    
    // Check every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    
    return () => clearInterval(interval);
  }, [orderCode, countdown, onSuccess]);

  // Handle payment completion manually
  const handleConfirmPayment = () => {
    if (!orderCode) return;
    
    toast({
      title: "Đang xác nhận thanh toán",
      description: "Vui lòng đợi trong giây lát..."
    });
    
    // Check payment status immediately
    fetch(`/api/payos/status/${orderCode}`)
      .then(res => res.json())
      .then(data => {
        console.log("Manual payment check response:", data);
        
        // Sử dụng utility để trích xuất dữ liệu từ các định dạng khác nhau
        const paymentData = extractPayOSPaymentData(data);
        
        // Kiểm tra trạng thái thanh toán
        const isPaid = paymentData.status === 'PAID';
        
        if (isPaid) {
          setMessage("Thanh toán thành công!");
          onSuccess(orderCode);
        } else {
          toast({
            title: "Thanh toán chưa hoàn tất",
            description: "Hệ thống chưa nhận được thanh toán. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
            variant: "destructive"
          });
        }
      })
      .catch(err => {
        console.error("Error checking manual payment:", err);
        toast({
          title: "Lỗi xác nhận",
          description: "Không thể xác nhận trạng thái thanh toán. Vui lòng thử lại sau.",
          variant: "destructive"
        });
      });
  };

  // Handle cancel with PayOS API call
  const handleCancel = async () => {
    if (!orderCode) {
      toast({
        title: "Không thể hủy thanh toán",
        description: "Không tìm thấy mã giao dịch",
        variant: "destructive"
      });
      return;
    }
    
    // Hiển thị toast thông báo đang hủy giao dịch
    toast({
      title: "Đang hủy giao dịch",
      description: "Vui lòng đợi trong giây lát..."
    });
    
    try {
      // Gọi API hủy thanh toán - chuyển đổi định dạng orderCode nếu cần
      // Đảm bảo mã giao dịch đúng định dạng mà server mong đợi
      let cancelOrderCode = orderCode;
      
      // Thêm tiền tố ORDER nếu chưa có
      if (!cancelOrderCode.startsWith('ORDER')) {
        cancelOrderCode = `ORDER${cancelOrderCode}`;
      }
      
      console.log("Sending cancel request for:", cancelOrderCode);
      const response = await apiRequest("POST", `/api/payos/cancel/${cancelOrderCode}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error during cancel:", errorData);
        throw new Error(errorData.desc || 'Không thể hủy thanh toán');
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
        variant: "default"
      });
      
      // Gọi callback nếu có
      if (onCancel) onCancel();
    } catch (error: any) {
      console.error("Error cancelling payment:", error);
      toast({
        title: "Lỗi hủy thanh toán",
        description: error.message || "Đã xảy ra lỗi khi hủy thanh toán",
        variant: "destructive"
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
                <Button
                  className="w-full"
                  onClick={handleCreatePayment}
                >
                  Thanh toán qua PayOS
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col items-center space-y-4">
                <h3 className="font-semibold text-lg">Quét mã để thanh toán</h3>
                
                {countdown > 0 ? (
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                    countdown < 60 ? 'bg-red-50 text-red-700 border border-red-200' : 
                    countdown < 180 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 
                    'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    <Clock className={`h-4 w-4 ${
                      countdown < 60 ? 'text-red-600' : 
                      countdown < 180 ? 'text-yellow-600' : 
                      'text-blue-600'
                    }`} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Thời gian còn lại:</span>
                      <span className="font-semibold">{formatTime(countdown)}</span>
                      {countdown < 60 && (
                        <span className="text-xs">Thanh toán sẽ hết hạn trong ít phút!</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-md flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <div>
                      <span className="text-sm font-medium">Hết thời gian thanh toán</span>
                      <p className="text-xs">Vui lòng tạo mã thanh toán mới</p>
                    </div>
                  </div>
                )}
                
                <div className="bg-white p-2 border border-gray-200 rounded-md">
                  {qrCode && countdown > 0 ? (
                    <>
                      {/* Thử nhiều cách khác nhau để hiển thị mã QR */}
                      {qrCode.startsWith('000201') || qrCode.startsWith('00020101') ? (
                        <div className="w-48 h-48 mx-auto flex flex-col items-center justify-center bg-gray-50 p-3 text-center">
                          <p className="text-sm text-gray-700 font-medium mb-2">Mở ứng dụng ngân hàng</p>
                          <p className="text-xs text-gray-500 mb-3">Quét mã VietQR hoặc chuyển khoản theo thông tin bên dưới</p>
                          <div className="border border-gray-200 rounded-md p-2 bg-white mb-2">
                            <p className="text-xs font-medium">Mã giao dịch</p>
                            <p className="text-sm text-gray-600 break-all">{orderCode}</p>
                          </div>
                          <div className="text-xs text-left w-full bg-yellow-50 p-2 rounded-md border border-yellow-200">
                            <p className="font-medium text-yellow-700 mb-1">Thông tin chuyển khoản:</p>
                            <p>- Nội dung CK: <span className="font-medium">{orderCode}</span></p>
                            <p>- Số tiền: <span className="font-medium">{amount?.toLocaleString('vi-VN')}đ</span></p>
                          </div>
                        </div>
                      ) : qrCode.startsWith('data:image') ? (
                        <img 
                          src={qrCode} 
                          alt="QR Code thanh toán" 
                          className="w-48 h-48 mx-auto"
                        />
                      ) : qrCode.startsWith('http') ? (
                        <div id="qrcode-container" className="w-48 h-48 mx-auto">
                          {/* Tự tạo QR code thay vì sử dụng URL từ PayOS */}
                          {useEffect(() => {
                            if (qrCode.startsWith('http')) {
                              const container = document.getElementById('qrcode-container');
                              if (container) {
                                container.innerHTML = ''; // Xóa nội dung cũ
                                
                                // Tạo QR code sử dụng thư viện QRCode
                                QRCode.toCanvas(
                                  container, 
                                  qrCode,
                                  { 
                                    width: 192,
                                    margin: 2,
                                    color: {
                                      dark: '#000',
                                      light: '#fff'
                                    }
                                  }, 
                                  (error) => {
                                    if (error) {
                                      console.error('Error generating QR code:', error);
                                      // Fallback to image if QR code generation fails
                                      const img = document.createElement('img');
                                      img.src = qrCode;
                                      img.alt = 'QR Code thanh toán';
                                      img.className = 'w-48 h-48 mx-auto';
                                      container.appendChild(img);
                                    }
                                  }
                                );
                              }
                            }
                          }, [qrCode])}
                        </div>
                      ) : (
                        <div id="qrcode-data-container" className="w-48 h-48 mx-auto">
                          {/* Hiển thị chuỗi VietQR dưới dạng QR code */}
                          <div className="w-48 h-48 mx-auto flex flex-col items-center justify-center">
                            {React.useEffect(() => {
                              const renderQRCode = async () => {
                                try {
                                  // Sử dụng thư viện QRCode để tạo QR code từ chuỗi VietQR
                                  if (qrCode && !qrCode.startsWith('data:') && !qrCode.startsWith('http')) {
                                    const container = document.getElementById('qrcode-data-container');
                                    if (container) {
                                      container.innerHTML = ''; // Xóa nội dung cũ
                                      
                                      // Tạo canvas element trước
                                      const canvas = document.createElement('canvas');
                                      canvas.width = 192;
                                      canvas.height = 192;
                                      container.appendChild(canvas);
                                      
                                      // Tạo QR code
                                      await QRCode.toCanvas(
                                        canvas,
                                        qrCode,
                                        { 
                                          width: 192,
                                          margin: 2,
                                          color: {
                                            dark: '#000',
                                            light: '#fff'
                                          },
                                          errorCorrectionLevel: 'H'
                                        }
                                      );
                                    }
                                  }
                                } catch (err) {
                                  console.error('Failed to generate VietQR code:', err);
                                  
                                  // Fall back to showing a text message
                                  const container = document.getElementById('qrcode-data-container');
                                  if (container) {
                                    container.innerHTML = '';
                                    
                                    const fallbackMsg = document.createElement('div');
                                    fallbackMsg.className = 'w-48 h-48 flex flex-col items-center justify-center text-center';
                                    fallbackMsg.innerHTML = `
                                      <p class="text-sm text-gray-700 font-medium mb-2">Mở ứng dụng ngân hàng</p>
                                      <p class="text-xs text-gray-500 mb-2">Quét mã VietQR hoặc chuyển khoản theo thông tin</p>
                                      <div class="p-2 bg-gray-50 border border-gray-200 rounded-md w-full">
                                        <p class="text-xs text-gray-800 font-medium">Mã giao dịch:</p>
                                        <p class="text-xs text-gray-600 break-all">${orderCode || 'N/A'}</p>
                                      </div>
                                    `;
                                    container.appendChild(fallbackMsg);
                                  }
                                }
                              };
                              
                              renderQRCode();
                            }, [qrCode, orderCode])}
                          </div>
                        </div>
                      )}
                    </>
                  ) : countdown <= 0 ? (
                    <div className="w-48 h-48 mx-auto flex flex-col items-center justify-center bg-red-50 border border-red-200 rounded-md p-4">
                      <Clock className="h-10 w-10 text-red-500 mb-2" />
                      <p className="text-sm font-medium text-red-700 text-center">Hết thời gian thanh toán</p>
                      <p className="text-xs text-red-600 text-center mt-1">Vui lòng tạo mới mã QR để tiếp tục thanh toán</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={handleCreatePayment}
                      >
                        Tạo mới mã QR
                      </Button>
                    </div>
                  ) : (
                    <div className="w-48 h-48 mx-auto flex items-center justify-center bg-gray-100">
                      <p className="text-sm text-gray-500">Không thể tải mã QR</p>
                    </div>
                  )}
                </div>
                
                <div className="text-center space-y-1">
                  <p className="text-sm text-gray-700">
                    Số tiền: <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(amount)} VND</span>
                  </p>
                  <p className="text-sm text-gray-700">
                    Mã giao dịch: <span className="font-medium">{orderCode}</span>
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                  {countdown > 0 ? (
                    <>
                      {checkoutUrl && (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => window.open(checkoutUrl, '_blank')}
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
                    </>
                  ) : (
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={handleCreatePayment}
                    >
                      Tạo mới mã QR
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}