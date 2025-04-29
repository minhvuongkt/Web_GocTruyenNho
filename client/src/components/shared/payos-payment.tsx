import { useState, useEffect } from "react";
import { createPayOSPaymentLink, checkPayOSPaymentStatus } from "@/services/payos-api";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PayOSPaymentProps {
  amount: number;
  username: string;
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

export function PayOSPayment({ amount, username, onSuccess, onCancel }: PayOSPaymentProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<{
    checkoutUrl?: string;
    qrCode?: string;
    orderCode?: string;
    id?: string;
  }>({});
  
  // Generate a unique order code based on timestamp and username
  const generateOrderCode = () => {
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `PAY_${username}_${timestamp}_${randomStr}`;
  };
  
  // Create payment on component mount
  useEffect(() => {
    const createPayment = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Current URL for return and cancel URLs
        const baseUrl = window.location.origin;
        const returnUrl = `${baseUrl}/payment?status=success`;
        const cancelUrl = `${baseUrl}/payment?status=cancelled`;
        
        // Create order code
        const orderCode = generateOrderCode();
        
        // Create payment through PayOS
        const response = await createPayOSPaymentLink({
          amount: amount,
          orderCode: orderCode,
          description: `Nạp tiền tài khoản - ${username}`,
          returnUrl,
          cancelUrl
        });
        
        if (response.code === 'SUCCESS' && response.data) {
          setPaymentInfo({
            checkoutUrl: response.data.checkoutUrl,
            qrCode: response.data.qrCode,
            orderCode: response.data.orderCode,
            id: response.data.id
          });
          
          // Start polling to check payment status
          startPollingPaymentStatus(response.data.orderCode);
        } else {
          setError(response.desc || "Không thể tạo giao dịch, vui lòng thử lại sau.");
        }
      } catch (err: any) {
        setError(err.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    
    createPayment();
    
    // Clean up any polling on unmount
    return () => {
      if (window.paymentStatusInterval) {
        clearInterval(window.paymentStatusInterval);
      }
    };
  }, [amount, username]);
  
  // Poll for payment status
  const startPollingPaymentStatus = (orderCode: string) => {
    // Poll every 5 seconds
    const intervalId = setInterval(async () => {
      try {
        const response = await checkPayOSPaymentStatus(orderCode);
        
        // Check if payment is successful
        if (response.code === 'SUCCESS' && response.data && response.data.status === 'PAID') {
          // Clear interval
          clearInterval(intervalId);
          
          // Call success callback
          onSuccess(response.data.id);
        }
      } catch (err) {
        console.error("Error checking payment status:", err);
      }
    }, 5000);
    
    // Save interval ID for cleanup
    window.paymentStatusInterval = intervalId;
  };
  
  // Handle URL change for redirect back from payment gateway
  useEffect(() => {
    const handlePaymentReturn = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get('status');
      
      // Check if we have returned from payment with success status
      if (status === 'success' && paymentInfo.orderCode) {
        // Check payment status once more
        checkPayOSPaymentStatus(paymentInfo.orderCode)
          .then(response => {
            if (response.code === 'SUCCESS' && response.data && response.data.status === 'PAID') {
              onSuccess(response.data.id);
            }
          })
          .catch(err => {
            console.error("Error checking payment status after return:", err);
          });
      } else if (status === 'cancelled') {
        // User cancelled the payment
        onCancel();
      }
    };
    
    handlePaymentReturn();
  }, [paymentInfo.orderCode, onSuccess, onCancel]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Đang tạo giao dịch thanh toán...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={onCancel}>Thử lại</Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center mb-2">
        <h3 className="text-lg font-medium">Thanh toán với PayOS</h3>
        <p className="text-sm text-muted-foreground">
          Số tiền: <span className="font-medium">{amount.toLocaleString('vi-VN')} VNĐ</span>
        </p>
      </div>
      
      {paymentInfo.qrCode && (
        <div className="border border-border rounded-md p-4 flex flex-col items-center bg-background">
          <p className="text-sm text-muted-foreground mb-2">Quét mã QR để thanh toán</p>
          <img 
            src={paymentInfo.qrCode} 
            alt="QR Code" 
            className="w-64 h-64 object-contain"
          />
        </div>
      )}
      
      {paymentInfo.checkoutUrl && (
        <div className="space-y-2 w-full">
          <Button
            className="w-full"
            onClick={() => window.open(paymentInfo.checkoutUrl, '_blank')}
          >
            Mở trang thanh toán
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={onCancel}
          >
            Hủy giao dịch
          </Button>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Mã đơn hàng: {paymentInfo.orderCode}
      </p>
    </div>
  );
}

// Add PaymentStatusInterval to Window interface
declare global {
  interface Window {
    paymentStatusInterval: NodeJS.Timeout;
  }
}