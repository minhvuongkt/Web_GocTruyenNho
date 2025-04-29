import { useState, useEffect } from 'react';
import { createPayOSPaymentLink, checkPayOSPaymentStatus } from '@/services/payos-api';
import { Loader2, ExternalLink, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

interface PayOSPaymentProps {
  payment: {
    id: number;
    transactionId: string;
    amount: number;
  };
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function PayOSPayment({ payment, onSuccess, onError }: PayOSPaymentProps) {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [statusColor, setStatusColor] = useState<string>('text-muted-foreground');
  const { toast } = useToast();

  // Create payment link on component mount
  useEffect(() => {
    async function createPayment() {
      try {
        setLoading(true);
        
        const paymentData = {
          amount: payment.amount,
          orderCode: payment.transactionId,
          description: `Nạp tiền vào tài khoản`,
          returnUrl: `${window.location.origin}/payment?status=success`,
          cancelUrl: `${window.location.origin}/payment?status=cancel`, 
          expiredAt: Math.floor(Date.now() / 1000) + 600 // 10 minutes expiry
        };
        
        const response = await createPayOSPaymentLink(paymentData);
        
        if (response.code !== '00') {
          throw new Error(response.desc || 'Không thể tạo thanh toán');
        }
        
        if (response.data) {
          setOrderCode(response.data.orderCode);
          setCheckoutUrl(response.data.checkoutUrl);
          setQrCode(response.data.qrCode);
          setStatusText('Đang chờ thanh toán');
          setStatusColor('text-amber-500');
        }
      } catch (err: any) {
        setError(err.message || 'Lỗi khi tạo thanh toán');
        onError(err.message || 'Lỗi khi tạo thanh toán');
      } finally {
        setLoading(false);
      }
    }

    createPayment();
  }, [payment, onError]);

  // Function to check payment status
  const checkPaymentStatus = async () => {
    if (!orderCode) return;
    
    try {
      setChecking(true);
      setStatusText('Đang kiểm tra trạng thái...');
      
      const response = await checkPayOSPaymentStatus(orderCode);
      
      if (response.code !== '00') {
        throw new Error(response.desc || 'Không thể kiểm tra trạng thái thanh toán');
      }
      
      if (response.data) {
        const status = response.data.status.toLowerCase();
        
        if (status === 'paid' || status === 'completed' || status === 'success') {
          setStatusText('Thanh toán thành công');
          setStatusColor('text-green-500');
          toast({
            title: "Thanh toán thành công",
            description: "Tiền đã được cộng vào tài khoản của bạn",
            variant: "default"
          });
          onSuccess();
        } else if (status === 'pending' || status === 'processing') {
          setStatusText('Đang chờ thanh toán');
          setStatusColor('text-amber-500');
        } else {
          setStatusText('Thanh toán thất bại');
          setStatusColor('text-destructive');
          onError('Thanh toán thất bại hoặc bị hủy');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi kiểm tra trạng thái thanh toán');
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
          <p className="text-sm text-muted-foreground mb-2">Quét mã QR để thanh toán</p>
          <img src={qrCode} alt="PayOS QR Code" className="max-w-[250px] rounded" />
        </div>
      )}
      
      <div className="text-center">
        <p className="text-sm font-medium">Trạng thái: <span className={statusColor}>{statusText || 'Đang chờ thanh toán'}</span></p>
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
        Thanh toán sẽ hết hạn sau 10 phút. Nếu bạn đã thanh toán nhưng chưa được cập nhật, 
        vui lòng kiểm tra trạng thái hoặc liên hệ admin.
      </p>
    </div>
  );
}