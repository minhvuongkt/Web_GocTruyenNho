import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layouts/main-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { generateVietQR, getBankAcqId } from "@/services/vietqr-api";
import { QRCode } from "@/components/shared/qr-code";
import { PayOSPayment } from "@/components/shared/payos-payment";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  CheckCircle,
  Loader2,
  RefreshCw,
  Check,
  Clipboard,
  ClipboardCheck,
  AlertTriangle,
  CreditCard,
  Landmark,
  Wallet,
} from "lucide-react";

function getBankName(bankId: string): string {
  const banks: Record<string, string> = {
    'MBBANK': 'MB Bank',
    'VIETCOMBANK': 'Vietcombank',
    'VIETINBANK': 'VietinBank',
    'BIDV': 'BIDV',
    'TECHCOMBANK': 'Techcombank',
    'VPBANK': 'VPBank',
    'AGRIBANK': 'Agribank',
    'TPBANK': 'TPBank',
    'ACB': 'ACB',
    'SACOMBANK': 'Sacombank',
    'OCB': 'OCB',
    'MSB': 'MSB',
    'VIB': 'VIB',
    'HDBANK': 'HDBank',
    'SEABANK': 'SeABank',
    'PVCOMBANK': 'PVcomBank',
    'ABBANK': 'ABBank',
    'BAOVIETBANK': 'BaoViet Bank',
    'EXIMBANK': 'Eximbank',
    'LPB': 'LienVietPostBank',
    'NCBBANK': 'NCB',
    'VIETABANK': 'VietABank',
    'VIETCAPITALBANK': 'Viet Capital Bank',
    'PGBANK': 'PGBank',
    'SHB': 'SHB',
    'NAMABANK': 'Nam A Bank',
    'VRB': 'VRB',
    'KIENLONGBANK': 'Kiên Long Bank',
    'OCEANBANK': 'OceanBank',
    'BACABANK': 'BacABank',
    'SAIGONBANK': 'SaigonBank',
    'SCBBANK': 'SCB',
    'COOPBANK': 'Co-opBank',
    'PBVNBANK': 'Public Bank Vietnam',
    'WOORIBANK': 'Woori Bank Vietnam',
    'UOB': 'UOB Vietnam',
    'HSBC': 'HSBC Vietnam',
    'CBBANK': 'CB Bank',
    'IBKBANK': 'IBK Bank Vietnam'
  };
  
  return banks[bankId] || bankId;
}

export function PaymentPage() {
  const { user, isLoading: isLoadingUser } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("payment");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentStatus, setPaymentStatus] = useState<{
    processing?: boolean;
    transactionId?: string;
  }>({ processing: false });
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [confirmCooldown, setConfirmCooldown] = useState(0);
  const [copyStatus, setCopyStatus] = useState({
    account: false,
    content: false
  });
  
  // Fetch payment settings
  const { data: paymentSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/payment-settings/pricing"],
    queryFn: async () => {
      const resp = await apiRequest("GET", "/api/payment-settings/pricing");
      return resp.json();
    },
    enabled: !!user,
  });
  
  // Fetch user's payment history
  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ["/api/payments"],
    queryFn: async () => {
      const resp = await apiRequest("GET", "/api/payments");
      return resp.json();
    },
    enabled: !!user && activeTab === "history",
  });
  
  // Bank details for transfer
  const bankDetails = {
    bankBin: paymentSettings?.bankBin || "MBBANK",
    bankName: getBankName(paymentSettings?.bankBin || "MBBANK"),
    accountNumber: paymentSettings?.accountNumber || "0862713897",
    accountName: paymentSettings?.accountName || "góc truyện nhỏ",
  };
  
  // Create a new payment
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!amount) {
        throw new Error("Vui lòng nhập số tiền");
      }
      
      if (parseInt(amount) < 10000) {
        throw new Error("Số tiền tối thiểu là 10,000 VNĐ");
      }
      
      if (parseInt(amount) % 1000 !== 0) {
        throw new Error("Số tiền phải là bội số của 1,000 VNĐ");
      }
      
      const resp = await apiRequest("POST", "/api/payments", {
        amount: parseInt(amount),
        method: paymentMethod
      });
      
      return resp.json();
    },
    onSuccess: (data) => {
      setPaymentStatus({
        processing: true,
        transactionId: data.payment.transactionId
      });
      setPaymentDate(new Date());
      
      // Refresh payment history
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi tạo giao dịch",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Confirm payment
  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!paymentStatus.transactionId) {
        throw new Error("Không tìm thấy mã giao dịch");
      }
      
      const resp = await apiRequest("POST", "/api/payments/confirm", {
        transactionId: paymentStatus.transactionId
      });
      
      return resp.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Xác nhận thành công",
          description: "Hệ thống đang xử lý giao dịch của bạn",
        });
        
        // Start cooldown
        setConfirmCooldown(30);
        
        // Refresh payment data
        queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      } else {
        toast({
          title: "Không thể xác nhận",
          description: data.message || "Chưa nhận được tiền, vui lòng thử lại sau",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi xác nhận giao dịch",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Implement countdown
  useEffect(() => {
    if (confirmCooldown > 0) {
      const timer = setTimeout(() => {
        setConfirmCooldown(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [confirmCooldown]);
  
  // Check payment expiration
  useEffect(() => {
    if (paymentDate && paymentStatus.processing) {
      const timer = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - paymentDate.getTime();
        
        // If more than 10 minutes have passed, consider the payment expired
        if (diff > 10 * 60 * 1000) {
          setPaymentStatus({ processing: false });
          setPaymentDate(null);
          toast({
            title: "Giao dịch hết hạn",
            description: "Vui lòng tạo giao dịch mới",
            variant: "destructive",
          });
          clearInterval(timer);
        }
      }, 10000); // Check every 10 seconds
      
      return () => clearInterval(timer);
    }
  }, [paymentDate, paymentStatus.processing, toast]);
  
  // Format remaining time
  const getRemainingTimeText = () => {
    if (!paymentDate) return "-";
    
    const now = new Date();
    const expiry = new Date(paymentDate.getTime() + 10 * 60 * 1000);
    const diff = Math.max(0, expiry.getTime() - now.getTime());
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle text copying
  const handleCopyText = (text: string, type: 'account' | 'content') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(prev => ({ ...prev, [type]: true }));
      
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [type]: false }));
      }, 3000);
    });
  };
  
  if (isLoadingUser) {
    return (
      <MainLayout>
        <div className="container py-10">
          <div className="flex items-center justify-center h-[40vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (!user) {
    return (
      <MainLayout>
        <div className="container py-10">
          <div className="text-center py-10">
            <h1 className="text-2xl font-bold mb-4">Bạn cần đăng nhập</h1>
            <p className="mb-6 text-muted-foreground">
              Vui lòng đăng nhập để truy cập tính năng này
            </p>
            <Button asChild className="mx-auto">
              <a href="/login">Đăng nhập</a>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Thanh toán</CardTitle>
              <CardDescription>
                Nạp tiền vào tài khoản để mở khóa các chương truyện cao cấp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="payment" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="payment">Nạp tiền</TabsTrigger>
                  <TabsTrigger value="history">Lịch sử giao dịch</TabsTrigger>
                </TabsList>
                
                {/* Payment Tab */}
                <TabsContent value="payment">
                  {!paymentStatus.processing ? (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label htmlFor="amount">Số tiền (VNĐ)</Label>
                        <Input
                          id="amount"
                          placeholder="Nhập số tiền (ví dụ: 50000)"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          type="number"
                        />
                        <p className="text-xs text-muted-foreground">
                          Tối thiểu 10,000 VNĐ. Số tiền phải là bội số của 1,000 VNĐ.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <Label htmlFor="payment-method">Phương thức thanh toán</Label>
                        <Select 
                          value={paymentMethod} 
                          onValueChange={setPaymentMethod}
                        >
                          <SelectTrigger id="payment-method">
                            <SelectValue placeholder="Chọn phương thức thanh toán" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_transfer">
                              <div className="flex items-center">
                                <Landmark className="h-4 w-4 mr-2" />
                                <span>Chuyển khoản ngân hàng</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="payos">
                              <div className="flex items-center">
                                <CreditCard className="h-4 w-4 mr-2" />
                                <span>Thanh toán trực tuyến (PayOS)</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {paymentMethod === 'bank_transfer' && (
                          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                            <p>
                              Chuyển khoản thông qua ứng dụng ngân hàng của bạn. Hệ thống sẽ tự động
                              xác nhận giao dịch trong vòng vài phút.
                            </p>
                          </div>
                        )}
                        
                        {paymentMethod === 'payos' && (
                          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                            <p>
                              Thanh toán an toàn qua cổng thanh toán PayOS, hỗ trợ thẻ ngân hàng nội địa, 
                              thẻ quốc tế và ví điện tử.
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => createPaymentMutation.mutate()}
                        disabled={!amount || createPaymentMutation.isPending}
                        className="w-full"
                      >
                        {createPaymentMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>Tiếp tục</>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Nếu là thanh toán chuyển khoản ngân hàng (VietQR) */}
                      {paymentStatus.transactionId && paymentMethod === 'bank_transfer' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex flex-col items-center justify-center border border-border rounded-md p-4">
                            {parseInt(amount) && (
                              <QRCode 
                                amount={parseInt(amount)}
                                accountNo={bankDetails.accountNumber}
                                accountName={bankDetails.accountName}
                                bankId={bankDetails.bankBin}
                                addInfo={`NAP_${user.username}`}
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
                                    <span className="font-medium">NAP_{user.username}</span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 ml-1"
                                      onClick={() => handleCopyText(`NAP_${user.username}`, 'content')}
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

                      {/* Nếu là thanh toán qua PayOS */}
                      {paymentStatus.transactionId && paymentMethod === 'payos' && (
                        <div className="max-w-md mx-auto">
                          <PayOSPayment 
                            amount={parseInt(amount)}
                            username={user.username}
                            onSuccess={(transId) => {
                              toast({
                                title: "Thanh toán thành công",
                                description: "Tiền đã được nạp vào tài khoản của bạn",
                              });
                              
                              // Refresh dữ liệu
                              queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
                              queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                              
                              // Chuyển sang tab lịch sử
                              setActiveTab("history");
                              
                              // Reset trạng thái thanh toán
                              setPaymentStatus({ processing: false });
                              setPaymentDate(null);
                            }}
                            onCancel={() => {
                              setPaymentStatus({ processing: false });
                            }}
                          />
                        </div>
                      )}
                    </>
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