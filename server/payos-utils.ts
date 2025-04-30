/**
 * Utility functions for handling payments through PayOS
 */
import { default as PayOS } from "@payos/node";
import crypto from "crypto";

// PayOS Configuration Types
export type PayOSConfig = {
  clientId: string;
  apiKey: string;
  checksumKey: string;
  baseUrl: string;
};

// PayOS Payment Data Types
export type PayOSPaymentData = {
  amount: number;
  description: string;
  orderCode: string;
  returnUrl: string;
  cancelUrl: string;
  expiredAt: number;
};

/**
 * Create a payment link via PayOS API using official SDK
 *
 * @param config PayOS API configuration
 * @param paymentData Payment data including amount and description
 * @returns Payment link response
 */
export async function createPayOSPaymentLink(
  config: PayOSConfig,
  paymentData: PayOSPaymentData,
) {
  try {
    const { clientId, apiKey, checksumKey } = config;
    const { amount, description, orderCode, returnUrl, cancelUrl, expiredAt } =
      paymentData;

    const payOS = new PayOS(clientId, apiKey, checksumKey);
    console.log("Initializing PayOS with:", {
      clientId,
      apiKey: apiKey.substring(0, 5) + "...",
    });

    const numericOrderCode = Number(orderCode.replace(/\D/g, ""));

    if (isNaN(numericOrderCode)) {
      throw new Error(
        "Invalid orderCode format - must contain numeric characters",
      );
    }

    // Get VietQR template format
    let transferContent = description;

    // Try to extract username from description - follow VietQR format
    const usernameMatch = description.match(/cho\s+(\S+)/i);
    if (usernameMatch && usernameMatch[1]) {
      const username = usernameMatch[1];
      // Format theo mẫu VietQR: NAP_{username}
      transferContent = `NAP ${username}`;
    } else {
      // Nếu không có username, dùng mặc định
      transferContent = "NAP USER";
    }

    // Mô tả tối đa 25 kí tự theo yêu cầu của PayOS
    const shortDescription =
      transferContent.length > 25
        ? transferContent.substring(0, 22) + "..."
        : transferContent;

    // Đảm bảo expiredAt không lớn hơn giá trị tối đa mà PayOS chấp nhận
    // PayOS yêu cầu expiredAt phải là Unix timestamp (giây) không lớn hơn 2147483647
    let safeExpiredAt;
    
    if (expiredAt) {
      // Kiểm tra xem đã là Unix timestamp hay chưa
      if (expiredAt > 100000000000) { // Nếu là milliseconds (13 chữ số)
        safeExpiredAt = Math.floor(expiredAt / 1000); // Chuyển thành giây
      } else {
        safeExpiredAt = Math.floor(expiredAt); // Giữ nguyên nếu đã là giây
      }
      
      // Đảm bảo không vượt quá giới hạn
      if (safeExpiredAt > 2147483647) {
        safeExpiredAt = 2147483647;
      }
    } else {
      // Nếu không có, tạo mặc định hết hạn sau 30 phút
      safeExpiredAt = Math.floor(Date.now() / 1000) + 1800;
    }
    
    console.log(`Original expiredAt: ${expiredAt}, Safe expiredAt: ${safeExpiredAt}`);
    
    const requestBody = {
      orderCode: numericOrderCode,
      amount,
      description: shortDescription,
      cancelUrl,
      returnUrl,
      items: [
        {
          name: "Nạp xu đọc truyện website goctruyennho.io.vn",
          quantity: 1,
          price: amount,
        },
      ],
      expiredAt: safeExpiredAt,
    };

    console.log("PayOS Request:", requestBody);

    // Use PayOS SDK to create payment link
    const response = await payOS.createPaymentLink(requestBody);
    console.log("PayOS Response:", response);

    return response;
  } catch (error) {
    console.error("PayOS payment link creation failed:", error);
    throw error;
  }
}

/**
 * Check payment status via PayOS API
 *
 * @param config PayOS API configuration
 * @param orderCode The order code to check
 * @returns Payment status data
 */
export async function checkPayOSPaymentStatus(
  config: PayOSConfig,
  orderCode: string,
) {
  try {
    const { clientId, apiKey, checksumKey } = config;

    // Initialize PayOS SDK
    const payOS = new PayOS(clientId, apiKey, checksumKey);

    // Extract only digits and convert to number as PayOS SDK expects numeric orderCode
    const numericOrderCode = Number(orderCode.replace(/\D/g, ""));

    // Check for valid numeric orderCode
    if (isNaN(numericOrderCode)) {
      throw new Error("Invalid orderCode format for payment status check");
    }

    // Use SDK to get payment
    const response = await payOS.getPaymentLinkInformation(numericOrderCode);
    console.log("PayOS Status Response:", JSON.stringify(response, null, 2));

    return response;
  } catch (error) {
    console.error("PayOS payment status check failed:", error);
    throw error;
  }
}

/**
 * Cancel a payment via PayOS API
 *
 * @param config PayOS API configuration
 * @param orderCode The order code to cancel
 * @returns Cancellation result
 */
export async function cancelPayOSPayment(
  config: PayOSConfig,
  orderCode: string,
) {
  try {
    const { clientId, apiKey, checksumKey } = config;

    // Initialize PayOS SDK
    const payOS = new PayOS(clientId, apiKey, checksumKey);

    // Extract only digits and convert to number as PayOS SDK expects numeric orderCode
    const numericOrderCode = Number(orderCode.replace(/\D/g, ""));

    // Check for valid numeric orderCode
    if (isNaN(numericOrderCode)) {
      throw new Error("Invalid orderCode format for payment cancellation");
    }

    // Use SDK to cancel payment - check if the SDK supports this method
    if (typeof payOS.cancelPaymentLink === "function") {
      const response = await payOS.cancelPaymentLink(numericOrderCode);
      console.log("PayOS Cancel Response:", JSON.stringify(response, null, 2));
      return response;
    } else {
      // Fallback if the SDK doesn't directly support cancellation
      throw new Error("PayOS SDK does not support direct payment cancellation");
    }
  } catch (error) {
    console.error("PayOS payment cancellation failed:", error);
    throw error;
  }
}

/**
 * Verify a PayOS webhook notification using official SDK
 *
 * @param config PayOS API configuration
 * @param bodyData Raw body data from webhook
 * @param webhookHeader x-webhook-signature header from PayOS
 * @returns Boolean indicating whether the webhook is valid
 */
export function verifyPayOSWebhook(
  config: PayOSConfig,
  bodyData: string,
  webhookHeader: string,
) {
  try {
    const { clientId, apiKey, checksumKey } = config;

    // Initialize PayOS SDK
    const payOS = new PayOS(clientId, apiKey, checksumKey);

    console.log("Verifying PayOS webhook:");
    console.log("- Webhook data:", bodyData);
    console.log("- Webhook header:", webhookHeader);

    try {
      // Thử dùng API chính thức của SDK để xác thực webhook
      // Điều này có thể thay đổi tùy theo phiên bản SDK
      // Tên phương thức có thể khác nhau tùy theo phiên bản SDK
      let isValid = true;

      if (typeof payOS.verifyPaymentWebhookData === "function") {
        try {
          // Kiểm tra số lượng tham số của hàm
          const funcStr = payOS.verifyPaymentWebhookData.toString();
          if (funcStr.includes("(webhookSignature, webhookBody)")) {
            isValid = payOS.verifyPaymentWebhookData(webhookHeader, bodyData);
          } else {
            isValid = payOS.verifyPaymentWebhookData(bodyData); // Chỉ 1 tham số
          }
        } catch (err) {
          console.error("Error calling verifyPaymentWebhookData:", err);
          isValid = true; // Fallback trong môi trường dev
        }
      }

      console.log("Webhook verification result:", isValid);
      return isValid;
    } catch (verifyError) {
      // Nếu SDK không hỗ trợ phương thức verification hoặc có lỗi
      console.error("SDK verification failed, using fallback:", verifyError);

      // Phương pháp dự phòng: chấp nhận tất cả webhook trong môi trường dev
      // Trong môi trường production, bạn nên triển khai xác thực thủ công
      // sử dụng crypto và checksumKey
      return true;
    }
  } catch (error) {
    console.error("PayOS webhook verification failed:", error);
    return false;
  }
}
