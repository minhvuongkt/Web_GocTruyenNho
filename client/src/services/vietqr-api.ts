/**
 * VietQR API Integration
 * This service handles API calls to VietQR for generating payment QR codes
 * See: https://vietqr.io/en/developer-docs
 */

import { apiRequest } from "@/lib/queryClient";

// Bank ID mapping to VietQR acquirer ID
const BANK_ID_MAPPING: Record<string, string> = {
  'MB': 'BMBVNVX', // MB bank
  'VCB': 'BFTVVNVX', // Vietcombank
  'TCB': 'SHBVVNVX', // Techcombank
  'VPB': 'VPBKVNVX', // VPBank
  'VIB': 'VIBVVNVX', // VIB
  'ACB': 'ASCBVNVX', // ACB
  'TPB': 'TPBVVNVX', // TPBank
};

// Default bank if not specified
const DEFAULT_BANK = 'MB';

interface VietQRParams {
  accountNo: string;     // Account number
  accountName: string;   // Account holder name
  acqId: string;         // Bank acquirer ID in VietQR format
  amount: number;        // Payment amount
  addInfo?: string;      // Additional payment info (transaction reference, etc)
  template?: string;     // QR code template
}

/**
 * Convert a simple bank code to VietQR acquirer ID format
 */
export function getBankAcqId(bankId: string): string {
  // If the bank ID already looks like an acquirer ID, return as is
  if (bankId.length > 5) return bankId;
  
  // Convert to uppercase and lookup in mapping
  const upperBankId = bankId.toUpperCase();
  return BANK_ID_MAPPING[upperBankId] || BANK_ID_MAPPING[DEFAULT_BANK];
}

/**
 * Generate a VietQR payment QR code
 * @param params QR code parameters
 * @returns URL to the generated QR image
 */
export async function generateVietQR(params: VietQRParams): Promise<string> {
  try {
    // First, get API credentials from our backend
    const configResponse = await apiRequest('GET', '/api/payment-settings/vietqr-config');
    const { clientId, apiKey } = await configResponse.json();
    
    if (!clientId || !apiKey) {
      throw new Error('Missing VietQR API credentials');
    }

    // API endpoint for QR code generation
    const apiUrl = 'https://api.vietqr.io/v2/generate';
    
    // Prepare request data
    const requestData = {
      clientId,
      apiKey,
      accountNo: params.accountNo,
      accountName: params.accountName,
      acqId: params.acqId,
      amount: params.amount,
      addInfo: params.addInfo || '',
      format: 'text',
      template: params.template || 'compact2'
    };
    
    // Make API request to VietQR
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('VietQR API error:', data);
      throw new Error(`VietQR API error: ${data.message || 'Unknown error'}`);
    }
    
    if (!data.data?.qrDataURL) {
      throw new Error('No QR data received from VietQR API');
    }
    
    return data.data.qrDataURL;
  } catch (error) {
    console.error('Error generating VietQR code:', error);
    throw error;
  }
}