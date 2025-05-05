// Xử lý nội dung truyện chữ (novel) với tuỳ chọn định dạng
import { cleanHTML } from './document-processor';

// Cấu hình mặc định cho font và size
export const DEFAULT_FONT = 'merriweather';
export const DEFAULT_SIZE = 'large';

// Các font được hỗ trợ
export const SUPPORTED_FONTS = [
  'serif',
  'monospace',
  'sans',
  'merriweather',
  'roboto',
  'noto',
  'source'
];

// Các kích thước được hỗ trợ
export const SUPPORTED_SIZES = [
  'small',
  'normal',
  'large',
  'huge'
];

/**
 * Cấu hình định dạng cho nội dung truyện
 */
export interface NovelFormatConfig {
  font?: string;  // Font chữ mặc định
  size?: string;  // Kích thước chữ mặc định
  preserveHtml?: boolean; // Giữ nguyên HTML (true) hoặc chuyển đổi sang chuỗi (false)
  autoClean?: boolean; // Tự động làm sạch HTML
}

/**
 * Xử lý nội dung truyện chữ trước khi lưu vào cơ sở dữ liệu
 * @param content Nội dung HTML của truyện
 * @param config Cấu hình định dạng tùy chọn
 * @returns Nội dung đã được xử lý
 */
export function processNovelContent(
  content: string,
  config: NovelFormatConfig = {}
): string {
  // Thiết lập cấu hình mặc định
  const font = config.font || DEFAULT_FONT;
  const size = config.size || DEFAULT_SIZE;
  const preserveHtml = config.preserveHtml !== undefined ? config.preserveHtml : true;
  const autoClean = config.autoClean !== undefined ? config.autoClean : true;

  // Kiểm tra nếu không có nội dung hoặc không phải chuỗi
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Nếu không cần giữ HTML
  if (!preserveHtml) {
    // Chuyển HTML thành văn bản thuần túy
    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent;
  }

  // Tự động làm sạch HTML nếu được bật
  let processedContent = content;
  
  console.log('Processing novel content with options:', {
    font, size, autoClean, preserveHtml,
    contentLength: content.length
  });
  
  // Đảm bảo định dạng font và size đúng
  if (autoClean) {
    processedContent = cleanHTML(content);
    console.log('Novel content cleaned, new length:', processedContent.length);
    
    // Log mẫu của nội dung đã được xử lý
    const sampleLength = Math.min(200, processedContent.length);
    console.log('Processed content sample:', processedContent.substring(0, sampleLength));
  }

  // Đảm bảo các thẻ đều có lớp font và size
  if (!hasProperFormatting(processedContent)) {
    console.log('Adding font and size classes to content...');
    
    // Thêm font và size vào các phần tử không có
    processedContent = processedContent
      .replace(/<p(?![^>]*class=["'][^"']*ql-font)/g, `<p class="ql-font-${font} ql-size-${size}"`)
      .replace(/<span(?![^>]*class=["'][^"']*ql-font)/g, `<span class="ql-font-${font} ql-size-${size}"`)
      .replace(/<div(?![^>]*class=["'][^"']*ql-font)/g, `<div class="ql-font-${font} ql-size-${size}"`);
  }

  return processedContent;
}

/**
 * Xử lý nội dung truyện từ file tải lên hoặc từ editor
 * @param htmlContent Nội dung HTML cần xử lý
 * @param sourceType Nguồn của nội dung (upload hoặc editor)
 * @param config Cấu hình định dạng
 * @returns Nội dung đã được xử lý
 */
export function processNovelContentFromSource(
  htmlContent: string,
  sourceType: 'upload' | 'editor',
  config: NovelFormatConfig = {}
): string {
  // Cấu hình xử lý dựa trên nguồn
  let processingConfig: NovelFormatConfig = { ...config };

  if (sourceType === 'upload') {
    // Đối với file tải lên, luôn làm sạch HTML
    processingConfig.autoClean = true;
  } else {
    // Đối với nội dung từ editor, kiểm tra xem cần làm sạch không
    processingConfig.autoClean = config.autoClean !== undefined ? config.autoClean : true;
  }

  return processNovelContent(htmlContent, processingConfig);
}

/**
 * Kiểm tra nội dung HTML có chứa các tag font và size hay không
 * @param htmlContent Nội dung HTML cần kiểm tra
 * @returns Kết quả kiểm tra (true nếu có định dạng, false nếu không)
 */
export function hasProperFormatting(htmlContent: string): boolean {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return false;
  }

  // Kiểm tra xem có class ql-font và ql-size không
  const hasFontClass = htmlContent.includes('ql-font-');
  const hasSizeClass = htmlContent.includes('ql-size-');

  return hasFontClass && hasSizeClass;
}