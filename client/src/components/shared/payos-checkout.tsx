import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, AlertTriangle, QrCode, CreditCard, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

interface PayOSCheckoutProps {
  amount: number;
  username: string;
  onSuccess: (transId: string) => void;
  onCancel?: () => void;
  returnUrl?: string;
}

export function PayOSCheckout({ amount, username, onSuccess, onCancel, returnUrl }: PayOSCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
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

  // Tính thời gian còn lại cho thanh toán
  useEffect(() => {
    if (!paymentData || !paymentData.expiresAt) return;
    
    const expiryTime = new Date(paymentData.expiresAt).getTime();
    
    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const diff = expiryTime - now;
      
      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        setError('Hết thời gian thanh toán. Vui lòng tạo thanh toán mới.');
      } else {
        setTimeLeft(Math.floor(diff / 1000));
      }
    };
    
    // Cập nhật ngay lập tức
    updateTimeLeft();
    
    // Cập nhật mỗi giây
    const interval = setInterval(updateTimeLeft, 1000);
    
    return () => clearInterval(interval);
  }, [paymentData]);

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

  // Thêm navigation warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (paymentData && !error && timeLeft && timeLeft > 0) {
        const message = 'Bạn có đang trong quá trình thanh toán. Bạn có chắc chắn muốn rời đi?';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    // Xử lý đối với các router navigation
    const handleRouteChange = () => {
      if (paymentData && !error && timeLeft && timeLeft > 0) {
        setIsLeaving(true);
        throw new Error('navigation aborted');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Thêm handler cho router navigation nếu cần

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Xóa handler cho router nếu cần
    };
  }, [paymentData, error, timeLeft]);

  // Format thời gian còn lại
  const formatTimeLeft = useCallback(() => {
    if (timeLeft === null) return '';
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  // Xử lý xác nhận đã thanh toán
  const handleConfirmPayment = async () => {
    try {
      if (!paymentData || !paymentData.payment || !paymentData.payment.transactionId) {
        throw new Error('Không tìm thấy thông tin thanh toán');
      }
      
      const response = await apiRequest('POST', '/api/payments/confirm', {
        transactionId: paymentData.payment.transactionId,
        returnUrl: returnUrl || '/'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể xác nhận thanh toán');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Đã xác nhận thanh toán',
        description: 'Chúng tôi sẽ kiểm tra và cập nhật tài khoản của bạn',
      });
      
      // Nếu có URL chuyển hướng thì sử dụng nó
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        onSuccess(paymentData.payment.transactionId);
      }
    } catch (err: any) {
      toast({
        title: 'Lỗi xác nhận thanh toán',
        description: err.message || 'Đã xảy ra lỗi, vui lòng thử lại sau',
        variant: 'destructive',
      });
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
    <>
      <div className="flex flex-col space-y-4">
        <div className="text-center mb-2">
          <p className="font-medium text-lg mb-1">Thanh toán qua PayOS</p>
          <p className="text-sm text-muted-foreground">
            An toàn, bảo mật và nhanh chóng. Hỗ trợ nhiều phương thức thanh toán.
          </p>
          
          {timeLeft !== null && (
            <div className="mt-2 flex items-center justify-center space-x-1 text-sm font-medium">
              <Clock className="h-4 w-4 text-orange-500" />
              <span>Thời gian còn lại: </span>
              <span className={`${timeLeft < 60 ? 'text-red-500' : 'text-orange-500'} font-bold`}>
                {formatTimeLeft()}
              </span>
            </div>
          )}
        </div>
        
        {paymentData && paymentData.paymentLink && (
          <div className="flex flex-col items-center gap-4 mt-2">
            {paymentData.qrCode && (
              <div className="p-4 bg-white rounded-lg shadow-md">
                <img 
                  src={paymentData.qrCode} 
                  alt="QR Code thanh toán" 
                  className="w-full max-w-[250px]" 
                />
                <p className="text-center text-sm mt-2 font-medium">Quét mã QR để thanh toán</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-3 w-full max-w-md">
              <Button 
                asChild 
                className="w-full"
                variant="default"
              >
                <a 
                  href={paymentData.paymentLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Thanh toán ngay
                </a>
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={handleConfirmPayment}
              >
                Tôi đã thanh toán
              </Button>
              
              {onCancel && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={onCancel}
                >
                  Hủy thanh toán
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Dialog xác nhận khi người dùng thoát */}
      <Dialog open={isLeaving} onOpenChange={setIsLeaving}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bạn đang trong quá trình thanh toán</DialogTitle>
            <DialogDescription>
              Nếu bạn rời đi, thanh toán của bạn sẽ không được hoàn tất. Bạn có chắc chắn muốn rời đi?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 sm:justify-center">
            <Button 
              variant="destructive"
              onClick={() => {
                setIsLeaving(false);
                if (onCancel) onCancel();
              }}
            >
              Rời đi
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsLeaving(false)}
            >
              Ở lại thanh toán
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}