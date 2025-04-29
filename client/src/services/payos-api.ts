import { apiRequest } from "@/lib/queryClient";

/**
 * PayOS payment data interface
 */
interface PayOSPaymentRequest {
  amount: number;
  orderCode: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  expiredAt?: number;
}

/**
 * PayOS payment response interface
 */
interface PayOSPaymentResponse {
  code: string;
  desc: string;
  data?: {
    id: string;
    checkoutUrl: string;
    qrCode: string;
    orderCode: string;
    status: string;
    amount: number;
    description: string;
    cancelUrl: string;
    returnUrl: string;
  };
}

/**
 * Create a PayOS payment link
 * 
 * @param data Payment data including amount, description, and order code
 * @returns PayOS payment response
 */
export async function createPayOSPaymentLink(data: PayOSPaymentRequest): Promise<PayOSPaymentResponse> {
  try {
    const response = await apiRequest('POST', '/api/payments/payos/create', data);
    return await response.json();
  } catch (error: any) {
    console.error('Failed to create PayOS payment:', error);
    return {
      code: 'ERROR',
      desc: error.message || 'Failed to create payment',
    };
  }
}

/**
 * Check PayOS payment status by order code
 * 
 * @param orderCode Order code to check
 * @returns PayOS payment status response
 */
export async function checkPayOSPaymentStatus(orderCode: string): Promise<PayOSPaymentResponse> {
  try {
    const response = await apiRequest('GET', `/api/payments/payos/status/${orderCode}`);
    return await response.json();
  } catch (error: any) {
    console.error('Failed to check PayOS payment status:', error);
    return {
      code: 'ERROR',
      desc: error.message || 'Failed to check payment status',
    };
  }
}