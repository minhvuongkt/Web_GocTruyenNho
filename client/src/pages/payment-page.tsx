import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { PayOSCheckout } from '@/components/payment/payos-checkout';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

interface PricingData {
  minimumDeposit: number;
  coinConversionRate: number;
  discountTiers: {
    amount: number;
    discountPercent: number;
  }[];
}

export function PaymentPage() {
  const [amount, setAmount] = useState<number>(20000);
  const [activeTab, setActiveTab] = useState<string>('payos');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get pricing data
  const { data: pricingData, isLoading: isLoadingPricing } = useQuery<PricingData>({
    queryKey: ['/api/payment-settings/pricing'],
    staleTime: 60000, // 1 minute
  });

  // Handle successful payment
  const handlePaymentSuccess = (transactionId: string) => {
    toast({
      title: "Thanh toán thành công",
      description: `Giao dịch #${transactionId} đã được xác nhận`,
    });
    
    // Refresh user data to show updated balance
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
  };

  // Handle payment cancellation
  const handlePaymentCancel = () => {
    toast({
      title: "Đã hủy thanh toán",
      description: "Thanh toán bị hủy hoặc thất bại",
    });
  };

  // Get appropriate amount based on pricing tiers
  const getAmountWithDiscount = () => {
    if (!pricingData) return { displayAmount: amount, discount: 0, finalAmount: amount };
    
    // Find applicable discount tier
    const applicableTier = pricingData.discountTiers
      .filter(tier => amount >= tier.amount)
      .sort((a, b) => b.amount - a.amount)[0]; // Get highest applicable tier
    
    if (!applicableTier) return { displayAmount: amount, discount: 0, finalAmount: amount };
    
    const discount = Math.floor(amount * applicableTier.discountPercent / 100);
    const finalAmount = amount + discount;
    
    return {
      displayAmount: amount,
      discount: discount,
      discountPercent: applicableTier.discountPercent,
      finalAmount: finalAmount
    };
  };

  // Format number with thousand separators
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const amountInfo = getAmountWithDiscount();

  if (isLoadingPricing) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Nạp tiền vào tài khoản</h1>
      
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Chọn số tiền nạp</CardTitle>
            <CardDescription>
              Số tiền nạp tối thiểu: {formatNumber(pricingData?.minimumDeposit || 10000)}đ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[20000, 50000, 100000, 200000, 500000, 1000000].map((value) => (
                  <Button 
                    key={value} 
                    variant={amount === value ? "default" : "outline"}
                    onClick={() => setAmount(value)}
                    className="text-sm"
                  >
                    {formatNumber(value)}đ
                  </Button>
                ))}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custom-amount">Số tiền khác:</Label>
                <Input
                  id="custom-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={pricingData?.minimumDeposit || 10000}
                  step={1000}
                />
              </div>
              
              {amountInfo.discount > 0 && (
                <div className="bg-green-50 p-3 rounded-md text-sm">
                  <p className="font-medium text-green-700">Bạn được thưởng {amountInfo.discountPercent}%!</p>
                  <p className="text-green-600">
                    Nạp {formatNumber(amountInfo.displayAmount)}đ, 
                    nhận {formatNumber(amountInfo.finalAmount)}đ 
                    (thêm {formatNumber(amountInfo.discount)}đ)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Tabs defaultValue="payos" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="payos">PayOS</TabsTrigger>
                <TabsTrigger value="bank">Chuyển khoản</TabsTrigger>
              </TabsList>
              
              <TabsContent value="payos" className="space-y-4 mt-4">
                <p className="text-sm text-gray-500 mb-2">
                  Thanh toán an toàn qua cổng PayOS (hỗ trợ thẻ Visa, ATM, Momo, ZaloPay...)
                </p>
                
                <PayOSCheckout 
                  amount={amount}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              </TabsContent>
              
              <TabsContent value="bank" className="space-y-4 mt-4">
                <div className="border rounded-md p-4 space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="font-medium">Ngân hàng:</div>
                    <div className="col-span-2">MB Bank</div>
                    
                    <div className="font-medium">Số tài khoản:</div>
                    <div className="col-span-2">0862713897</div>
                    
                    <div className="font-medium">Chủ tài khoản:</div>
                    <div className="col-span-2">Mèo Đi Dịch Truyện</div>
                    
                    <div className="font-medium">Nội dung CK:</div>
                    <div className="col-span-2 font-medium">NAP_admin</div>
                  </div>
                  
                  <div className="pt-2 text-sm text-amber-600 border-t mt-2">
                    <p>Lưu ý: Sau khi chuyển khoản, vui lòng chờ 5-10 phút để hệ thống xác nhận.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default PaymentPage;