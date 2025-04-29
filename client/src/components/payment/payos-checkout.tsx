import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface PayOSCheckoutProps {
  amount: number;
  onSuccess: (orderCode: string) => void;
  onCancel?: () => void;
}

/**
 * PayOS Checkout component - creates a payment via PayOS API
 * Designed based on official PayOS checkout documentation
 */
export function PayOSCheckout({ amount, onSuccess, onCancel }: PayOSCheckoutProps) {
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  // Create payment link handler
  const handleGetPaymentLink = async () => {
    setIsCreatingLink(true);
    
    try {
      // Generate a numeric order code based on timestamp
      const orderCode = Date.now().toString().slice(-8);
      
      // Call the API to create a payment with a short description (max 25 chars)
      const response = await apiRequest("POST", "/api/payments", {
        amount: amount,
        method: "credit_card", // Using the method expected by the backend
        orderCode: orderCode,
        // Keep description short as PayOS limits to 25 chars
        description: "Nạp tiền"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể tạo thanh toán');
      }

      const result = await response.json();
      
      if (result?.payment?.transactionId) {
        // For PayOS redirect method approach
        window.location.href = result.redirectUrl;
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
      setIsCreatingLink(false);
    }
  };

  // Check for success/cancel URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const orderId = params.get('id');
    
    if (status === 'success' && orderId) {
      setMessage("Đang xác nhận thanh toán...");
      
      // Confirm the payment with server
      const confirmPayment = async () => {
        try {
          const response = await apiRequest("POST", "/api/payments/confirm", {
            orderCode: orderId
          });
          
          if (!response.ok) {
            throw new Error("Xác nhận thanh toán thất bại");
          }
          
          setMessage("Thanh toán thành công!");
          onSuccess(orderId);
        } catch (error: any) {
          toast({
            title: 'Lỗi xác nhận',
            description: error.message || 'Không thể xác nhận thanh toán',
            variant: 'destructive',
          });
          if (onCancel) onCancel();
        }
      };
      
      confirmPayment();
    } else if (status === 'cancel') {
      toast({
        title: 'Thanh toán bị hủy',
        description: 'Bạn đã hủy quá trình thanh toán',
        variant: 'default',
      });
      if (onCancel) onCancel();
    }
  }, [onSuccess, onCancel, toast]);

  return (
    <div className="w-full flex flex-col items-center">
      {message ? (
        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 font-medium">{message}</p>
          {message === "Thanh toán thành công!" && (
            <Button 
              onClick={() => setMessage("")} 
              variant="outline" 
              className="mt-2"
            >
              Tiếp tục
            </Button>
          )}
        </div>
      ) : (
        <div className="w-full">
          {isCreatingLink ? (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span>Đang xử lý...</span>
            </div>
          ) : (
            <Button
              className="w-full"
              onClick={handleGetPaymentLink}
            >
              Thanh toán qua PayOS
            </Button>
          )}
        </div>
      )}
    </div>
  );
}