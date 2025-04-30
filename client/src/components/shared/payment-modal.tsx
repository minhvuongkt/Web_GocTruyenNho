import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { nanoid } from "nanoid";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { QRCode } from "@/components/shared/qr-code";
import { useLocation } from "wouter";
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
import { Clipboard, ClipboardCheck, AlertTriangle, Timer } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
}

export function PaymentModal({
  isOpen,
  onClose,
  defaultAmount = 50000,
}: PaymentModalProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [bankingQrUrl, setBankingQrUrl] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(600); // 10 minutes in seconds
  const [copyStatus, setCopyStatus] = useState<{
    account: boolean;
    content: boolean;
  }>({ account: false, content: false });

  // Bank account details (in a real app, this would come from the backend)
  const bankDetails = {
    bankName: "MB Bank",
    accountNumber: "0862713897",
    accountName: "Mèo Đi Dịch Truyện",
    bankBin: "970422", // MB Bank BIN
  };

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      // Validate amount
      const numAmount = parseInt(amount);
      if (isNaN(numAmount) || numAmount < 5000 || numAmount % 1000 !== 0) {
        throw new Error("Số tiền phải ít nhất 5,000 VNĐ và chia hết cho 1,000");
      }

      const response = await apiRequest("POST", "/api/payments", {
        amount: numAmount,
        method: paymentMethod,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to payment page for credit card and e-wallet
      if (paymentMethod === "credit_card" || paymentMethod === "e_wallet") {
        navigate(`/payment/${data.transactionId}`);
        onClose();
        return;
      }

      toast({
        title: "Tạo giao dịch thành công",
        description: "Vui lòng hoàn tất thanh toán trong vòng 10 phút.",
      });

      // Set the transaction ID
      setTransactionId(data.transactionId);

      // Reset timer
      setTimeRemaining(600);

      // Generate QR code in two formats
      const paymentMessage = `NAPTIEN ${user?.username || ""} ${data.transactionId}`;

      // Standard EMV format for general QR readers
      const qrContent = generateQRCode({
        bankNumber: bankDetails.accountNumber,
        amount: parseInt(amount),
        message: paymentMessage,
        bankBin: bankDetails.bankBin,
      });
      setQrCodeUrl(qrContent);

      // Banking-specific format that works with Vietnamese banking apps
      const bankingQrContent = generateBankingQR({
        bankNumber: bankDetails.accountNumber,
        amount: parseInt(amount),
        message: paymentMessage,
        bankBin: bankDetails.bankBin,
      });
      setBankingQrUrl(bankingQrContent);
    },
    onError: (error: Error) => {
      toast({
        title: "Tạo giao dịch thất bại",
        description: error.message || "Đã xảy ra lỗi khi tạo giao dịch.",
        variant: "destructive",
      });
    },
  });

  // Timer countdown effect
  useEffect(() => {
    if (!transactionId || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast({
            title: "Hết thời gian thanh toán",
            description: "Giao dịch đã hết hạn. Vui lòng tạo giao dịch mới.",
            variant: "destructive",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [transactionId, timeRemaining, toast]);

  const handleCreatePayment = () => {
    createPaymentMutation.mutate();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/\D/g, "");
    setAmount(value);
  };

  const handleCopyText = (text: string, type: "account" | "content") => {
    navigator.clipboard.writeText(text);
    setCopyStatus((prev) => ({ ...prev, [type]: true }));

    // Reset copy status after 2 seconds
    setTimeout(() => {
      setCopyStatus((prev) => ({ ...prev, [type]: false }));
    }, 2000);

    toast({
      title: "Đã sao chép",
      description: "Thông tin đã được sao chép vào clipboard.",
    });
  };

  // Format time remaining as MM:SS
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Confirm payment manually
  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!transactionId) throw new Error("Không có mã giao dịch");

      const response = await apiRequest(
        "POST",
        `/api/payments/${transactionId}/confirm`,
        {},
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Xác nhận thanh toán",
        description:
          "Yêu cầu xác nhận đã được gửi tới quản trị viên. Chúng tôi sẽ kiểm tra và cập nhật số dư của bạn sớm nhất.",
      });

      // Close the modal after confirmation
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Không thể xác nhận",
        description: error.message || "Đã xảy ra lỗi khi xác nhận thanh toán.",
        variant: "destructive",
      });
    },
  });

  // Reset state when modal is closed
  const handleClose = () => {
    if (!createPaymentMutation.isPending && !confirmPaymentMutation.isPending) {
      setQrCodeUrl(null);
      setBankingQrUrl(null);
      setTransactionId(null);
      setTimeRemaining(600);
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
            Nạp tiền để mở khóa các chương truyện và tận hưởng trọn vẹn nội
            dung.
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
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Chọn phương thức thanh toán" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">
                    Chuyển khoản ngân hàng
                  </SelectItem>
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
                parseInt(amount) < 5000 ||
                parseInt(amount) % 1000 !== 0
              }
            >
              {createPaymentMutation.isPending ? "Đang xử lý..." : "Tạo mã QR"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Timer display */}
            <div className="flex flex-col items-center space-y-2 mb-2">
              <div className="flex items-center">
                <Timer className="h-4 w-4 mr-2 text-yellow-500" />
                <span className="text-sm font-medium">
                  Thời gian còn lại: {formatTimeRemaining()}
                </span>
              </div>
              <Progress
                value={(timeRemaining / 600) * 100}
                className="h-2 w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center border border-border rounded-md p-4">
                <div className="mb-1 text-xs text-center font-medium text-muted-foreground">
                  {bankingQrUrl
                    ? "QR dành cho ứng dụng ngân hàng & Momo"
                    : "Mã QR chuẩn"}
                </div>
                <QRCode value={bankingQrUrl || qrCodeUrl} size={150} />
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
                      <span className="text-muted-foreground">
                        Số tài khoản:
                      </span>
                      <div className="flex items-center">
                        <span>{bankDetails.accountNumber}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 ml-1"
                          onClick={() =>
                            handleCopyText(bankDetails.accountNumber, "account")
                          }
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
                      <span className="text-muted-foreground">
                        Chủ tài khoản:
                      </span>
                      <span>{bankDetails.accountName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Nội dung CK:
                      </span>
                      <div className="flex items-center">
                        <span>
                          NAPTIEN {user?.username} {transactionId}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 ml-1"
                          onClick={() =>
                            handleCopyText(
                              `NAPTIEN ${user?.username} ${transactionId}`,
                              "content",
                            )
                          }
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
                      <span className="font-medium">
                        {formatCurrency(parseInt(amount))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Sau khi chuyển khoản, vui lòng nhấn nút "Tôi đã thanh toán"
                    để xác nhận.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Button
                onClick={() => confirmPaymentMutation.mutate()}
                className="flex-1"
                disabled={
                  confirmPaymentMutation.isPending || timeRemaining <= 0
                }
              >
                {confirmPaymentMutation.isPending
                  ? "Đang xử lý..."
                  : "Tôi đã thanh toán"}
              </Button>
              <Button
                onClick={() => setQrCodeUrl(null)}
                variant="outline"
                className="flex-1"
                disabled={confirmPaymentMutation.isPending}
              >
                Hủy
              </Button>
            </div>

            {timeRemaining <= 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start mt-4">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Giao dịch đã hết hạn</p>
                  <p>Vui lòng tạo giao dịch mới để tiếp tục thanh toán.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PaymentModal;
