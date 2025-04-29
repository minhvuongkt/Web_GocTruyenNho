/**
 * Utilities for sending email notifications using Nodemailer
 */

import nodemailer from 'nodemailer';
import { db } from './db';
import { paymentSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Tạo transporter dựa trên cấu hình từ database
 * @returns Nodemailer transporter
 */
async function createTransporter() {
  try {
    // Lấy cấu hình email từ database
    const [settings] = await db.select().from(paymentSettings);
    
    if (!settings || !settings.emailConfig) {
      console.error('Không tìm thấy cấu hình email');
      return null;
    }
    
    const emailConfig = settings.emailConfig as any;
    
    // Kiểm tra các thông tin bắt buộc
    if (!emailConfig.smtpHost || !emailConfig.smtpPort || !emailConfig.smtpUser || !emailConfig.smtpPass) {
      console.error('Thiếu thông tin cấu hình SMTP');
      return null;
    }
    
    // Tạo transporter
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: emailConfig.smtpUser,
        pass: emailConfig.smtpPass,
      },
    });
    
    return transporter;
  } catch (error) {
    console.error('Lỗi khi tạo email transporter:', error);
    return null;
  }
}

/**
 * Lấy email của admin từ cấu hình
 * @returns Email của admin
 */
async function getAdminEmail(): Promise<string> {
  try {
    const [settings] = await db.select().from(paymentSettings);
    
    if (!settings || !settings.emailConfig) {
      return 'hlmvuong123@gmail.com'; // Email mặc định
    }
    
    const emailConfig = settings.emailConfig as any;
    return emailConfig.adminEmail || 'hlmvuong123@gmail.com';
  } catch (error) {
    console.error('Lỗi khi lấy email admin:', error);
    return 'hlmvuong123@gmail.com';
  }
}

/**
 * Lấy email người gửi từ cấu hình
 * @returns Email người gửi
 */
async function getSenderEmail(): Promise<string> {
  try {
    const [settings] = await db.select().from(paymentSettings);
    
    if (!settings || !settings.emailConfig) {
      return 'no-reply@goctruyen-nho.com'; // Email mặc định
    }
    
    const emailConfig = settings.emailConfig as any;
    return emailConfig.senderEmail || emailConfig.smtpUser || 'no-reply@goctruyen-nho.com';
  } catch (error) {
    console.error('Lỗi khi lấy email người gửi:', error);
    return 'no-reply@goctruyen-nho.com';
  }
}

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
  try {
    const transporter = await createTransporter();
    
    if (!transporter) {
      console.warn('Không thể tạo email transporter, bỏ qua thông báo');
      return false;
    }
    
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
    
    // Lấy email admin và email người gửi
    const adminEmail = await getAdminEmail();
    const senderEmail = await getSenderEmail();

    // Cấu hình email
    const mailOptions = {
      from: `"Góc Truyện Nhỏ" <${senderEmail}>`,
      to: adminEmail,
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
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}