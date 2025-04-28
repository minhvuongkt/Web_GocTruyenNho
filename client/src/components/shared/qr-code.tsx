import { useEffect, useState } from 'react';
import { generateVietQR, getBankAcqId } from '@/services/vietqr-api';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface QRCodeProps {
  amount: number;
  accountNo: string;
  accountName: string;
  bankId: string;
  addInfo?: string;
}

export function QRCode({ amount, accountNo, accountName, bankId, addInfo }: QRCodeProps) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQRCode() {
      try {
        setLoading(true);
        setError(null);
        
        // Convert bank ID to VietQR acqId format
        const acqId = getBankAcqId(bankId);
        
        // Generate QR code
        const qrData = await generateVietQR({
          accountNo,
          accountName,
          acqId,
          amount,
          addInfo: addInfo || `Nạp tiền ${amount}đ`
        });
        
        setQrImage(qrData);
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Không thể tạo mã QR. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    }

    if (amount > 0 && accountNo && bankId) {
      fetchQRCode();
    } else {
      setError('Thiếu thông tin thanh toán');
      setLoading(false);
    }
  }, [amount, accountNo, accountName, bankId, addInfo]);

  if (loading) {
    return (
      <div className="flex flex-col items-center p-4">
        <Skeleton className="h-48 w-48 rounded" />
        <Skeleton className="h-4 w-32 mt-2" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Lỗi</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      <Card className="p-2 border-2 border-primary">
        {qrImage && <img src={qrImage} alt="QR Code" className="w-48 h-48" />}
      </Card>
      <div className="mt-4 text-center">
        <p className="font-semibold">Quét mã QR để thanh toán</p>
        <Badge variant="outline" className="mt-2">{new Intl.NumberFormat('vi-VN').format(amount)}đ</Badge>
      </div>
    </div>
  );
}