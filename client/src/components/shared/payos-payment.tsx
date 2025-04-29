import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CreditCard, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createPayOSPaymentLink, checkPayOSPaymentStatus } from '@/services/payos-api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PayOSPaymentProps {
  amount: number;
  username: string;
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

export function PayOSPayment({ amount, username, onSuccess, onCancel }: PayOSPaymentProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<{
    orderCode: string;
    checkoutUrl: string;
    qrCode: string;
    status: string;
  } | null>(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [remainingTime, setRemainingTime] = useState(600); // 10 minutes in seconds

  // Timer for countdown
  useEffect(() => {
    if (paymentData && remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime(prev => prev - 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [paymentData, remainingTime]);

  // Format remaining time
  const formatRemainingTime = () => {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Create PayOS payment link
  useEffect(() => {
    const createPayment = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Generate unique order code with current timestamp and username
        const timestamp = new Date().getTime();
        const orderCode = `P${timestamp}_${username}`;

        // Create payment request data
        const requestData = {
          amount: amount,
          orderCode: orderCode,
          description: `Nạp tiền ${amount}đ cho tài khoản ${username}`,
          returnUrl: `${window.location.origin}/payment?result=success&order=${orderCode}`,
          cancelUrl: `${window.location.origin}/payment?result=cancel&order=${orderCode}`,
          expiredAt: Math.floor(Date.now() / 1000) + 600 // 10 minutes
        };

        // Call PayOS API
        const response = await createPayOSPaymentLink(requestData);
        
        if (response.code === '00') {
          setPaymentData({
            orderCode: response.data.orderCode,
            checkoutUrl: response.data.checkoutUrl,
            qrCode: response.data.qrCode,
            status: response.data.status
          });

          // Start status check interval
          const interval = setInterval(async () => {
            await checkPaymentStatus(response.data.orderCode);
          }, 5000); // Check every 5 seconds
          
          setStatusCheckInterval(interval);
        } else {
          setError(`Không thể tạo liên kết thanh toán: ${response.desc}`);
        }
      } catch (err: any) {
        setError(`Lỗi tạo thanh toán: ${err.message || 'Đã có lỗi xảy ra'}`);
        console.error('PayOS payment error:', err);
      } finally {
        setLoading(false);
      }
    };

    createPayment();

    // Cleanup interval on unmount
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [amount, username]);

  // Check payment status
  const checkPaymentStatus = async (orderCode: string) => {
    try {
      const response = await checkPayOSPaymentStatus(orderCode);
      
      if (response.code === '00') {
        if (response.data.status === 'PAID') {
          // Payment successful
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
          }
          
          toast({
            title: "Thanh toán thành công",
            description: "Tiền đã được nạp vào tài khoản của bạn",
            variant: "default",
          });
          
          onSuccess(response.data.id);
        } else if (response.data.status === 'CANCELLED' || response.data.status === 'EXPIRED') {
          // Payment cancelled or expired
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
          }
          
          setError('Thanh toán đã bị hủy hoặc hết hạn');
          setPaymentData(prev => prev ? { ...prev, status: response.data.status } : null);
        }
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
    }
  };

  // Handle expiration
  useEffect(() => {
    if (remainingTime <= 0) {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
      setError('Thanh toán đã hết hạn');
      setPaymentData(prev => prev ? { ...prev, status: 'EXPIRED' } : null);
    }
  }, [remainingTime, statusCheckInterval]);

  // Handle payment cancellation
  const handleCancel = () => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
    onCancel();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Đang tạo thanh toán PayOS...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Lỗi thanh toán</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={onCancel} variant="outline" className="mt-4">
          Thử lại
        </Button>
      </Alert>
    );
  }

  if (!paymentData) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Đang khởi tạo...</p>
      </div>
    );
  }

  const isExpiredOrCancelled = 
    paymentData.status === 'EXPIRED' || 
    paymentData.status === 'CANCELLED' || 
    remainingTime <= 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>PayOS - Thanh toán an toàn</CardTitle>
          <Badge variant={isExpiredOrCancelled ? "destructive" : "outline"}>
            {isExpiredOrCancelled 
              ? "Đã hết hạn" 
              : `Còn lại: ${formatRemainingTime()}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isExpiredOrCancelled ? (
          <>
            <div className="flex flex-col items-center">
              {paymentData.qrCode ? (
                <div className="border border-muted p-4 rounded-lg my-4">
                  <img 
                    src={paymentData.qrCode} 
                    alt="PayOS QR Code" 
                    className="mx-auto max-w-full h-auto"
                  />
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Không thể tạo mã QR</AlertTitle>
                  <AlertDescription>Vui lòng sử dụng nút thanh toán bên dưới</AlertDescription>
                </Alert>
              )}
              <p className="text-center font-semibold">
                Quét mã QR để thanh toán
              </p>
              <p className="text-center text-sm text-muted-foreground">
                {amount.toLocaleString()}đ
              </p>
            </div>
            
            <div className="text-center mt-4">
              <Button 
                variant="default" 
                size="lg" 
                onClick={() => window.open(paymentData.checkoutUrl, '_blank')}
                className="w-full"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Thanh toán ngay
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-destructive" />
            <h3 className="font-medium text-lg">Thanh toán đã hết hạn</h3>
            <p className="text-muted-foreground">
              Vui lòng tạo giao dịch mới để tiếp tục
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="outline" onClick={handleCancel}>
          {isExpiredOrCancelled ? "Tạo giao dịch mới" : "Hủy"}
        </Button>
      </CardFooter>
    </Card>
  );
}