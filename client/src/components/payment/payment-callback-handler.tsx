import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

/**
 * Component that handles payment callbacks from payment gateways
 * Supports multiple payment methods with different callback URL formats
 */
export function PaymentCallbackHandler() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'cancelled'>('loading');
  const [message, setMessage] = useState<string>('Đang xác thực thanh toán...');
  const [orderId, setOrderId] = useState<string | null>(null);
  
  useEffect(() => {
    const processPaymentCallback = async () => {
      try {
        // Lấy tham số từ URL
        const urlParams = new URLSearchParams(window.location.search);
        
        // Xử lý callback từ PayOS
        // PayOS thường trả về các tham số: code, id, cancel, status, orderCode
        const paymentId = urlParams.get('id');
        const orderCode = urlParams.get('orderCode');
        const paymentStatus = urlParams.get('status');
        const isCancelled = urlParams.get('cancel') === 'true';
        
        // Nếu người dùng hủy thanh toán
        if (isCancelled) {
          setStatus('cancelled');
          setMessage('Thanh toán đã bị hủy.');
          return;
        }
        
        // Nếu có mã giao dịch, kiểm tra trạng thái thanh toán
        if (orderCode || paymentId) {
          setOrderId(orderCode || paymentId || null);
          
          // PayOS trạng thái PAID nghĩa là thanh toán thành công
          if (paymentStatus === 'PAID') {
            // Gọi API để kiểm tra trạng thái thanh toán
            // Không cần gọi API update vì server sẽ tự động xử lý webhook
            // hoặc đã xử lý callback URL với trạng thái PAID
            setStatus('success');
            setMessage('Thanh toán thành công! Tài khoản của bạn đã được cập nhật.');
          } else {
            // Thanh toán chưa hoàn tất hoặc đang xử lý
            setStatus('error');
            setMessage('Thanh toán chưa hoàn tất. Nếu bạn đã thanh toán, vui lòng đợi hệ thống xác nhận.');
          }
        } else {
          // Không có thông tin giao dịch
          setStatus('error');
          setMessage('Không tìm thấy thông tin giao dịch.');
        }
      } catch (error) {
        console.error("Error processing payment callback:", error);
        setStatus('error');
        setMessage('Đã xảy ra lỗi khi xác thực thanh toán. Vui lòng liên hệ hỗ trợ.');
      }
    };
    
    processPaymentCallback();
  }, []);
  
  // Hiển thị thông tin trạng thái thanh toán
  const StatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-12 w-12 text-orange-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="w-full max-w-lg mx-auto mt-12 p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-col items-center space-y-6">
        <StatusIcon />
        
        <h2 className="text-2xl font-semibold text-center">
          {status === 'loading' ? 'Đang xử lý thanh toán' : 
           status === 'success' ? 'Thanh toán thành công' :
           status === 'cancelled' ? 'Thanh toán đã hủy' : 'Thanh toán không thành công'}
        </h2>
        
        <p className="text-center text-gray-600">{message}</p>
        
        {orderId && (
          <p className="text-sm text-gray-500">
            Mã giao dịch: <span className="font-medium">{orderId}</span>
          </p>
        )}
        
        <div className="flex space-x-4">
          <Button 
            onClick={() => setLocation('/account')}
            variant={status === 'success' ? 'default' : 'outline'}
          >
            Tài khoản của tôi
          </Button>
          
          <Button 
            onClick={() => setLocation('/nap-tien')}
            variant={status === 'success' ? 'outline' : 'default'}
          >
            {status === 'success' ? 'Nạp thêm tiền' : 'Thử lại'}
          </Button>
        </div>
      </div>
    </div>
  );
}