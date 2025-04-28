/**
 * VietQR Code Generator
 * This utility helps generate QR codes for Vietnamese bank transfers
 * It follows the VietQR standard: https://vietqr.io/
 */

interface QRCodeParams {
  bankNumber: string;
  amount: number;
  message?: string;
  bankBin?: string;
}

/**
 * Generate VietQR code content for bank transfers
 * @param params QR code parameters
 * @returns QR code content string
 */
export function generateQRCode(params: QRCodeParams): string {
  const { bankNumber, amount, message = "", bankBin = "970436" } = params;
  
  // Format according to EMV QR Code standard required by banking apps
  // See: https://www.emvco.com/emv-technologies/qrcodes/
  const formatAmount = amount.toString().padStart(1, '0');
  
  // Mandatory fields
  const payload = [
    "00", "02", "01", // Payload format indicator and version
    "01", "12", "VRPTMRPTPAYEE", // Merchant account information tag
    "38", "09", bankBin, // Merchant bin (default: MB Bank)
    "01", bankNumber.length.toString().padStart(2, '0'), bankNumber, // Merchant ID
    "52", "04", "QRCT", // Banking category
  ];
  
  // Optional fields
  if (amount > 0) {
    payload.push("54", formatAmount.length.toString().padStart(2, '0'), formatAmount);
  }
  
  if (message) {
    payload.push("62", message.length.toString().padStart(2, '0'), message);
  }
  
  const qrContent = payload.join("");
  
  return qrContent;
}

/**
 * Generate a standardized Napas/VietQR code for banking apps
 * This follows the standard recognized by Vietnamese mobile banking apps
 * @param params QR code parameters
 * @returns Standardized QR code content for banking apps
 */
export function generateBankingQR(params: QRCodeParams): string {
  const { bankNumber, amount, message = "", bankBin = "970436" } = params;
  
  // This is the format that works with most Vietnamese mobile banking apps
  // Format: bankBin|bankNumber|amount|message
  return `${bankBin}|${bankNumber}|${amount}|${message}`;
}