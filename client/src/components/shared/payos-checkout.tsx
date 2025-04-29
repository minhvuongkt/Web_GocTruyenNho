import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from '@/hooks/use-toast';

// Không import trực tiếp PayOS ở đây, sẽ sử dụng script từ CDN
// @payos/node được sử dụng ở phía server

interface PayOSCheckoutProps {
  amount: number;
  username: string;
  onSuccess: (transId: string) => void;
  onCancel?: () => void;
}

export function PayOSCheckout({ amount, username, onSuccess, onCancel }: PayOSCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const { toast } = useToast();
  
  const payOSRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Khởi tạo thanh toán
    const initPayment = async () => {
      try {
        setLoading(true);
        
        // Tạo giao dịch mới qua API backend
        const response = await apiRequest('POST', '/api/payments', {
          amount: amount,
          method: 'payos'
        });
        
        if (!response.ok) {
          throw new Error('Không thể tạo thanh toán. Vui lòng thử lại sau.');
        }
        
        const data = await response.json();
        setPaymentData(data);
        
        // Chuyển sang chế độ thanh toán chuyển khoản qua NgânLượng/PayOS
        setLoading(false);
      } catch (err: any) {
        console.error("PayOS initialization error:", err);
        setError(err.message || 'Đã xảy ra lỗi khi khởi tạo thanh toán');
        setLoading(false);
      }
    };
    
    initPayment();
  }, [amount, username, toast, onSuccess, onCancel]);
  
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
      <div className="text-center mb-4">
        <p className="font-medium text-lg mb-2">Thanh toán qua PayOS</p>
        <p className="text-sm text-muted-foreground">
          An toàn, bảo mật và nhanh chóng. Hỗ trợ nhiều phương thức thanh toán khác nhau.
        </p>
      </div>
      
      {paymentData && paymentData.paymentLink && (
        <div className="flex flex-col items-center gap-4">
          {paymentData.qrCode && (
            <div className="p-4 bg-white rounded-lg shadow">
              <img 
                src={paymentData.qrCode} 
                alt="QR Code thanh toán" 
                className="w-full max-w-[250px]" 
              />
              <p className="text-center text-sm mt-2">Quét mã QR để thanh toán</p>
            </div>
          )}
          
          <Button 
            asChild 
            className="w-full max-w-xs"
          >
            <a 
              href={paymentData.paymentLink} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => {
                // Theo dõi khi người dùng click vào link thanh toán
                console.log("Redirecting to payment page:", paymentData.paymentLink);
                
                // Sau khi chuyển đến trang thanh toán, bắt đầu kiểm tra trạng thái
                const checkInterval = window.setInterval(() => {
                  // Kiểm tra trạng thái thanh toán mỗi 10 giây
                  if (paymentData.payment?.transactionId) {
                    apiRequest("GET", `/api/payments/status/${paymentData.payment.transactionId}`)
                      .then(res => res.json())
                      .then(data => {
                        if (data.status === "completed") {
                          // Nếu thanh toán thành công, thông báo và xóa interval
                          window.clearInterval(checkInterval);
                          toast({
                            title: "Thanh toán thành công",
                            description: "Tiền đã được nạp vào tài khoản của bạn",
                          });
                          onSuccess(paymentData.payment.transactionId);
                        }
                      })
                      .catch(error => {
                        console.error("Error checking payment status:", error);
                      });
                  }
                }, 10000);
                
                // Lưu interval ID vào localStorage để có thể xóa nếu cần
                window.localStorage.setItem("paymentCheckInterval", checkInterval.toString());
              }}
            >
              Thanh toán ngay
            </a>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full max-w-xs"
            onClick={() => {
              if (onCancel) onCancel();
            }}
          >
            Hủy thanh toán
          </Button>
        </div>
      )}
      
      <div className="text-xs text-muted-foreground mt-4 text-center">
        <p>
          Giao dịch được bảo mật bởi PayOS. Nếu bạn đã thanh toán nhưng hệ thống chưa ghi nhận,
          vui lòng liên hệ với chúng tôi để được hỗ trợ.
        </p>
      </div>
    </div>
  );
}