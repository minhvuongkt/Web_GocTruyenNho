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
      'cancelUrl', 'returnUrl'
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
  return !!(data.qrCode && data.orderCode);
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