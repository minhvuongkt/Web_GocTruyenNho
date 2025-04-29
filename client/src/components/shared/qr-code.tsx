import { useMemo, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

interface QRCodeProps {
  amount: number;
  accountNo: string;
  accountName: string;
  bankId: string;
  addInfo: string;
  template?: 'compact' | 'compact2' | 'qr_only';
}

export function QRCode({ amount, accountNo, accountName, bankId, addInfo, template = 'compact2' }: QRCodeProps) {
  const [warningVisible, setWarningVisible] = useState(false);

  // Generate VietQR URL with parameters
  const qrUrl = useMemo(() => {
    const encodedAccountName = encodeURIComponent(accountName);
    const encodedAddInfo = encodeURIComponent(addInfo);
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.jpg?amount=${amount}&addInfo=${encodedAddInfo}&accountName=${encodedAccountName}`;
  }, [accountNo, accountName, bankId, amount, addInfo, template]);

  // Setup leave page warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Setup visibility warning
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setWarningVisible(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 text-center">
        <p className="text-sm text-muted-foreground mb-1">Quét mã để thanh toán</p>
      </div>
      
      {warningVisible && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-3 max-w-xs">
          <div className="flex items-center gap-2 text-amber-700 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>
              Đừng quên quay lại xác nhận giao dịch sau khi thanh toán
            </span>
          </div>
        </div>
      )}
      
      <img 
        src={qrUrl} 
        alt="VietQR Payment QR Code" 
        className="rounded-md max-w-full h-auto shadow-lg"
        style={{ maxWidth: '300px' }}
      />
      
      <div className="mt-2 text-center">
        <p className="text-xs text-muted-foreground">Sử dụng app ngân hàng để quét</p>
      </div>
    </div>
  );
}