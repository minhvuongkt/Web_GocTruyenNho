import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';

interface PayOSEmbeddedCheckoutProps {
  amount: number;
  onSuccess: (transactionId: string) => void;
  onCancel?: () => void;
}

/**
 * PayOS Embedded Checkout component - displays PayOS QR code inline
 * Nhúng thanh toán PayOS trực tiếp vào trang web (giống VietQR)
 */
export function PayOSEmbeddedCheckout({ amount, onSuccess, onCancel }: PayOSEmbeddedCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const { toast } = useToast();

  // Create payment and get QR code
  const createPayment = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/payments", {
        amount: amount,
        method: "payos",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể tạo thanh toán');
      }

      const result = await response.json();
      
      if (result.payment && result.qrCode) {
        setTransactionId(result.payment.transactionId);
        setQrCode(result.qrCode);
        setCheckoutUrl(result.paymentLink);
        
        if (result.expiresAt) {
          setExpiresAt(new Date(result.expiresAt));
        }
        
        // Start polling for payment status
        startPolling(result.payment.transactionId);
      } else {
        throw new Error('Không nhận được thông tin thanh toán');
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi thanh toán',
        description: error.message || 'Đã xảy ra lỗi, vui lòng thử lại sau',
        variant: 'destructive',
      });
      console.error("Payment error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll payment status
  const startPolling = (orderCode: string) => {
    const checkPaymentStatus = async () => {
      if (!orderCode) return;
      
      try {
        const response = await apiRequest("GET", `/api/payment/payos/check-payment-status/${orderCode}`);
        if (!response.ok) return;
        
        const result = await response.json();
        
        if (result.payosStatus === 'PAID' || result.payment?.status === 'completed') {
          // Payment successful
          clearInterval(pollingInterval);
          onSuccess(orderCode);
          
          toast({
            title: 'Thanh toán thành công',
            description: 'Số dư của bạn đã được cập nhật',
          });
        } else if (result.payosStatus === 'CANCELLED' || result.payosStatus === 'EXPIRED' || 
                  result.payment?.status === 'failed') {
          // Payment failed
          clearInterval(pollingInterval);
          if (onCancel) onCancel();
          
          toast({
            title: 'Thanh toán thất bại',
            description: 'Giao dịch đã bị hủy hoặc hết hạn',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    };
    
    // Check immediately and then every 5 seconds
    checkPaymentStatus();
    const pollingInterval = setInterval(checkPaymentStatus, 5000);
    
    // Clean up interval on component unmount
    return () => clearInterval(pollingInterval);
  };

  // Format time remaining
  const formatTimeRemaining = () => {
    if (!expiresAt) return '';
    
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Đã hết hạn';
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    return `${diffMins}:${diffSecs < 10 ? '0' + diffSecs : diffSecs}`;
  };

  // Open PayOS checkout page
  const openPaymentPage = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  };

  // Handle restart payment
  const handleRestart = () => {
    setQrCode(null);
    setTransactionId(null);
    setCheckoutUrl(null);
    setExpiresAt(null);
    createPayment();
  };

  // Initialize payment on component mount
  useEffect(() => {
    createPayment();
    
    // Clean up: Stop polling when component unmounts
    return () => {};
  }, []);

  // Update time remaining every second
  useEffect(() => {
    const timer = setInterval(() => {
      if (expiresAt && new Date() > expiresAt) {
        setQrCode(null); // Clear QR code when expired
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Đang tạo thanh toán...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {qrCode ? (
        <Card className="border p-4 flex flex-col items-center">
          <div className="mb-3 text-center">
            <h3 className="font-semibold">Quét mã QR để thanh toán</h3>
            <p className="text-sm text-gray-500">
              Thời gian còn lại: <span className="font-medium">{formatTimeRemaining()}</span>
            </p>
          </div>
          
          <div className="mb-4 bg-white p-2 border rounded-lg">
            <img 
              src={qrCode} 
              alt="PayOS QR Code" 
              className="mx-auto max-w-full h-auto"
              style={{ width: '200px', height: '200px' }}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button variant="outline" onClick={handleRestart}>
              Tạo lại mã
            </Button>
            <Button onClick={openPaymentPage}>
              Mở trang thanh toán
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          className="w-full"
          onClick={createPayment}
        >
          Thanh toán qua PayOS
        </Button>
      )}
    </div>
  );
}