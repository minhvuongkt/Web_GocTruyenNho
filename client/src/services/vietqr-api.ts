/**
 * VietQR API Service
 * This service integrates with the VietQR.io API to generate QR codes for bank transfers
 * Documentation: https://vietqr.io/portal/portalapi
 */

interface VietQRParams {
  accountNo: string;
  accountName: string;
  acqId: string;
  amount: number;
  addInfo?: string;
  template?: string;
}

interface VietQRResponse {
  code: number;
  desc: string;
  data?: {
    qrCode?: string;
    qrDataURL?: string;
  };
}

/**
 * Generate a VietQR code using the VietQR.io API
 * @param params Parameters for creating the QR code
 * @returns QR code data
 */
export async function generateVietQR(params: VietQRParams): Promise<string> {
  try {
    // First fetch VietQR credentials from the server
    const configResponse = await fetch('/api/payment-settings/vietqr-config');
    if (!configResponse.ok) {
      throw new Error('Không thể lấy thông tin cấu hình VietQR');
    }
    
    const config = await configResponse.json();
    
    // Check if VietQR is properly configured on the server
    if (!config.clientId || !config.apiKey) {
      throw new Error('Chưa cấu hình VietQR trên server');
    }

    const response = await fetch('https://api.vietqr.io/v2/generate', {
      method: 'POST',
      headers: {
        'x-client-id': config.clientId,
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountNo: params.accountNo,
        accountName: params.accountName,
        acqId: params.acqId,
        addInfo: params.addInfo || '',
        amount: params.amount.toString(),
        template: params.template || 'compact'
      })
    });

    if (!response.ok) {
      throw new Error(`Lỗi API VietQR: ${response.status} ${response.statusText}`);
    }

    const result: VietQRResponse = await response.json();

    if (result.code !== 200) {
      throw new Error(`Lỗi API VietQR: ${result.desc}`);
    }

    return result.data?.qrDataURL || '';
  } catch (error) {
    console.error('Không thể tạo mã QR VietQR:', error);
    throw error;
  }
}

/**
 * Function to convert an acquisition ID (bank bin) to the acqId format expected by VietQR
 * For example: "VCB" -> "970436"
 * @param bankId The bank identifier
 * @returns The acquisition ID for the bank
 */
export function getBankAcqId(bankId: string): string {
  // Using common mapping for Vietnamese banks
  const bankMapping: Record<string, string> = {
    VCB: '970436', // Vietcombank
    TCB: '970407', // Techcombank
    MB: '970422',  // MB Bank
    VIB: '970441', // VIB
    VPB: '970432', // VPBank
    ACB: '970416', // ACB
    TPB: '970423', // TPBank
    BIDV: '970418', // BIDV
    DAB: '970406', // DongA Bank
    STB: '970403', // Sacombank
    VTB: '970433', // VietinBank
    AGRI: '970405', // Agribank
    OCEN: '970414', // OceanBank
    SCB: '970429', // SCB
    SHB: '970443', // SHB
    ABB: '970425', // ABBank
    MSB: '970426', // MSB
    CAKE: '546034', // CAKE by VPBank
    TIMO: '963388', // Timo
    MOMO: '577689', // Ví MoMo
    ZALO: '577689', // ZaloPay
    VNPT: '971005'  // ViettelPay
  };

  return bankMapping[bankId] || bankId;
}