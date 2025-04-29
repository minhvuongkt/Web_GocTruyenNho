import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PayOSEmbeddedCheckout } from '@/components/shared/payos-embedded-checkout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function PaymentTest() {
  const [paymentTab, setPaymentTab] = useState('payos');
  const [amount, setAmount] = useState(20000);
  const { toast } = useToast();

  const handlePaymentSuccess = (transactionId: string) => {
    toast({
      title: 'Thanh toán thành công!',
      description: `Mã giao dịch: ${transactionId}`,
    });
  };

  const handlePaymentCancel = () => {
    toast({
      title: 'Đã hủy thanh toán',
      variant: 'destructive',
    });
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Kiểm tra thanh toán</CardTitle>
        <CardDescription>
          Thử nghiệm các phương thức thanh toán khác nhau
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Số tiền (VND)</Label>
            <Input
              id="amount"
              type="number"
              min={10000}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Số tiền tối thiểu 10,000 VND và phải chia hết cho 1,000
            </p>
          </div>

          <Tabs value={paymentTab} onValueChange={setPaymentTab}>
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="payos">PayOS (Embedded Checkout)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="payos" className="space-y-4 pt-4">
              <PayOSEmbeddedCheckout
                amount={amount}
                description="Thử nghiệm thanh toán qua PayOS"
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
              
              <div className="bg-muted p-3 rounded-md text-sm mt-4">
                <p>Hướng dẫn:</p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Nhấn "Thanh toán qua PayOS" để khởi tạo</li>
                  <li>Nhập thông tin thẻ test</li>
                  <li>Để test thành công, dùng thẻ: 
                    <ul className="list-disc list-inside ml-4 my-1">
                      <li>Số thẻ: 4111111111111111</li>
                      <li>Tên: TEST</li>
                      <li>Ngày hết hạn: 12/25</li>
                      <li>CVV: 123</li>
                    </ul>
                  </li>
                </ol>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}