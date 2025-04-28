/**
 * Utility functions for handling payments through VietQR
 */

type VietQRConfig = {
  bankId: string;
  accountNumber: string;
  accountName: string;
  template?: 'compact' | 'compact2' | 'qr_only';
};

type VietQRPaymentData = VietQRConfig & {
  amount: number;
  message: string;
};

/**
 * Generates a VietQR URL for bank transfers
 * 
 * @param data Payment data including bank info and amount
 * @returns URL for QR code generation
 */
export function generateVietQRURL(data: VietQRPaymentData): string {
  // Construct the URL with parameters
  const baseUrl = 'https://img.vietqr.io/image';
  const params = new URLSearchParams();
  
  // Required parameters
  params.append('addInfo', data.message);
  params.append('amount', data.amount.toString());
  params.append('accountNo', data.accountNumber);
  params.append('accountName', data.accountName);
  params.append('bankId', data.bankId);
  
  // Optional parameters
  if (data.template) {
    params.append('template', data.template);
  }
  
  return `${baseUrl}/${data.bankId}/${data.accountNumber}/${data.template || 'compact'}?${params.toString()}`;
}