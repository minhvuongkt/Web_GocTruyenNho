import React, { useEffect, useState } from 'react';
import { useLocation, useRoute, useRouter } from 'wouter';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

/**
 * PayOS callback page - handles payment success, cancel, failure
 * URL formats:
 * - /payment-callback?code=00&id=xxx&status=PAID&orderCode=xxx - Success
 * - /payment-callback?cancel=true&orderCode=xxx - Cancelled
 */
export function PaymentCallbackPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "cancelled">("loading");
  const [message, setMessage] = useState("Đang xử lý kết quả thanh toán...");
  const [orderCode, setOrderCode] = useState<string | null>(null);

  useEffect(() => {
    // Parse the URL parameters
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const id = params.get('id');
    const paymentStatus = params.get('status'); 
    const orderCodeParam = params.get('orderCode');
    const cancelled = params.get('cancel') === 'true' || params.get('cancel') === 'false';
    
    setOrderCode(orderCodeParam);
    
    console.log("Payment callback params:", { code, id, status: paymentStatus, orderCode: orderCodeParam, cancelled });
    
    // Process the payment based on parameters
    const processPayment = async () => {
      try {
        // Check if payment was cancelled
        if (cancelled && params.get('cancel') === 'true') {
          setStatus("cancelled");
          setMessage("Thanh toán đã bị hủy.");
          return;
        }
        
        // Check if payment was successful
        if (paymentStatus === 'PAID' || code === '00') {
          // Verify the payment status from server
          if (orderCodeParam) {
            const response = await apiRequest("GET", `/api/payos/status/${orderCodeParam}`);
            if (response.ok) {
              const data = await response.json();
              const paymentData = data.data || data;
              
              if (paymentData.status === 'PAID') {
                setStatus("success");
                setMessage("Thanh toán thành công! Số tiền đã được nạp vào tài khoản của bạn.");
                
                // Show success toast
                toast({
                  title: "Thanh toán thành công",
                  description: "Giao dịch đã được hoàn tất và cập nhật tài khoản của bạn.",
                  variant: "default",
                });
                
                return;
              }
            }
          }
        }
        
        // If we reach here, something went wrong
        setStatus("error");
        setMessage("Có lỗi xảy ra trong quá trình xử lý thanh toán. Vui lòng kiểm tra lại sau.");
        
      } catch (error) {
        console.error("Error processing payment callback:", error);
        setStatus("error");
        setMessage("Có lỗi xảy ra trong quá trình xử lý thanh toán. Vui lòng kiểm tra lại sau.");
      }
    };
    
    processPayment();
  }, [toast]);
  
  const goToHomePage = () => {
    setLocation("/");
  };
  
  const goToWalletPage = () => {
    setLocation("/wallet");
  };
  
  return (
    <div className="container max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow-sm">
      <div className="text-center mb-6">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-semibold">Đang xử lý thanh toán</h2>
            <p className="text-gray-500 mt-2">Vui lòng chờ trong giây lát...</p>
          </div>
        )}
        
        {status === "success" && (
          <div className="flex flex-col items-center justify-center">
            <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-600">Thanh toán thành công</h2>
            {orderCode && (
              <p className="text-gray-500 mt-1">Mã giao dịch: {orderCode}</p>
            )}
            <p className="text-gray-600 mt-3">{message}</p>
          </div>
        )}
        
        {status === "error" && (
          <div className="flex flex-col items-center justify-center">
            <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-600">Thanh toán thất bại</h2>
            <p className="text-gray-600 mt-3">{message}</p>
          </div>
        )}
        
        {status === "cancelled" && (
          <div className="flex flex-col items-center justify-center">
            <div className="h-16 w-16 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-600">Thanh toán đã bị hủy</h2>
            <p className="text-gray-600 mt-3">{message}</p>
          </div>
        )}
      </div>
      
      <div className="flex flex-col space-y-3 mt-6">
        {status === "success" && (
          <Button onClick={goToWalletPage} className="w-full">
            Xem ví của tôi
          </Button>
        )}
        
        <Button 
          onClick={goToHomePage} 
          variant={status === "success" ? "outline" : "default"} 
          className="w-full"
        >
          Về trang chủ
        </Button>
      </div>
    </div>
  );
}

export default PaymentCallbackPage;