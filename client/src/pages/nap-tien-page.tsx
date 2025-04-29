import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PayOSDirectCheckout } from '@/components/shared/payos-direct-checkout';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

// Định nghĩa schema kiểm tra đầu vào
const formSchema = z.object({
  amount: z.string().min(1, 'Vui lòng nhập số tiền')
    .refine(val => !isNaN(Number(val)), {
      message: 'Vui lòng nhập số',
    })
    .refine(val => Number(val) >= 10000, {
      message: 'Số tiền tối thiểu là 10,000đ',
    })
    .refine(val => Number(val) <= 10000000, {
      message: 'Số tiền tối đa là 10,000,000đ',
    })
});

// Các gói nạp nhanh
const QUICK_AMOUNTS = [
  { label: '20,000đ', value: 20000 },
  { label: '50,000đ', value: 50000 },
  { label: '100,000đ', value: 100000 },
  { label: '200,000đ', value: 200000 },
  { label: '500,000đ', value: 500000 },
];

export default function NapTienPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('payos');
  const [isProcessing, setIsProcessing] = useState(false);

  // Khởi tạo form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '50000',
    },
  });

  // Xử lý khi người dùng chọn gói nạp nhanh
  const handleQuickAmountClick = (amount: number) => {
    form.setValue('amount', amount.toString());
  };

  // Xử lý thành công
  const handleSuccess = (orderCode: string) => {
    setIsProcessing(false);
    toast({
      title: 'Thanh toán thành công',
      description: `Mã giao dịch: ${orderCode}`,
    });
  };

  // Xử lý hủy
  const handleCancel = () => {
    setIsProcessing(false);
    toast({
      title: 'Đã hủy thanh toán',
      variant: 'destructive',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <h1 className="text-3xl font-bold mb-6 text-center">Nạp tiền vào tài khoản</h1>
      
      {user ? (
        <div className="max-w-md mx-auto">
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-medium">Tài khoản: <span className="font-bold">{user.username}</span></p>
            <p className="text-sm">Số dư hiện tại: <span className="font-bold">{user.balance?.toLocaleString() || 0}đ</span></p>
          </div>
          
          <Tabs defaultValue="payos" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="payos">Thanh toán qua PayOS</TabsTrigger>
            </TabsList>
            
            <TabsContent value="payos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Nạp tiền qua PayOS</CardTitle>
                  <CardDescription>
                    Thanh toán trực tiếp qua ví điện tử, internet banking hoặc thẻ ATM
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Số tiền muốn nạp</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Nhập số tiền"
                        {...form.register('amount')}
                      />
                      {form.formState.errors.amount && (
                        <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      {QUICK_AMOUNTS.map((item) => (
                        <Button
                          key={item.value}
                          type="button"
                          variant="outline"
                          onClick={() => handleQuickAmountClick(item.value)}
                        >
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </form>
                </CardContent>
                
                <CardFooter>
                  <PayOSDirectCheckout
                    amount={Number(form.getValues('amount'))}
                    description={`NAP_${user.username}`}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                  />
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Cần đăng nhập</CardTitle>
            <CardDescription>
              Vui lòng đăng nhập để sử dụng tính năng nạp tiền
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/auth')}>
              Đăng nhập ngay
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}