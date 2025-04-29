import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from '@/hooks/use-toast';

// Import từ thư viện chính thức của PayOS
import { PayOS } from '@payos/payos-checkout';

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
        
        // Nếu có clientToken từ PayOS, khởi tạo form thanh toán
        if (data.clientToken) {
          // Khởi tạo PayOS với client token
          payOSRef.current = new PayOS(data.clientToken);
          
          // Khởi tạo PayOS checkout form
          if (containerRef.current) {
            payOSRef.current.createPaymentForm({
              container: containerRef.current,
              amount: amount,
              orderId: data.payment?.transactionId || `ORDER_${Date.now()}`,
              description: `Nạp tiền của ${username}`,
              currency: 'VND',
              mode: 'popup', // có thể là 'popup' hoặc 'inline'
              buttonLabel: 'Thanh toán ngay',
              buttonClassName: 'payos-payment-button custom-button',
              onSuccess: (response: any) => {
                toast({
                  title: "Thanh toán thành công",
                  description: "Tiền đã được nạp vào tài khoản của bạn",
                });
                onSuccess(data.payment?.transactionId);
              },
              onError: (error: any) => {
                console.error("PayOS payment error:", error);
                setError("Lỗi thanh toán: " + (error.message || "Vui lòng thử lại sau"));
                if (onCancel) onCancel();
              },
              onCancel: () => {
                toast({
                  title: "Thanh toán đã bị hủy",
                  description: "Bạn đã hủy thanh toán",
                  variant: "destructive"
                });
                if (onCancel) onCancel();
              }
            });
          }
        } else {
          throw new Error('Không nhận được token thanh toán từ PayOS');
        }
      } catch (err: any) {
        console.error("PayOS initialization error:", err);
        setError(err.message || 'Đã xảy ra lỗi khi khởi tạo thanh toán');
      } finally {
        setLoading(false);
      }
    };
    
    initPayment();
    
    // Cleanup function
    return () => {
      if (payOSRef.current) {
        payOSRef.current = null;
      }
    };
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
      
      {/* Container cho form thanh toán PayOS */}
      <div ref={containerRef} className="w-full min-h-[300px]"></div>
      
      <div className="text-xs text-muted-foreground mt-4 text-center">
        <p>
          Giao dịch được bảo mật bởi PayOS. Nếu bạn gặp vấn đề trong quá trình thanh toán, 
          vui lòng liên hệ với chúng tôi để được hỗ trợ.
        </p>
      </div>
    </div>
  );
}