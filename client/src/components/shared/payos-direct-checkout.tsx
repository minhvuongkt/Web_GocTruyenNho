import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface PayOSDirectCheckoutProps {
  amount: number;
  description?: string;
  onSuccess: (orderCode: string) => void;
  onCancel?: () => void;
}

export function PayOSDirectCheckout({ 
  amount, 
  description = "Nạp tiền", 
  onSuccess, 
  onCancel 
}: PayOSDirectCheckoutProps) {
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  // Handle QR code generation and payment creation
  const handleCreatePayment = async () => {
    setIsCreatingLink(true);
    
    try {
      // Generate a unique order code
      const newOrderCode = `ORDER${Date.now().toString().slice(-6)}`;
      setOrderCode(newOrderCode);
      
      // Call API to create payment
      const response = await apiRequest("POST", "/api/payos/create-payment", {
        amount,
        orderCode: newOrderCode,
        description: description.length > 25 ? description.substring(0, 25) : description,
        returnUrl: window.location.href,
        cancelUrl: window.location.href
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server không phản hồi');
      }

      const result = await response.json();
      console.log("PayOS response:", result);
      
      // Biến để lưu QR code và checkout URL
      let extractedQrCode = null;
      let extractedCheckoutUrl = null;
      
      // Xử lý cả hai loại response có thể nhận được từ PayOS
      // Loại 1: Cấu trúc { code, desc, data }
      if (result.code === '00' && result.data) {
        extractedQrCode = result.data.qrCode;
        extractedCheckoutUrl = result.data.checkoutUrl;
      } 
      // Loại 2: Response trực tiếp từ PayOS SDK (không có code, desc, data)
      else if (result.qrCode && result.checkoutUrl) {
        extractedQrCode = result.qrCode;
        extractedCheckoutUrl = result.checkoutUrl;
      }
      // Không có cấu trúc phù hợp
      else {
        throw new Error('Không thể tạo link thanh toán');
      }
      
      // Lưu giá trị đã trích xuất
      setQrCode(extractedQrCode);
      setCheckoutUrl(extractedCheckoutUrl);
      
      // Start the countdown timer (10 minutes = 600 seconds)
      setCountdown(600);
      
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

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdown]);

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Poll for payment status if we have an orderCode
  useEffect(() => {
    if (!orderCode || countdown <= 0) return;
    
    const checkStatus = async () => {
      try {
        const response = await apiRequest("GET", `/api/payos/status/${orderCode}`);
        
        if (!response.ok) return;
        
        const data = await response.json();
        console.log("Payment status check response:", data);
        
        // Kiểm tra trạng thái thanh toán trong cả hai loại response
        let isPaid = false;
        
        // Kiểm tra trạng thái từ cấu trúc mới (code, data)
        if (data.code === '00' && data.data && data.data.status === 'PAID') {
          isPaid = true;
        } 
        // Kiểm tra trạng thái từ cấu trúc cũ (trực tiếp từ API)
        else if (data.status === 'PAID') {
          isPaid = true;
        }
        
        if (isPaid) {
          setMessage("Thanh toán thành công!");
          onSuccess(orderCode);
          
          // Stop checking after success
          return;
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    };
    
    // Check every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    
    return () => clearInterval(interval);
  }, [orderCode, countdown, onSuccess]);

  // Handle payment completion manually
  const handleConfirmPayment = () => {
    if (!orderCode) return;
    
    toast({
      title: "Đang xác nhận thanh toán",
      description: "Vui lòng đợi trong giây lát..."
    });
    
    // Check payment status immediately
    fetch(`/api/payos/status/${orderCode}`)
      .then(res => res.json())
      .then(data => {
        console.log("Manual payment check response:", data);
        
        // Kiểm tra trạng thái thanh toán trong cả hai loại response
        let isPaid = false;
        
        // Kiểm tra trạng thái từ cấu trúc mới (code, data)
        if (data.code === '00' && data.data && data.data.status === 'PAID') {
          isPaid = true;
        } 
        // Kiểm tra trạng thái từ cấu trúc cũ (trực tiếp từ API)
        else if (data.status === 'PAID') {
          isPaid = true;
        }
        
        if (isPaid) {
          setMessage("Thanh toán thành công!");
          onSuccess(orderCode);
        } else {
          toast({
            title: "Thanh toán chưa hoàn tất",
            description: "Hệ thống chưa nhận được thanh toán. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
            variant: "destructive"
          });
        }
      })
      .catch(err => {
        console.error("Error checking manual payment:", err);
        toast({
          title: "Lỗi xác nhận",
          description: "Không thể xác nhận trạng thái thanh toán. Vui lòng thử lại sau.",
          variant: "destructive"
        });
      });
  };

  // Handle cancel
  const handleCancel = () => {
    setQrCode(null);
    setOrderCode(null);
    setCheckoutUrl(null);
    setCountdown(0);
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
          {!qrCode ? (
            <div className="w-full">
              {isCreatingLink ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Đang tạo mã thanh toán...</span>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleCreatePayment}
                >
                  Thanh toán qua PayOS
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col items-center space-y-4">
                <h3 className="font-semibold text-lg">Quét mã để thanh toán</h3>
                
                {countdown > 0 && (
                  <div className="text-center">
                    <span className="text-sm text-gray-500">Thời gian còn lại: </span>
                    <span className="font-medium">{formatTime(countdown)}</span>
                  </div>
                )}
                
                <div className="bg-white p-2 border border-gray-200 rounded-md">
                  <img 
                    src={qrCode} 
                    alt="QR Code thanh toán" 
                    className="w-48 h-48 mx-auto" 
                  />
                </div>
                
                <div className="text-center space-y-1">
                  <p className="text-sm text-gray-700">
                    Số tiền: <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(amount)} VND</span>
                  </p>
                  <p className="text-sm text-gray-700">
                    Mã giao dịch: <span className="font-medium">{orderCode}</span>
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                  {checkoutUrl && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open(checkoutUrl, '_blank')}
                    >
                      Mở cổng thanh toán
                    </Button>
                  )}
                  
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={handleConfirmPayment}
                  >
                    Tôi đã thanh toán
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={handleCancel}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}