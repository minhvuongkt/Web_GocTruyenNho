import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layouts/main-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { generateVietQR, getBankAcqId } from "@/services/vietqr-api";
import { QRCode } from "@/components/shared/qr-code";
import { PayOSDirectCheckout } from "@/components/shared/payos-direct-checkout";
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
  const [presetAmount, setPresetAmount] = useState<string | null>(null);
  
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
  
  // Get minimum deposit amount from settings
  const minimumDeposit = paymentSettings?.minimumDeposit || 10000;
  
  // Calculate bonus coins based on discount tiers
  const calculateBonus = (amount: number): { bonus: number, percentage: number } => {
    if (!paymentSettings?.discountTiers || !paymentSettings.discountTiers.length) {
      return { bonus: 0, percentage: 0 };
    }
    
    // Sort tiers by amount in descending order to get the highest applicable tier
    const sortedTiers = [...paymentSettings.discountTiers].sort((a, b) => b.amount - a.amount);
    
    // Find the applicable tier
    const applicableTier = sortedTiers.find(tier => amount >= tier.amount);
    
    if (!applicableTier) {
      return { bonus: 0, percentage: 0 };
    }
    
    const bonusAmount = Math.floor((amount * applicableTier.discountPercent) / 100);
    return { bonus: bonusAmount, percentage: applicableTier.discountPercent };
  };
  
  // Create a new payment
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!amount) {
        throw new Error("Vui lòng nhập số tiền");
      }
      
      const amountValue = parseInt(amount);
      
      if (amountValue < minimumDeposit) {
        throw new Error(`Số tiền tối thiểu là ${formatCurrency(minimumDeposit)} VNĐ`);
      }
      
      if (amountValue % 1000 !== 0) {
        throw new Error("Số tiền phải là bội số của 1,000 VNĐ");
      }
      
      const resp = await apiRequest("POST", "/api/payments", {
        amount: amountValue,
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
      
      // Lấy URL hiện tại để sử dụng làm returnUrl
      const currentPath = window.location.pathname;
      const returnUrl = currentPath === '/payment' ? '/' : currentPath;
      
      const resp = await apiRequest("POST", "/api/payments/confirm", {
        transactionId: paymentStatus.transactionId,
        returnUrl: returnUrl
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
        
        // Chuyển hướng người dùng nếu server trả về redirectUrl
        if (data.redirectUrl) {
          setTimeout(() => {
            window.location.href = data.redirectUrl;
          }, 2000); // Delay 2s để người dùng thấy thông báo thành công
        }
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
    if (paymentDate && paymentStatus.processing && paymentStatus.transactionId) {
      const timer = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - paymentDate.getTime();
        
        // If more than 10 minutes have passed, consider the payment expired
        if (diff > 10 * 60 * 1000) {
          // Automatically update payment status to failed in the database
          apiRequest("POST", "/api/payments/update-status", {
            transactionId: paymentStatus.transactionId,
            status: "failed"
          }).then(() => {
            setPaymentStatus({ processing: false });
            setPaymentDate(null);
            toast({
              title: "Giao dịch hết hạn",
              description: "Giao dịch đã được đánh dấu là thất bại do hết thời gian. Vui lòng tạo giao dịch mới.",
              variant: "destructive",
            });
            
            // Refresh payment data
            queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
          }).catch(error => {
            console.error("Failed to update payment status:", error);
          });
          
          clearInterval(timer);
        }
      }, 1000); // Check every second for more real-time updates
      
      return () => clearInterval(timer);
    }
  }, [paymentDate, paymentStatus.processing, paymentStatus.transactionId, toast, queryClient]);
  
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
                    <div className="max-w-md mx-auto space-y-6">
                      <div className="space-y-4">
                        <Label htmlFor="amount">Số tiền (VNĐ)</Label>
                        <Input
                          id="amount"
                          placeholder={`Nhập số tiền (tối thiểu ${formatCurrency(minimumDeposit)})`}
                          value={amount}
                          onChange={(e) => {
                            setAmount(e.target.value);
                            setPresetAmount(null);
                          }}
                          type="number"
                        />
                        
                        {/* Preset amount buttons */}
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          {paymentSettings?.discountTiers?.map((tier) => (
                            <Button
                              key={tier.amount}
                              type="button"
                              variant={presetAmount === tier.amount.toString() ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                setAmount(tier.amount.toString());
                                setPresetAmount(tier.amount.toString());
                              }}
                              className="relative overflow-hidden"
                            >
                              <span>{formatCurrency(tier.amount)}</span>
                              {tier.discountPercent > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] px-1 rounded-bl-md">
                                  +{tier.discountPercent}%
                                </span>
                              )}
                            </Button>
                          ))}
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          Tối thiểu {formatCurrency(minimumDeposit)} VNĐ. Số tiền phải là bội số của 1,000 VNĐ.
                        </p>
                        
                        {/* Show bonus calculation */}
                        {amount && !isNaN(parseInt(amount)) && parseInt(amount) >= minimumDeposit && (
                          <div className="rounded-md bg-muted/50 p-3 mt-2">
                            <div className="flex justify-between text-sm">
                              <span>Nạp:</span>
                              <span>{formatCurrency(parseInt(amount))} VNĐ</span>
                            </div>
                            
                            {calculateBonus(parseInt(amount)).bonus > 0 && (
                              <div className="flex justify-between text-sm text-primary">
                                <span>Thưởng ({calculateBonus(parseInt(amount)).percentage}%):</span>
                                <span>+{formatCurrency(calculateBonus(parseInt(amount)).bonus)} VNĐ</span>
                              </div>
                            )}
                            
                            <Separator className="my-2" />
                            
                            <div className="flex justify-between font-medium">
                              <span>Tổng:</span>
                              <span>
                                {formatCurrency(parseInt(amount) + calculateBonus(parseInt(amount)).bonus)} VNĐ
                              </span>
                            </div>
                          </div>
                        )}
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
                            
                            {/* Đã xóa trường chỉnh sửa thời gian hết hạn */}
                          </div>
                        </div>
                      )}

                      {/* Nếu là thanh toán qua PayOS */}
                      {paymentStatus.transactionId && paymentMethod === 'payos' && (
                        <div className="max-w-2xl mx-auto">
                          <div className="text-center mb-6">
                            <h2 className="text-xl font-semibold mb-2">Thanh toán trực tuyến</h2>
                            <p className="text-muted-foreground">
                              Chọn phương thức thanh toán qua cổng thanh toán PayOS
                            </p>
                          </div>
                          
                          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                            <PayOSDirectCheckout 
                              amount={parseInt(amount)}
                              description={`Nạp tiền cho ${user.username}`}
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