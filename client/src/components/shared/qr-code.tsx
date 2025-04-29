import { useMemo } from "react";

interface QRCodeProps {
  amount: number;
  accountNo: string;
  accountName: string;
  bankId: string;
  addInfo: string;
}

export function QRCode({ amount, accountNo, accountName, bankId, addInfo }: QRCodeProps) {
  // Generate VietQR URL with parameters
  const qrUrl = useMemo(() => {
    const encodedAccountName = encodeURIComponent(accountName);
    const encodedAddInfo = encodeURIComponent(addInfo);
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.jpg?amount=${amount}&addInfo=${encodedAddInfo}&accountName=${encodedAccountName}`;
  }, [accountNo, accountName, bankId, amount, addInfo]);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 text-center">
        <p className="text-sm text-muted-foreground mb-1">Quét mã để thanh toán</p>
      </div>
      
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