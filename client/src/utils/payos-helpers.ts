/**
 * Utility functions for handling PayOS API responses
 */

/**
 * PayOS payment data schema - cấu trúc thông tin phản hồi từ PayOS
 */
export interface PayOSPaymentData {
  id?: string;
  checkoutUrl?: string;
  qrCode?: string;
  orderCode?: string;
  status?: string;
  amount?: number;
  description?: string;
  cancelUrl?: string;
  returnUrl?: string;
  expiresAt?: string; // Thời gian hết hạn dạng ISO string
}

/**
 * PayOS payment response interface - dùng cho cả cấu trúc format mới và cũ
 */
export interface PayOSPaymentResponse {
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
  message?: string;
  expiresAt?: string; // Thời gian hết hạn dạng ISO string
}

/**
 * Trích xuất dữ liệu thanh toán từ nhiều định dạng response khác nhau của PayOS
 * 
 * @param response Phản hồi từ PayOS API
 * @returns Đối tượng chứa các thông tin thanh toán đã trích xuất
 */
export function extractPayOSPaymentData(response: PayOSPaymentResponse): PayOSPaymentData {
  const result: PayOSPaymentData = {};
  
  // Kiểm tra định dạng response dạng wrapper (code, data)
  if (response.code === '00' && response.data) {
    Object.assign(result, response.data);
  } 
  // Kiểm tra nếu thông tin được trả trực tiếp
  else {
    // Danh sách key cần trích xuất từ response trực tiếp
    const keys: Array<keyof PayOSPaymentData> = [
      'id', 'checkoutUrl', 'qrCode', 'orderCode', 
      'status', 'amount', 'description', 
      'cancelUrl', 'returnUrl', 'expiresAt'
    ];
    
    // Chỉ sao chép các key có giá trị
    keys.forEach(key => {
      if (response[key] !== undefined) {
        result[key] = response[key] as any;
      }
    });
  }
  
  return result;
}

/**
 * Kiểm tra xem phản hồi PayOS có hợp lệ không (có chứa thông tin cần thiết)
 * 
 * @param data Dữ liệu PayOS đã trích xuất
 * @returns boolean - Có hợp lệ hay không
 */
export function isValidPayOSResponse(data: PayOSPaymentData): boolean {
  // Kiểm tra các thông tin tối thiểu cho workflow thanh toán
  // Hoặc có mã QR, hoặc có checkoutUrl là đủ để tiếp tục
  return !!(data.qrCode || data.checkoutUrl);
}

/**
 * Trích xuất thông tin lỗi từ response PayOS
 * 
 * @param response Phản hồi từ PayOS API
 * @returns Thông báo lỗi
 */
export function extractPayOSErrorMessage(response: PayOSPaymentResponse): string {
  // Thứ tự ưu tiên các nguồn thông báo lỗi
  if (response.desc) return response.desc;
  if (response.message) return response.message;
  if (response.code && response.code !== '00') return `Mã lỗi: ${response.code}`;
  
  return 'Không thể tạo đường dẫn thanh toán';
}

/**
 * Format VietQR data from QR code
 * @param qrCodeData Chuỗi mã QR nhận được từ PayOS
 * @returns Chuỗi đã được định dạng
 */
export function formatVietQRCode(qrCodeData: string): string {
  // Format QR code data for display
  return qrCodeData;
}

/**
 * Tạo URL ảnh VietQR từ dữ liệu QR code của PayOS
 * 
 * @param qrCodeData Chuỗi dữ liệu QR code từ PayOS
 * @param options Các tuỳ chọn hiển thị (kích thước, màu sắc...)
 * @returns URL ảnh VietQR hoặc null nếu lỗi
 */
export function generateVietQRImageUrl(qrCodeData: string, options: { 
  size?: number; 
  format?: 'svg' | 'png'; 
  color?: string; 
  bgcolor?: string;
} = {}): string {
  if (!qrCodeData) return '';
  
  const { 
    size = 200, 
    format = 'png', 
    color = '000000', 
    bgcolor = 'ffffff' 
  } = options;
  
  try {
    // Nếu là chuỗi QR từ PayOS, sử dụng QR code generator API
    if (qrCodeData.startsWith("00020101")) {
      // Gọi API của VietQR để tạo ảnh QR code
      return `https://api.vietqr.io/image/${qrCodeData}?size=${size}`;
    }
    
    // Fallback sử dụng QR code generator thông thường nếu không phải VietQR
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrCodeData)}`;
  } catch (error) {
    console.error('Failed to generate VietQR image URL:', error);
    // Fallback sử dụng QR code generator thông thường
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrCodeData)}`;
  }
}

/**
 * Kiểm tra trạng thái thanh toán qua API
 * 
 * @param transactionId Mã giao dịch cần kiểm tra
 * @returns Thông tin trạng thái thanh toán
 */
export async function checkPaymentStatus(transactionId: string): Promise<{
  status: string;
  transactionId: string;
  apiStatus?: string;
  updatedAt?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/payments/${transactionId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to check payment status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking payment status:', error);
    throw error;
  }
}

/**
 * Lấy mã QR code cho giao dịch từ API
 * 
 * @param transactionId Mã giao dịch
 * @returns Thông tin QR code và thanh toán
 */
export async function getPaymentQRCode(transactionId: string): Promise<{
  qrCode: string;
  checkoutUrl: string;
  amount: number;
  description: string;
  transactionId: string;
  expiresAt: string;
}> {
  try {
    const response = await fetch(`/api/payments/${transactionId}/qr`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to get QR code');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting payment QR code:', error);
    throw error;
  }
}