/**
 * Utility functions for handling payments through PayOS
 */

// Using native fetch instead of node-fetch
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
};

/**
 * Create a payment link via PayOS API
 * 
 * @param config PayOS API configuration
 * @param paymentData Payment data including amount and description
 * @returns Payment link response
 */
export async function createPayOSPaymentLink(
  config: PayOSConfig,
  paymentData: PayOSPaymentData
) {
  const { clientId, apiKey, checksumKey, baseUrl } = config;
  const { amount, description, orderCode, returnUrl, cancelUrl } = paymentData;

  // Current time + 15 minutes (in seconds)
  const expiredAt = Math.floor(Date.now() / 1000) + 15 * 60;

  // Create request body
  const requestBody = {
    orderCode,
    amount,
    description,
    buyerName: "User",
    buyerEmail: "user@example.com",
    buyerPhone: "0123456789",
    cancelUrl,
    returnUrl,
    expiredAt,
  };

  // Create checksum
  const dataRaw = JSON.stringify(requestBody);
  const checksum = crypto
    .createHmac("sha256", checksumKey)
    .update(dataRaw)
    .digest("hex");

  // Make API request
  try {
    console.log("PayOS Request:", {
      url: `${baseUrl}/v2/payment-requests`,
      clientId,
      requestBody
    });
    
    const response = await fetch(`${baseUrl}/v2/payment-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-api-key": apiKey,
        "Signature": checksum,
      },
      body: dataRaw,
    });

    const data = await response.json();
    console.log("PayOS Response:", data);
    return data;
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
  orderCode: string
) {
  const { clientId, apiKey, checksumKey, baseUrl } = config;

  try {
    const response = await fetch(`${baseUrl}/v2/payment-requests/${orderCode}`, {
      method: "GET",
      headers: {
        "x-client-id": clientId,
        "x-api-key": apiKey,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("PayOS payment status check failed:", error);
    throw error;
  }
}

/**
 * Verify a PayOS webhook notification
 * 
 * @param config PayOS API configuration
 * @param bodyData Raw body data from webhook
 * @param webhookHeader x-webhook-signature header from PayOS
 * @returns Boolean indicating whether the webhook is valid
 */
export function verifyPayOSWebhook(
  config: PayOSConfig,
  bodyData: string,
  webhookHeader: string
) {
  const { checksumKey } = config;
  
  const checksum = crypto
    .createHmac("sha256", checksumKey)
    .update(bodyData)
    .digest("hex");
  
  return checksum === webhookHeader;
}