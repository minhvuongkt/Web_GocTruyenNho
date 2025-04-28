import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layouts/main-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { generateVietQR, getBankAcqId } from "@/services/vietqr-api";
import { QRCode } from "@/components/shared/qr-code";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Landmark,
  Wallet,
  Clipboard,
  ClipboardCheck,
  Loader2,
  Check,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";

export function PaymentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const paymentMethod = "bank_transfer"; // Chỉ hỗ trợ chuyển khoản ngân hàng
  const [amount, setAmount] = useState("50000");
  const [copyStatus, setCopyStatus] = useState<{
    account: boolean;
    content: boolean;
  }>({ account: false, content: false });
  const [activeTab, setActiveTab] = useState("payment");
  const [paymentStatus, setPaymentStatus] = useState<{
    processing: boolean;
    transactionId?: string;
    qrCode?: string;
  }>({
    processing: false,
  });

  // Fetch bank settings from backend
  const { data: vietQRConfig, isLoading: loadingVietQRConfig } = useQuery({
    queryKey: ["/api/payment-settings/vietqr-config"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/payment-settings/vietqr-config");
        return res.json();
      } catch (error) {
        console.error("Failed to fetch VietQR config", error);
        return null;
      }
    }
  });
  
  // Bank account details from backend config
  const bankDetails = {
    bankName: vietQRConfig?.bankSettings?.bankId 
              ? getBankName(vietQRConfig.bankSettings.bankId) 
              : "MB Bank",
    accountNumber: vietQRConfig?.bankSettings?.accountNumber || "9999123456789",
    accountName: vietQRConfig?.bankSettings?.accountName || "GocTruyenNho",
  };
  
  // Helper function to get bank name from ID
  function getBankName(bankId: string): string {
    const bankNames: Record<string, string> = {
      'MB': 'MB Bank',
      'VCB': 'Vietcombank',
      'TCB': 'Techcombank',
      'VPB': 'VPBank',
      'VIB': 'VIB',
      'ACB': 'ACB',
      'TPB': 'TPBank',
    };
    return bankNames[bankId] || bankId;
  }

  // Fetch payment history
  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ["/api/payments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/payments");
      return res.json();
    },
    enabled: activeTab === "history",
  });

  // Fetch bank settings (could be part of user profile)
  const { data: bankSettings } = useQuery({
    queryKey: ["/api/payment-settings/pricing"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/payment-settings/pricing");
        return res.json();
      } catch (error) {
        console.error("Failed to fetch payment settings", error);
        return null;
      }
    }
  });
  
  // State for payment confirmation cooldown
  const [confirmCooldown, setConfirmCooldown] = useState(0);
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  
  // Timer for payment confirmation cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (confirmCooldown > 0) {
      timer = setInterval(() => {
        setConfirmCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [confirmCooldown]);
  
  // Calculate remaining time text
  const getRemainingTimeText = (): string => {
    if (!paymentDate) return '';
    
    const now = new Date();
    const created = new Date(paymentDate);
    const diffMs = created.getTime() + 10 * 60 * 1000 - now.getTime(); // 10 minutes in milliseconds
    
    if (diffMs <= 0) return 'Đã hết thời gian';
    
    const minutes = Math.floor(diffMs / (60 * 1000));
    const seconds = Math.floor((diffMs % (60 * 1000)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      // Validate amount
      const numAmount = parseInt(amount);
      if (isNaN(numAmount) || numAmount < 10000 || numAmount % 1000 !== 0) {
        throw new Error("Số tiền phải ít nhất 10,000 VNĐ và chia hết cho 1,000");
      }

      setPaymentStatus({ processing: true });
      const response = await apiRequest("POST", "/api/payments", {
        amount: numAmount,
        method: paymentMethod,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Tạo giao dịch thành công",
        description: "Vui lòng hoàn tất thanh toán để nạp tiền vào tài khoản.",
      });

      // Set payment status and date
      setPaymentStatus({
        processing: false,
        transactionId: data.payment.transactionId,
        qrCode: data.qrCodeURL // Lưu URL QR code để hiển thị
      });
      setPaymentDate(new Date(data.payment.createdAt));
      
      // Set initial cooldown to prevent spam clicking
      setConfirmCooldown(30); // 30 seconds cooldown
    },
    onError: (error: Error) => {
      setPaymentStatus({ processing: false });
      toast({
        title: "Tạo giao dịch thất bại",
        description: error.message || "Đã xảy ra lỗi khi tạo giao dịch.",
        variant: "destructive",
      });
    },
  });
  
  // Confirm payment mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!paymentStatus.transactionId) {
        throw new Error("Không có giao dịch để xác nhận");
      }
      
      const response = await apiRequest("PUT", `/api/payments/${paymentStatus.transactionId}/confirm`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Xác nhận thanh toán thành công",
        description: "Chúng tôi sẽ kiểm tra và cập nhật số dư của bạn trong thời gian sớm nhất.",
      });
      
      // Refresh payments and user data
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Switch to history tab
      setActiveTab("history");
      
      // Reset payment status
      setPaymentStatus({ processing: false });
      setPaymentDate(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Xác nhận thanh toán thất bại",
        description: error.message || "Đã xảy ra lỗi khi xác nhận thanh toán.",
        variant: "destructive",
      });
    },
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setAmount(value);
  };

  const handleCreatePayment = () => {
    createPaymentMutation.mutate();
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

  // Không còn cần hàm này vì chỉ có một phương thức thanh toán

  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Bạn chưa đăng nhập</h2>
          <p className="text-muted-foreground mb-4">
            Vui lòng đăng nhập để sử dụng tính năng nạp tiền.
          </p>
          <Button asChild>
            <a href="/auth">Đăng nhập</a>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Nạp tiền</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Tài khoản của bạn</CardTitle>
              <CardDescription>
                Số dư hiện tại và lịch sử giao dịch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">Số dư hiện tại:</p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(user.balance)}
                </p>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="payment">Nạp tiền</TabsTrigger>
                  <TabsTrigger value="history">Lịch sử giao dịch</TabsTrigger>
                </TabsList>
                
                {/* Payment Tab */}
                <TabsContent value="payment" className="space-y-4 pt-4">
                  {!paymentStatus.transactionId ? (
                    <>
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
                          <div className="flex items-center p-3 border rounded-md">
                            <Landmark className="mr-2 h-4 w-4 text-primary" />
                            <span>Chuyển khoản ngân hàng</span>
                          </div>
                          <input type="hidden" name="payment-method" value="bank_transfer" />
                        </div>

                        <Button
                          onClick={handleCreatePayment}
                          className="w-full"
                          disabled={
                            paymentStatus.processing ||
                            !amount ||
                            isNaN(parseInt(amount)) ||
                            parseInt(amount) < 10000 ||
                            parseInt(amount) % 1000 !== 0
                          }
                        >
                          {paymentStatus.processing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Đang xử lý...
                            </>
                          ) : (
                            "Nạp tiền"
                          )}
                        </Button>
                      </div>
                      
                      {/* Payment method specific instructions */}
                      <div className="mt-6 pt-6 border-t border-border">
                        <h3 className="text-sm font-medium mb-2">Thông tin thanh toán:</h3>
                        
                        {paymentMethod === "bank_transfer" && (
                          <div className="space-y-2 text-sm">
                            <p className="text-muted-foreground">
                              Chuyển khoản đến tài khoản ngân hàng của chúng tôi. 
                              Sau khi nhận được thanh toán, chúng tôi sẽ nạp tiền vào tài khoản của bạn.
                            </p>
                          </div>
                        )}
                        

                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col items-center justify-center border border-border rounded-md p-4">
                        {parseInt(amount) && paymentStatus.transactionId && (
                          <QRCode 
                            amount={parseInt(amount)}
                            accountNo={bankDetails.accountNumber}
                            accountName={bankDetails.accountName}
                            bankId={vietQRConfig?.bankSettings?.bankId || "MB"}
                            addInfo={`NAPTIEN admin ${amount}`}
                          />
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Thông tin chuyển khoản:</p>
                          <div className="mt-2 space-y-3 text-sm">
                            <div className="flex justify-between items-baseline">
                              <span className="text-muted-foreground">Số tiền:</span>
                              <span className="font-medium">{formatCurrency(parseInt(amount))}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Ngân hàng:</span>
                              <span>{bankDetails.bankName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Số tài khoản:</span>
                              <div className="flex items-center">
                                <span className="font-medium">{bankDetails.accountNumber}</span>
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
                                <span className="font-medium">NAPTIEN admin {amount}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 ml-1"
                                  onClick={() => handleCopyText(`NAPTIEN admin ${amount}`, 'content')}
                                >
                                  {copyStatus.content ? (
                                    <ClipboardCheck className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <Clipboard className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                          <p>
                            Sau khi chuyển khoản, vui lòng đợi hệ thống xác nhận (thường trong vòng 5 phút).
                            Tiền sẽ được cộng vào tài khoản sau khi xác nhận thành công.
                          </p>
                        </div>
                        
                        {/* Thời gian còn lại */}
                        {paymentDate && (
                          <div className="flex flex-col gap-2 pt-2 pb-2">
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-muted-foreground">Thời gian còn lại:</div>
                              <div className="font-medium text-amber-500">
                                {getRemainingTimeText()}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Giao dịch sẽ tự động hết hạn sau 10 phút nếu không được xác nhận
                            </p>
                          </div>
                        )}
                        
                        {/* Nút xác nhận thanh toán */}
                        <Button
                          onClick={() => confirmPaymentMutation.mutate()}
                          disabled={confirmCooldown > 0 || confirmPaymentMutation.isPending}
                          className="w-full mt-2"
                          variant="default"
                        >
                          {confirmPaymentMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Đang xác nhận...
                            </>
                          ) : confirmCooldown > 0 ? (
                            <>
                              <Clock className="mr-2 h-4 w-4" />
                              Xác nhận thanh toán ({confirmCooldown}s)
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Tôi đã thanh toán
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => setPaymentStatus({ processing: false })}
                        >
                          Tạo giao dịch mới
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                {/* History Tab */}
                <TabsContent value="history" className="pt-4">
                  <div className="space-y-4">
                    {loadingPayments ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : payments && payments.length > 0 ? (
                      <div className="space-y-4">
                        {payments.map((payment: any) => (
                          <Card key={payment.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {payment.method === 'bank_transfer' ? (
                                      <span className="flex items-center">
                                        <Landmark className="h-3 w-3 mr-1" />
                                        Chuyển khoản ngân hàng
                                      </span>
                                    ) : payment.method === 'credit_card' ? (
                                      <span className="flex items-center">
                                        <CreditCard className="h-3 w-3 mr-1" />
                                        Thẻ tín dụng
                                      </span>
                                    ) : (
                                      <span className="flex items-center">
                                        <Wallet className="h-3 w-3 mr-1" />
                                        Ví điện tử
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Mã giao dịch: {payment.transactionId}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className={`flex items-center ${
                                    payment.status === 'completed' ? 'text-green-600 dark:text-green-400' : 
                                    payment.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' : 
                                    'text-red-600 dark:text-red-400'
                                  }`}>
                                    {payment.status === 'completed' ? (
                                      <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Thành công
                                      </>
                                    ) : payment.status === 'pending' ? (
                                      <>
                                        <Clock className="h-4 w-4 mr-1" />
                                        Đang xử lý
                                      </>
                                    ) : (
                                      <>
                                        <AlertTriangle className="h-4 w-4 mr-1" />
                                        Thất bại
                                      </>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDate(payment.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Bạn chưa có giao dịch nào.</p>
                        <Button onClick={() => setActiveTab("payment")} className="mt-4">
                          Tạo giao dịch mới
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-xs text-muted-foreground">
                Nếu gặp vấn đề trong quá trình thanh toán, vui lòng liên hệ hỗ trợ.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default PaymentPage;
