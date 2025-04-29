/**
 * PayOS API Integration
 * This service handles API calls to PayOS for payment processing
 * See: https://github.com/payOSHQ/payos-demo-reactJS
 */

import { apiRequest } from "@/lib/queryClient";

// PayOS API request types
export interface CreatePaymentLinkRequest {
  amount: number;
  orderCode: string;
  description: string;
  cancelUrl: string;
  returnUrl: string;
  expiredAt: number; // Unix timestamp in seconds
}

export interface PaymentLinkResponse {
  code: string;
  desc: string;
  data: {
    paymentLinkId: string;
    orderCode: string;
    amount: number;
    status: string;
    checkoutUrl: string;
    qrCode: string;
  };
}

export interface CheckPaymentStatusResponse {
  code: string;
  desc: string;
  data: {
    id: string;
    orderCode: string;
    amount: number;
    amountPaid: number;
    status: string;
    createdAt: string;
    cancelUrl: string;
    returnUrl: string;
    description: string;
    paymentLinkId: string;
  };
}

/**
 * Create a payment link using PayOS
 * @param params Payment parameters
 * @returns Payment link information
 */
export async function createPayOSPaymentLink(data: CreatePaymentLinkRequest): Promise<PaymentLinkResponse> {
  try {
    const response = await apiRequest('POST', '/api/payment/payos/create-payment-link', data);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error creating PayOS payment link');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating PayOS payment link:', error);
    throw error;
  }
}

/**
 * Check the status of a payment
 * @param orderCode The order code to check
 * @returns Payment status information
 */
export async function checkPayOSPaymentStatus(orderCode: string): Promise<CheckPaymentStatusResponse> {
  try {
    const response = await apiRequest('GET', `/api/payment/payos/check-payment-status/${orderCode}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error checking PayOS payment status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking PayOS payment status:', error);
    throw error;
  }
}