import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  CreditCard, 
  Building2, 
  QrCode, 
  Save, 
  RefreshCw,
  CircleDollarSign,
  BadgePercent
} from "lucide-react";

export function PaymentSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("bank");

  // Configuration state for different payment methods
  const [bankConfig, setBankConfig] = useState({
    enabled: true,
    accountNumber: "",
    accountName: "",
    bankName: "",
    bankBranch: "",
    transferContent: "GTN_{username}_{amount}"
  });

  const [vietQRConfig, setVietQRConfig] = useState({
    enabled: true,
    accountNumber: "",
    accountName: "",
    bankId: "",
    template: "GTN_{username}_{amount}"
  });

  const [priceConfig, setPriceConfig] = useState({
    coinConversionRate: 1000, // 1 VND = 1000 coins
    minimumDeposit: 10000,
    chapterUnlockPrice: 5, // coins per chapter
    discountTiers: [
      { amount: 50000, discountPercent: 5 },
      { amount: 100000, discountPercent: 10 },
      { amount: 200000, discountPercent: 15 },
    ]
  });

  // Fetch the current payment configuration
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/payment-settings"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/payment-settings");
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch payment settings:", error);
        return {
          bankConfig: {
            enabled: true,
            accountNumber: "0123456789",
            accountName: "CONG TY TNHH GOC TRUYEN NHO",
            bankName: "Vietcombank",
            bankBranch: "Ho Chi Minh",
            transferContent: "GTN_{username}_{amount}"
          },
          vietQRConfig: {
            enabled: true,
            accountNumber: "0123456789",
            accountName: "CONG TY TNHH GOC TRUYEN NHO",
            bankId: "VCB",
            template: "GTN_{username}_{amount}"
          },
          priceConfig: {
            coinConversionRate: 1000,
            minimumDeposit: 10000,
            chapterUnlockPrice: 5,
            discountTiers: [
              { amount: 50000, discountPercent: 5 },
              { amount: 100000, discountPercent: 10 },
              { amount: 200000, discountPercent: 15 },
            ]
          }
        };
      }
    }
  });

  // Update states when data is loaded
  useEffect(() => {
    if (data) {
      setBankConfig(data.bankConfig);
      setVietQRConfig(data.vietQRConfig);
      setPriceConfig(data.priceConfig);
    }
  }, [data]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiRequest("PUT", "/api/payment-settings", settings);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thiết lập đã được lưu",
        description: "Cấu hình thanh toán đã được cập nhật thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-settings"] });
    },
    onError: (error) => {
      toast({
        title: "Không thể lưu thiết lập",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi lưu cấu hình",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
      bankConfig,
      vietQRConfig,
      priceConfig
    });
  };

  // Add or remove discount tier
  const handleAddDiscountTier = () => {
    setPriceConfig({
      ...priceConfig,
      discountTiers: [
        ...priceConfig.discountTiers,
        { amount: 0, discountPercent: 0 }
      ]
    });
  };

  const handleRemoveDiscountTier = (index: number) => {
    setPriceConfig({
      ...priceConfig,
      discountTiers: priceConfig.discountTiers.filter((_, i) => i !== index)
    });
  };

  // Update discount tier value
  const handleDiscountTierChange = (index: number, field: 'amount' | 'discountPercent', value: number) => {
    const newTiers = [...priceConfig.discountTiers];
    newTiers[index][field] = value;
    setPriceConfig({
      ...priceConfig,
      discountTiers: newTiers
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Thiết lập thanh toán</h1>
          <Button 
            onClick={handleSaveSettings} 
            disabled={saveSettingsMutation.isPending}
          >
            {saveSettingsMutation.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Lưu thiết lập
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full md:w-auto grid-cols-3 mb-4">
            <TabsTrigger value="bank" className="flex items-center">
              <Building2 className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Ngân hàng</span>
            </TabsTrigger>
            <TabsTrigger value="vietqr" className="flex items-center">
              <QrCode className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">VietQR</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center">
              <CircleDollarSign className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Đơn giá</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="bank" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Cấu hình chuyển khoản ngân hàng</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="bank-enabled" 
                      checked={bankConfig.enabled}
                      onCheckedChange={(checked) => setBankConfig({...bankConfig, enabled: checked})}
                    />
                    <Label htmlFor="bank-enabled">Kích hoạt</Label>
                  </div>
                </div>
                <CardDescription>
                  Các thông tin tài khoản ngân hàng để người dùng có thể nạp tiền
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="account-number">Số tài khoản</Label>
                    <Input 
                      id="account-number"
                      placeholder="Nhập số tài khoản"
                      value={bankConfig.accountNumber}
                      onChange={(e) => setBankConfig({...bankConfig, accountNumber: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-name">Tên tài khoản</Label>
                    <Input 
                      id="account-name"
                      placeholder="Nhập tên tài khoản"
                      value={bankConfig.accountName}
                      onChange={(e) => setBankConfig({...bankConfig, accountName: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bank-name">Tên ngân hàng</Label>
                    <Input 
                      id="bank-name"
                      placeholder="Ví dụ: Vietcombank, Techcombank..."
                      value={bankConfig.bankName}
                      onChange={(e) => setBankConfig({...bankConfig, bankName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank-branch">Chi nhánh</Label>
                    <Input 
                      id="bank-branch"
                      placeholder="Ví dụ: Chi nhánh Hồ Chí Minh"
                      value={bankConfig.bankBranch}
                      onChange={(e) => setBankConfig({...bankConfig, bankBranch: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="transfer-content">Mẫu nội dung chuyển khoản</Label>
                  <Input 
                    id="transfer-content"
                    placeholder="Ví dụ: GTN_{username}_{amount}"
                    value={bankConfig.transferContent}
                    onChange={(e) => setBankConfig({...bankConfig, transferContent: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sử dụng <code>{"{username}"}</code> để thay thế tên người dùng và <code>{"{amount}"}</code> để thay thế số tiền
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="vietqr" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Cấu hình VietQR</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="vietqr-enabled" 
                      checked={vietQRConfig.enabled}
                      onCheckedChange={(checked) => setVietQRConfig({...vietQRConfig, enabled: checked})}
                    />
                    <Label htmlFor="vietqr-enabled">Kích hoạt</Label>
                  </div>
                </div>
                <CardDescription>
                  Thiết lập thông tin để tạo mã QR thanh toán VietQR
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vietqr-account-number">Số tài khoản</Label>
                    <Input 
                      id="vietqr-account-number"
                      placeholder="Nhập số tài khoản"
                      value={vietQRConfig.accountNumber}
                      onChange={(e) => setVietQRConfig({...vietQRConfig, accountNumber: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vietqr-account-name">Tên tài khoản</Label>
                    <Input 
                      id="vietqr-account-name"
                      placeholder="Nhập tên tài khoản"
                      value={vietQRConfig.accountName}
                      onChange={(e) => setVietQRConfig({...vietQRConfig, accountName: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bank-id">Mã ngân hàng (BIN)</Label>
                  <Input 
                    id="bank-id"
                    placeholder="Ví dụ: VCB, TCB, ..."
                    value={vietQRConfig.bankId}
                    onChange={(e) => setVietQRConfig({...vietQRConfig, bankId: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mã BIN của ngân hàng, xem danh sách đầy đủ tại <a href="https://vietqr.io/danh-sach-ngan-hang" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">vietqr.io</a>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="qr-template">Mẫu nội dung QR</Label>
                  <Input 
                    id="qr-template"
                    placeholder="Ví dụ: GTN_{username}_{amount}"
                    value={vietQRConfig.template}
                    onChange={(e) => setVietQRConfig({...vietQRConfig, template: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sử dụng <code>{"{username}"}</code> để thay thế tên người dùng và <code>{"{amount}"}</code> để thay thế số tiền
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cấu hình đơn giá</CardTitle>
                <CardDescription>
                  Thiết lập đơn giá và quy đổi coin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="coin-rate">Tỷ lệ quy đổi (VND → Coin)</Label>
                    <div className="flex items-center space-x-2">
                      <Input 
                        id="coin-rate"
                        type="number"
                        placeholder="Nhập tỷ lệ"
                        value={priceConfig.coinConversionRate}
                        onChange={(e) => setPriceConfig({...priceConfig, coinConversionRate: parseInt(e.target.value) || 0})}
                      />
                      <span className="text-sm whitespace-nowrap">1 VND = {priceConfig.coinConversionRate} coin</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-deposit">Số tiền nạp tối thiểu (VND)</Label>
                    <Input 
                      id="min-deposit"
                      type="number"
                      placeholder="Nhập số tiền tối thiểu"
                      value={priceConfig.minimumDeposit}
                      onChange={(e) => setPriceConfig({...priceConfig, minimumDeposit: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="chapter-price">Giá mở khóa chương (Coin)</Label>
                  <Input 
                    id="chapter-price"
                    type="number"
                    placeholder="Nhập giá mở khóa"
                    value={priceConfig.chapterUnlockPrice}
                    onChange={(e) => setPriceConfig({...priceConfig, chapterUnlockPrice: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Khuyến mãi theo mức nạp</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAddDiscountTier}
                    >
                      + Thêm mức khuyến mãi
                    </Button>
                  </div>
                  
                  {priceConfig.discountTiers.map((tier, index) => (
                    <div key={index} className="grid gap-4 grid-cols-12 items-end">
                      <div className="col-span-5 space-y-2">
                        <Label htmlFor={`amount-${index}`}>Từ (VND)</Label>
                        <Input 
                          id={`amount-${index}`}
                          type="number"
                          placeholder="Mức tiền"
                          value={tier.amount}
                          onChange={(e) => handleDiscountTierChange(index, 'amount', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-5 space-y-2">
                        <Label htmlFor={`discount-${index}`}>Ưu đãi (%)</Label>
                        <Input 
                          id={`discount-${index}`}
                          type="number"
                          placeholder="Phần trăm"
                          value={tier.discountPercent}
                          onChange={(e) => handleDiscountTierChange(index, 'discountPercent', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleRemoveDiscountTier(index)}
                        >
                          <span className="sr-only">Xóa</span>
                          &times;
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 px-6 py-4">
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    Ví dụ: Với cấu hình hiện tại, khi người dùng nạp {priceConfig.minimumDeposit.toLocaleString()}đ sẽ nhận được{' '}
                    {(priceConfig.minimumDeposit * priceConfig.coinConversionRate).toLocaleString()} coin
                  </p>
                  {priceConfig.discountTiers.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="font-medium flex items-center">
                        <BadgePercent className="h-4 w-4 mr-1" />
                        Các mức ưu đãi:
                      </p>
                      {priceConfig.discountTiers
                        .sort((a, b) => a.amount - b.amount)
                        .map((tier, index) => (
                          <p key={index}>
                            • Nạp từ {tier.amount.toLocaleString()}đ: Được cộng thêm {tier.discountPercent}% coin
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

export default PaymentSettingsPage;