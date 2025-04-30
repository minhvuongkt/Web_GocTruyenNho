import { useState, useEffect } from "react";
import { Loader2, ExternalLink, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { checkPayOSPaymentStatus } from "@/services/payos-api";

interface PayOSPaymentProps {
  amount: number;
  username: string;
  onSuccess: (transId: string) => void;
  onCancel?: () => void;
}

export function PayOSPayment({
  amount,
  username,
  onSuccess,
  onCancel,
}: PayOSPaymentProps) {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>("Đang chờ thanh toán");
  const [statusColor, setStatusColor] = useState<string>("text-amber-500");
  const { toast } = useToast();

  // Kiểm tra URL xem có callback từ PayOS không
  useEffect(() => {
    const paymentData = new URLSearchParams(window.location.search);
    const status = paymentData.get("status");
    const paymentId = paymentData.get("id");

    // Xử lý callback từ PayOS
    if (status === "success" && paymentId) {
      toast({
        title: "Đang xác nhận thanh toán",
        description: "Vui lòng đợi trong giây lát...",
      });

      // Thông báo thành công và chuyển về tab lịch sử
      onSuccess(paymentId);
      return;
    } else if (status === "cancel" && onCancel) {
      onCancel();
      return;
    }
  }, [onSuccess, onCancel, toast]);

  // Lấy thông tin thanh toán từ API
  useEffect(() => {
    const createPayment = async () => {
      try {
        setLoading(true);

        // Tạo thanh toán qua API
        const response = await apiRequest("POST", "/api/payments", {
          amount: amount,
          method: "payos",
        });

        if (!response.ok) {
          throw new Error("Không thể tạo thanh toán. Vui lòng thử lại sau.");
        }

        const data = await response.json();

        // Lưu thông tin thanh toán
        if (data.paymentLink) {
          setCheckoutUrl(data.paymentLink);
        }

        if (data.qrCode) {
          setQrCode(data.qrCode);
        }

        if (data.payment && data.payment.transactionId) {
          setOrderCode(data.payment.transactionId);
        }

        setStatusText("Đang chờ thanh toán");
        setStatusColor("text-amber-500");
      } catch (err: any) {
        setError(err.message || "Đã xảy ra lỗi khi tạo thanh toán");
        if (onCancel) onCancel();
      } finally {
        setLoading(false);
      }
    };

    createPayment();
  }, [amount, username, onCancel]);

  // Function to check payment status
  const checkPaymentStatus = async () => {
    if (!orderCode) return;

    try {
      setChecking(true);
      setStatusText("Đang kiểm tra trạng thái...");

      const response = await checkPayOSPaymentStatus(orderCode);

      if (response.code !== "00") {
        throw new Error(
          response.desc || "Không thể kiểm tra trạng thái thanh toán",
        );
      }

      if (response.data) {
        const status = response.data.status.toLowerCase();

        if (
          status === "paid" ||
          status === "completed" ||
          status === "success"
        ) {
          setStatusText("Thanh toán thành công");
          setStatusColor("text-green-500");
          toast({
            title: "Thanh toán thành công",
            description: "Tiền đã được cộng vào tài khoản của bạn",
            variant: "default",
          });
          onSuccess(orderCode);
        } else if (status === "pending" || status === "processing") {
          setStatusText("Đang chờ thanh toán");
          setStatusColor("text-amber-500");
        } else {
          setStatusText("Thanh toán thất bại");
          setStatusColor("text-destructive");
          if (onCancel) onCancel();
        }
      }
    } catch (err: any) {
      setError(err.message || "Lỗi khi kiểm tra trạng thái thanh toán");
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Đang khởi tạo thanh toán...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/10">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Lỗi thanh toán</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {qrCode && (
        <div className="flex flex-col items-center mb-4">
          <p className="text-sm text-muted-foreground mb-2">
            Quét mã QR để thanh toán
          </p>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            {qrCode.startsWith("data:image") ? (
              <img src={qrCode} alt="QR Code" className="w-[200px] h-[200px]" />
            ) : (
              <img
                src={`data:image/png;base64,${qrCode}`}
                alt="QR Code"
                className="w-[300px] h-[300px]"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = "none";
                }}
              />
            )}
          </div>
        </div>
      )}

      <div className="text-center">
        <p className="text-sm font-medium">
          Trạng thái:{" "}
          <span className={statusColor}>
            {statusText || "Đang chờ thanh toán"}
          </span>
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        {checkoutUrl && (
          <Button asChild variant="outline" className="gap-1">
            <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Thanh toán trực tuyến
            </a>
          </Button>
        )}

        <Button
          onClick={checkPaymentStatus}
          disabled={checking}
          variant="default"
          className="gap-1"
        >
          {checking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
              Đang kiểm tra...
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 mr-1" />
              Kiểm tra trạng thái
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-2">
        Thanh toán sẽ hết hạn sau 10 phút. Nếu bạn đã thanh toán nhưng chưa được
        cập nhật, vui lòng kiểm tra trạng thái hoặc liên hệ admin.
      </p>
    </div>
  );
}
