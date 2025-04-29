import React, { useState, useEffect } from 'react';
import { usePayOS } from '@payos/payos-checkout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface PayOSEmbeddedCheckoutProps {
  amount: number;
  description?: string;
  onSuccess: (orderCode: string) => void;
  onCancel?: () => void;
}

export function PayOSEmbeddedCheckout({ 
  amount, 
  description = "Thanh toán dịch vụ", 
  onSuccess, 
  onCancel 
}: PayOSEmbeddedCheckoutProps) {
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [payOSConfig, setPayOSConfig] = useState<{
    RETURN_URL: string;
    ELEMENT_ID: string;
    CHECKOUT_URL: string | null;
    embedded: boolean;
    onSuccess: (event: any) => void;
  }>({
    RETURN_URL: window.location.href, // required
    ELEMENT_ID: "embedded-payment-container", // required
    CHECKOUT_URL: null, // required
    embedded: true, // Embedded interface
    onSuccess: (event: any) => {
      // Handle successful payment
      setIsOpen(false);
      setMessage("Thanh toán thành công!");
      
      // Extract the order code from the event if available
      const orderCode = event?.orderCode || event?.data?.orderCode;
      if (orderCode) {
        onSuccess(orderCode);
      } else {
        // Fallback if orderCode isn't available in the event
        onSuccess("unknown");
      }
    },
  });
  const { toast } = useToast();
  const { open, exit } = usePayOS(payOSConfig);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      exit();
    };
  }, [exit]);

  // Open PayOS when checkout URL is available
  useEffect(() => {
    if (payOSConfig.CHECKOUT_URL) {
      open();
    }
  }, [payOSConfig.CHECKOUT_URL, open]);

  // Create payment link handler
  const handleGetPaymentLink = async () => {
    setIsCreatingLink(true);
    exit(); // Reset any previous PayOS instance
    
    try {
      // Generate an order code based on timestamp
      const orderCode = `ORDER-${Date.now().toString().slice(-6)}`;
      
      // Call the API to create a payment
      const response = await apiRequest("POST", "/api/payos/create-payment", {
        amount,
        orderCode,
        description,
        returnUrl: window.location.href,
        cancelUrl: window.location.href
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.desc || 'Server không phản hồi');
      }

      const result = await response.json();
      
      // Check for valid response
      if (result.code !== '00' || !result.data || !result.data.checkoutUrl) {
        throw new Error(result.desc || 'Không thể tạo link thanh toán');
      }
      
      // Update PayOS config with the checkout URL
      setPayOSConfig((oldConfig) => ({
        ...oldConfig,
        CHECKOUT_URL: result.data.checkoutUrl,
      }));

      setIsOpen(true);
    } catch (error: any) {
      toast({
        title: 'Lỗi tạo thanh toán',
        description: error.message || 'Đã xảy ra lỗi, vui lòng thử lại sau',
        variant: 'destructive',
      });
      console.error("PayOS payment error:", error);
    } finally {
      setIsCreatingLink(false);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    exit();
    setIsOpen(false);
    if (onCancel) onCancel();
  };

  return (
    <div className="w-full flex flex-col items-center">
      {message ? (
        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 font-medium">{message}</p>
          <Button 
            onClick={() => setMessage("")} 
            variant="outline" 
            className="mt-2"
          >
            Quay lại
          </Button>
        </div>
      ) : (
        <>
          {!isOpen ? (
            <div className="w-full">
              {isCreatingLink ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Đang tạo link thanh toán...</span>
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
          ) : (
            <div className="w-full space-y-4">
              <div
                id="embedded-payment-container"
                className="w-full border border-gray-200 rounded-lg overflow-hidden"
                style={{ height: '400px' }}
              ></div>
              
              <div className="flex space-x-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                >
                  Hủy thanh toán
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}