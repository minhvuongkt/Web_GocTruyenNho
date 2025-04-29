import { MainLayout } from '@/components/layouts/main-layout';
import { PaymentTest } from '@/components/shared/payment-test';

export function PaymentTestPage() {
  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Test PayOS Integration</h1>
        <PaymentTest />
      </div>
    </MainLayout>
  );
}