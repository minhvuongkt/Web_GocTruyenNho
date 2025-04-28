/**
 * VietQR Code Generator
 * This utility helps generate QR codes for Vietnamese bank transfers
 * It follows the VietQR standard: https://vietqr.io/
 */

interface QRCodeParams {
  bankNumber: string;
  amount: number;
  message?: string;
}

/**
 * Generate VietQR code content for bank transfers
 * @param params QR code parameters
 * @returns QR code content string
 */
export function generateQRCode(params: QRCodeParams): string {
  const { bankNumber, amount, message = "" } = params;
  
  // Format according to VietQR standard
  // This is a simplified version - in production you'd want to use a proper VietQR generator
  // Format: Version|Application|Service|Bank Number|Amount|Message
  const qrContent = [
    "000201", // QR Version
    "010211", // Application type - static QR
    "2670", // Service code for VietQR
    "0006", // Bank code prefix
    bankNumber, // Bank account number
    amount.toString(), // Amount (VND)
    message, // Message/content
  ].join("|");
  
  return qrContent;
}

/**
 * Generate a test QR code for demo purposes when no real VietQR API is available
 * @param params QR code parameters
 * @returns Dummy QR code content
 */
export function generateTestQRCode(params: QRCodeParams): string {
  const { bankNumber, amount, message = "" } = params;
  
  // This creates a simple string that can be used with a QR code library
  // In a real application, you would use the VietQR API
  return `VIETQRTEST|${bankNumber}|${amount}|${message}`;
}