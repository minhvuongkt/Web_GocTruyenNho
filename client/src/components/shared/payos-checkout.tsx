import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from '@/hooks/use-toast';

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
  const payosFormRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Kiểm tra URL xem có callback từ PayOS không
  useEffect(() => {
    const paymentData = new URLSearchParams(window.location.search);
    const status = paymentData.get('status');
    const paymentId = paymentData.get('id');
    
    // Xử lý callback từ PayOS
    if (status === 'success' && paymentId) {
      toast({
        title: "Đang xác nhận thanh toán",
        description: "Vui lòng đợi trong giây lát..."
      });
      
      // Thông báo thành công và chuyển về tab lịch sử
      onSuccess(paymentId);
      return;
    } else if (status === 'cancel' && onCancel) {
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
        const response = await apiRequest('POST', '/api/payments', {
          amount: amount,
          method: 'payos'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Không thể tạo thanh toán. Vui lòng thử lại sau.');
        }
        
        const data = await response.json();
        setPaymentData(data);
      } catch (err: any) {
        setError(err.message || 'Đã xảy ra lỗi khi tạo thanh toán');
        console.error("PayOS payment error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    createPayment();
  }, [amount, username]);

  // Khởi tạo PayOS form khi có dữ liệu
  useEffect(() => {
    // Nếu không có PayOS Client Token hoặc chưa có dữ liệu, không làm gì cả
    if (!paymentData || !paymentData.clientToken || !payosFormRef.current) return;

    // Thêm script PayOS từ CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.payos.vn/checkout/checkout.js';
    script.async = true;
    script.onload = () => {
      // Tạo đối tượng PayOS từ window object
      const PayOS = (window as any).PayOS;
      if (!PayOS) {
        console.error('PayOS script loaded but PayOS object not found');
        setError('Không thể khởi tạo PayOS. Vui lòng thử lại sau.');
        return;
      }

      try {
        // Khởi tạo PayOS Checkout
        const payOS = new PayOS(paymentData.clientToken);
        
        // Khởi tạo thanh toán
        payOS.checkout({
          containerId: 'payos-checkout-container',
          amount: amount,
          orderId: paymentData.payment.transactionId,
          description: `Nạp tiền tài khoản cho ${username}`,
          currency: 'VND',
          onSuccess: (data: any) => {
            console.log('Payment success:', data);
            onSuccess(paymentData.payment.transactionId);
          },
          onError: (error: any) => {
            console.error('Payment error:', error);
            setError('Thanh toán thất bại: ' + (error.message || 'Lỗi không xác định'));
          },
          onCancel: () => {
            console.log('Payment cancelled');
            if (onCancel) onCancel();
          }
        });
      } catch (err: any) {
        console.error('Error initializing PayOS:', err);
        setError(`Không thể khởi tạo PayOS: ${err.message || 'Lỗi không xác định'}`);
      }
    };

    script.onerror = () => {
      setError('Không thể tải thư viện PayOS. Vui lòng thử lại sau.');
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [paymentData, amount, username, onSuccess, onCancel]);

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
            >
              Thanh toán bằng ví điện tử/Thẻ
            </a>
          </Button>
        </div>
      )}
      
      {/* Container cho PayOS Checkout form */}
      <div id="payos-checkout-container" ref={payosFormRef} className="min-h-[400px]"></div>
    </div>
  );
}