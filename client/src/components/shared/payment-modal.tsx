import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { nanoid } from "nanoid";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { generateQRCode } from "@/utils/qrcode-generator";
import { QRCode } from "@/components/shared/qr-code";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Clipboard, ClipboardCheck } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
}

export function PaymentModal({
  isOpen,
  onClose,
  defaultAmount = 50000
}: PaymentModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<{
    account: boolean;
    content: boolean;
  }>({ account: false, content: false });

  // Bank account details (in a real app, this would come from the backend)
  const bankDetails = {
    bankName: "MB Bank",
    accountNumber: "9999123456789",
    accountName: "GocTruyenNho",
  };

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      // Validate amount
      const numAmount = parseInt(amount);
      if (isNaN(numAmount) || numAmount < 10000 || numAmount % 1000 !== 0) {
        throw new Error("Số tiền phải ít nhất 10,000 VNĐ và chia hết cho 1,000");
      }

      const response = await apiRequest("POST", "/api/payments", {
        amount: numAmount,
        method: paymentMethod
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Tạo giao dịch thành công",
        description: "Vui lòng hoàn tất thanh toán để nạp tiền vào tài khoản."
      });
      
      // Set the transaction ID
      setTransactionId(data.transactionId);
      
      // Generate QR code
      const qrContent = generateQRCode({
        bankNumber: bankDetails.accountNumber,
        amount: parseInt(amount),
        message: `NAPTIEN ${user?.username || ""} ${data.transactionId}`
      });
      setQrCodeUrl(qrContent);
    },
    onError: (error: Error) => {
      toast({
        title: "Tạo giao dịch thất bại",
        description: error.message || "Đã xảy ra lỗi khi tạo giao dịch.",
        variant: "destructive"
      });
    }
  });

  const handleCreatePayment = () => {
    createPaymentMutation.mutate();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/\D/g, "");
    setAmount(value);
  };

  const handleCopyText = (text: string, type: 'account' | 'content') => {
    navigator.clipboard.writeText(text);
    setCopyStatus(prev => ({ ...prev, [type]: true }));
    
    // Reset copy status after 2 seconds
    setTimeout(() => {
      setCopyStatus(prev => ({ ...prev, [type]: false }));
    }, 2000);
    
    toast({
      title: "Đã sao chép",
      description: "Thông tin đã được sao chép vào clipboard.",
    });
  };

  // Reset state when modal is closed
  const handleClose = () => {
    if (!createPaymentMutation.isPending) {
      setQrCodeUrl(null);
      setTransactionId(null);
      setCopyStatus({ account: false, content: false });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nạp tiền vào tài khoản</DialogTitle>
          <DialogDescription>
            Nạp tiền để mở khóa các chương truyện và tận hưởng trọn vẹn nội dung.
          </DialogDescription>
        </DialogHeader>

        {!qrCodeUrl ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền</Label>
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={handleAmountChange}
              />
              <p className="text-muted-foreground text-xs">
                Tối thiểu: 10,000 VNĐ (Mọi số tiền phải chia hết cho 1,000)
              </p>
              {amount && !isNaN(parseInt(amount)) && (
                <p className="text-sm font-medium">
                  = {formatCurrency(parseInt(amount))}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Phương thức thanh toán</Label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Chọn phương thức thanh toán" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Chuyển khoản ngân hàng</SelectItem>
                  <SelectItem value="credit_card">Thẻ tín dụng</SelectItem>
                  <SelectItem value="e_wallet">Ví điện tử</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCreatePayment}
              className="w-full"
              disabled={
                createPaymentMutation.isPending ||
                !amount ||
                isNaN(parseInt(amount)) ||
                parseInt(amount) < 10000 ||
                parseInt(amount) % 1000 !== 0
              }
            >
              {createPaymentMutation.isPending ? "Đang xử lý..." : "Tạo mã QR"}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center border border-border rounded-md p-4">
              <QRCode value={qrCodeUrl} size={150} />
              <p className="text-center text-sm font-medium mt-3">
                Quét mã QR để thanh toán
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Thông tin chuyển khoản:</p>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngân hàng:</span>
                    <span>{bankDetails.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Số tài khoản:</span>
                    <div className="flex items-center">
                      <span>{bankDetails.accountNumber}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-1"
                        onClick={() => handleCopyText(bankDetails.accountNumber, 'account')}
                      >
                        {copyStatus.account ? (
                          <ClipboardCheck className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Clipboard className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chủ tài khoản:</span>
                    <span>{bankDetails.accountName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Nội dung CK:</span>
                    <div className="flex items-center">
                      <span>NAPTIEN {user?.username} {transactionId}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-1"
                        onClick={() => handleCopyText(`NAPTIEN ${user?.username} ${transactionId}`, 'content')}
                      >
                        {copyStatus.content ? (
                          <ClipboardCheck className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Clipboard className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số tiền:</span>
                    <span className="font-medium">{formatCurrency(parseInt(amount))}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Sau khi chuyển khoản, vui lòng đợi hệ thống xác nhận (thường trong vòng 5 phút).
                  Tiền sẽ được cộng vào tài khoản sau khi xác nhận thành công.
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PaymentModal;
