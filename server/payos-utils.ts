/**
 * Utility functions for handling payments through PayOS
 */

import PayOS from "@payos/node";
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
 * Create a payment link via PayOS API using official SDK
 * 
 * @param config PayOS API configuration
 * @param paymentData Payment data including amount and description
 * @returns Payment link response
 */
export async function createPayOSPaymentLink(
  config: PayOSConfig,
  paymentData: PayOSPaymentData
) {
  try {
    const { clientId, apiKey, checksumKey } = config;
    const { amount, description, orderCode, returnUrl, cancelUrl } = paymentData;

    // Initialize PayOS SDK
    const payOS = new PayOS(clientId, apiKey, checksumKey);
    console.log("Initializing PayOS with:", { clientId, apiKey: apiKey.substring(0, 5) + "..." });

    // Create payment link request body
    const requestBody = {
      orderCode: Number(orderCode), // Convert to number since PayOS SDK expects number
      amount,
      description,
      cancelUrl,
      returnUrl,
      items: [
        {
          name: "Nạp tiền tài khoản",
          quantity: 1,
          price: amount
        }
      ]
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
  orderCode: string
) {
  try {
    const { clientId, apiKey, checksumKey } = config;
    
    // Initialize PayOS SDK
    const payOS = new PayOS(clientId, apiKey, checksumKey);
    
    // Use SDK to get payment - fix typo in method name
    const response = await payOS.getPaymentLinkInformation(Number(orderCode));
    console.log("PayOS Status Response:", response);
    
    return response;
  } catch (error) {
    console.error("PayOS payment status check failed:", error);
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
  webhookHeader: string
) {
  try {
    const { clientId, apiKey, checksumKey } = config;
    
    // Initialize PayOS SDK
    const payOS = new PayOS(clientId, apiKey, checksumKey);
    
    // Use SDK for webhook verification
    return payOS.verifyPaymentWebhookData(bodyData, webhookHeader);
  } catch (error) {
    console.error("PayOS webhook verification failed:", error);
    return false;
  }
}