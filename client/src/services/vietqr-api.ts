/**
 * Generate a VietQR URL with the specified parameters
 * 
 * @param bankId Bank ID (ACB, MBBANK, etc)
 * @param accountNumber Account number
 * @param amount Amount to transfer
 * @param message Transfer message/content
 * @param template QR template type
 * @returns URL for the VietQR image
 */
export function generateVietQR(
  bankId: string,
  accountNumber: string,
  amount: number,
  message: string,
  template: 'compact' | 'compact2' | 'qr_only' = 'compact2'
): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://img.vietqr.io/image/${bankId}-${accountNumber}-${template}.jpg?amount=${amount}&addInfo=${encodedMessage}`;
}

/**
 * Get bank acquisition ID based on bank code
 * 
 * @param bankCode Bank code
 * @returns Acquisition ID for the bank
 */
export function getBankAcqId(bankCode: string): string {
  const bankAcqIds: Record<string, string> = {
    'MBBANK': '970422',
    'VIETCOMBANK': '970436',
    'VIETINBANK': '970415',
    'BIDV': '970418',
    'TECHCOMBANK': '970407',
    'ACB': '970416',
    'VPBANK': '970432',
    'SACOMBANK': '970403',
    'AGRIBANK': '970405',
    'TPBANK': '970423',
    'OCB': '970448',
    'MSB': '970426',
    'HDBANK': '970437',
    'VIB': '970441',
    'SEABANK': '970440',
    'LPB': '970449',
    'SCB': '970429',
    'ABBANK': '970425',
    'EXIMBANK': '970431',
    'SHBANK': '970443',
    'BAOVIETBANK': '970438',
    'NAMABANK': '970428',
    'PVBANK': '970412',
    'SAIGONBANK': '970400',
    'KIENLONGBANK': '970452',
    'BACABANK': '970409',
    'VIETABANK': '970427',
  };
  
  return bankAcqIds[bankCode] || '970422'; // Default to MB Bank if not found
}