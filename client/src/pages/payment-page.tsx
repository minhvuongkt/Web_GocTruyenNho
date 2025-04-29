import React, { useEffect } from 'react';
import { PaymentCallbackHandler } from '@/components/payment/payment-callback-handler';
import { useTitle } from '@/hooks/use-title';

export default function PaymentPage() {
  // Set page title
  useTitle('Thông tin thanh toán');
  
  return (
    <div className="container mx-auto py-8">
      <PaymentCallbackHandler />
    </div>
  );
}