/**
 * Utilities for sending email notifications using SendGrid
 */

import * as sendgrid from '@sendgrid/mail';

// Kiểm tra và thiết lập API key SendGrid
if (process.env.SENDGRID_API_KEY) {
  sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'miu2k3a@gmail.com';

/**
 * Gửi email thông báo khi người dùng xác nhận thanh toán
 * 
 * @param transactionId Mã giao dịch
 * @param amount Số tiền
 * @param username Tên người dùng
 * @param method Phương thức thanh toán
 * @returns Promise<boolean> Trạng thái gửi email
 */
export async function sendPaymentConfirmationEmail(
  transactionId: string,
  amount: number,
  username: string,
  method: string
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured, skipping email notification');
    return false;
  }

  try {
    // Format số tiền
    const formattedAmount = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);

    // Phương thức thanh toán tiếng Việt
    const paymentMethod = method === 'bank_transfer' 
      ? 'Chuyển khoản ngân hàng'
      : method === 'payos'
        ? 'PayOS'
        : method;

    // Cấu hình email
    const msg = {
      to: ADMIN_EMAIL,
      from: 'no-reply@goctruyen-nho.com',
      subject: `[Góc Truyện Nhỏ] Thông báo xác nhận thanh toán`,
      text: `
        Người dùng đã xác nhận thanh toán!
        
        Thông tin giao dịch:
        - Mã giao dịch: ${transactionId}
        - Tài khoản: ${username}
        - Số tiền: ${formattedAmount}
        - Phương thức: ${paymentMethod}
        
        Hãy kiểm tra và xác nhận giao dịch trong trang quản trị.
      `,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Người dùng đã xác nhận thanh toán!</h2>
          
          <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
            <h3 style="margin-top: 0;">Thông tin giao dịch:</h3>
            <ul style="padding-left: 20px;">
              <li><strong>Mã giao dịch:</strong> ${transactionId}</li>
              <li><strong>Tài khoản:</strong> ${username}</li>
              <li><strong>Số tiền:</strong> ${formattedAmount}</li>
              <li><strong>Phương thức:</strong> ${paymentMethod}</li>
            </ul>
          </div>
          
          <p>Hãy kiểm tra và xác nhận giao dịch trong trang quản trị.</p>
        </div>
      `
    };

    // Gửi email
    await sendgrid.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}