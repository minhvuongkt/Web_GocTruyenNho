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
 * PayOS payment data schema - cấu trúc thông tin phản hồi từ PayOS
 */
interface PayOSPaymentData {
  id?: string;
  checkoutUrl?: string;
  qrCode?: string;
  orderCode?: string;
  status?: string;
  amount?: number;
  description?: string;
  cancelUrl?: string;
  returnUrl?: string;
}

/**
 * PayOS payment response interface - dùng cho cả cấu trúc format mới và cũ
 */
interface PayOSPaymentResponse {
  // Format chuẩn từ PayOS API
  code?: string;
  desc?: string;
  data?: PayOSPaymentData;
  
  // Đặc biệt: dành cho các response được băng bọc do tương thích
  id?: string;
  checkoutUrl?: string;
  qrCode?: string;
  orderCode?: string;
  status?: string;
  amount?: number;
  description?: string;
  cancelUrl?: string;
  returnUrl?: string;
}

/**
 * Create a PayOS payment link
 * 
 * @param data Payment data including amount, description, and order code
 * @returns PayOS payment response
 */
export async function createPayOSPaymentLink(data: PayOSPaymentRequest): Promise<PayOSPaymentResponse> {
  try {
    const response = await apiRequest("POST", "/api/payos/create-payment", data);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create PayOS payment');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error creating PayOS payment:", error);
    throw error;
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
    const response = await apiRequest("GET", `/api/payos/status/${orderCode}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to check PayOS payment status');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error checking PayOS payment status:", error);
    throw error;
  }
}