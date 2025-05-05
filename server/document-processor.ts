// Xử lý tài liệu văn bản (TXT, DOC, DOCX, PDF) và chuyển đổi sang HTML
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import { Buffer } from 'buffer';
import { createHash } from 'crypto';

// Tạo một thư mục tạm thời nếu cần
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const tempDir = os.tmpdir();

// Cấu hình mặc định cho font và size
const DEFAULT_FONT = 'merriweather'; // Sử dụng font được chọn làm mặc định
const DEFAULT_SIZE = 'large'; // Sử dụng kích thước phù hợp làm mặc định

/**
 * Tạo thẻ HTML với các lớp CSS phù hợp
 * @param content Nội dung văn bản
 * @param font Font chữ
 * @param size Kích thước chữ
 * @returns Chuỗi HTML với định dạng phù hợp
 */
function formatHTML(content: string, font = DEFAULT_FONT, size = DEFAULT_SIZE): string {
  if (!content.trim()) return '';
  
  // Đảm bảo rằng nếu không có nội dung, trả về chuỗi rỗng để tránh tạo các thẻ rỗng
  return `<p class="ql-font-${font} ql-size-${size}"><span class="ql-font-${font} ql-size-${size}">${content}</span></p>`;
}

/**
 * Làm sạch HTML đầu vào để tránh các vấn đề về định dạng
 * @param html Chuỗi HTML đầu vào
 * @returns Chuỗi HTML đã được làm sạch
 */
export function cleanHTML(html: string): string {
  if (!html) return '';
  
  console.log("Original HTML length:", html.length);
  
  let cleaned = html;
  
  // Loại bỏ các tag script và style
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Loại bỏ các thẻ span và p lồng nhau không cần thiết
  cleaned = cleaned.replace(/<p><span>(.*?)<\/span><\/p>/g, '<p>$1</p>');
  
  // Thay thế các đoạn trống bằng đoạn có khoảng trắng không phá vỡ
  cleaned = cleaned.replace(/<p><\/p>/g, '<p>&nbsp;</p>');
  
  // Đảm bảo các thẻ p có class font và size đúng
  // Thêm classes vào các thẻ p nếu chúng không có
  cleaned = cleaned.replace(/<p(?![^>]*class=["'][^"']*ql-font)/g, 
    `<p class="ql-font-${DEFAULT_FONT} ql-size-${DEFAULT_SIZE}"`);
    
  // Thêm các thuộc tính font và size vào các thẻ span nếu chúng không có
  cleaned = cleaned.replace(/<span(?![^>]*class=["'][^"']*ql-font)/g, 
    `<span class="ql-font-${DEFAULT_FONT} ql-size-${DEFAULT_SIZE}"`);
  
  // Đảm bảo thẻ div cũng có định dạng
  cleaned = cleaned.replace(/<div(?![^>]*class=["'][^"']*ql-font)/g, 
    `<div class="ql-font-${DEFAULT_FONT} ql-size-${DEFAULT_SIZE}"`);
  
  // Chuẩn hóa các thẻ <br> để đảm bảo tính nhất quán
  cleaned = cleaned.replace(/<br>/g, '<br />');
  
  console.log("Cleaned HTML length:", cleaned.length);
  
  return cleaned;
}

/**
 * Chuyển đổi tệp DOCX sang HTML
 * @param buffer Buffer tệp DOCX
 * @returns Nội dung HTML
 */
export async function docxToHtml(buffer: Buffer): Promise<string> {
  try {
    // Lazy load mammoth
    const mammoth = (await import('mammoth')).default;

    // Cấu hình đặc biệt để giữ lại các đoạn, định dạng chữ đậm, in nghiêng...
    const result = await mammoth.convertToHtml({ buffer }, {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Heading 5'] => h5:fresh",
        "p[style-name='Heading 6'] => h6:fresh",
        "b => strong",
        "i => em",
        "u => u",
        "strike => s",
        "p => p:fresh",
      ],
      includeDefaultStyleMap: true,
    });

    // Log cảnh báo
    if (result.messages.length > 0) {
      console.log("Mammoth warnings:", result.messages);
    }

    // Định dạng lại nội dung HTML
    let content = result.value;

    // Xử lý nội dung để thêm các class font và size phù hợp
    const paragraphs = content
      .replace(/<\/?h[1-6]>/g, (tag) => tag.replace('h', 'p class="ql-font-' + DEFAULT_FONT + ' ql-size-' + DEFAULT_SIZE + '"'))
      .split(/<\/?p[^>]*>/g)
      .filter(text => text.trim())
      .map(text => formatHTML(text))
      .join('');

    // Chuyển đổi các thẻ cơ bản sang định dạng Quill hỗ trợ
    let processedContent = paragraphs
      .replace(/<b>/g, '<strong>')
      .replace(/<\/b>/g, '</strong>')
      .replace(/<i>/g, '<em>')
      .replace(/<\/i>/g, '</em>')
      .replace(/\n/g, '</p><p class="ql-font-' + DEFAULT_FONT + ' ql-size-' + DEFAULT_SIZE + '">');

    // Làm sạch HTML cuối cùng
    return cleanHTML(processedContent);
  } catch (error) {
    console.error("Error converting DOCX to HTML:", error);
    throw new Error("Failed to convert DOCX to HTML");
  }
}

/**
 * Chuyển đổi tệp DOC sang HTML
 * @param buffer Buffer tệp DOC
 * @returns Nội dung HTML
 */
export async function docToHtml(buffer: Buffer): Promise<string> {
  try {
    // DOC format is handled the same way as DOCX in most cases
    return await docxToHtml(buffer);
  } catch (error) {
    console.error("Error converting DOC to HTML:", error);
    throw new Error("Failed to convert DOC to HTML");
  }
}

/**
 * Chuyển đổi tệp TXT sang HTML
 * @param buffer Buffer tệp TXT
 * @returns Nội dung HTML
 */
export async function txtToHtml(buffer: Buffer): Promise<string> {
  try {
    // Chuyển đổi buffer thành chuỗi
    const text = buffer.toString('utf-8');
    
    // Tách thành các dòng và bao mỗi dòng trong thẻ p với đúng class
    const paragraphs = text
      .split(/\r?\n/)
      .filter(line => line.trim().length > 0)
      .map(line => formatHTML(line))
      .join('');
    
    return paragraphs;
  } catch (error) {
    console.error("Error converting TXT to HTML:", error);
    throw new Error("Failed to convert TXT to HTML");
  }
}

/**
 * Chuyển đổi tệp PDF sang HTML
 * @param buffer Buffer tệp PDF
 * @returns Nội dung HTML
 */
export async function pdfToHtml(buffer: Buffer): Promise<string> {
  try {
    // Lazy load pdf.js
    const pdf = await import('pdfjs-dist');
    
    // Lưu tạm tệp PDF
    const tempPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
    await writeFile(tempPath, buffer);
    
    // Tạo trình tải và đọc tài liệu
    const data = await readFile(tempPath);
    
    // Cấu hình môi trường worker để tránh lỗi
    if (typeof window === 'undefined') {
      pdf.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.js');
    }
    
    const document = await pdf.getDocument({ data }).promise;
    
    let paragraphs = [];
    
    // Lặp qua từng trang và trích xuất văn bản
    for (let i = 1; i <= document.numPages; i++) {
      const page = await document.getPage(i);
      const textContent = await page.getTextContent();
      
      // Cải thiện thuật toán phát hiện đoạn văn
      let lastY = null;
      let paragraphText = '';
      let lastItem: any = null;
      
      for (const textItem of textContent.items) {
        // Tránh TypeScript errors bằng cách kiểm tra loại item
        if (!('str' in textItem)) continue;
        
        const item = textItem as any; // Dùng any để tránh type errors
        const text = item.str;
        
        // Phát hiện đoạn văn dựa trên tọa độ Y và khoảng cách giữa các từ
        const currentY = Math.round(item.transform?.[5] || 0);
        
        // Tạo một đoạn văn mới khi có sự thay đổi đáng kể về vị trí Y
        if (lastY === null || Math.abs(currentY - lastY) > 3) {
          if (paragraphText.trim().length > 0) {
            paragraphs.push(formatHTML(paragraphText.trim()));
            paragraphText = '';
          }
          lastY = currentY;
        } else if (lastItem && item.transform?.[4] < lastItem.transform?.[4]) {
          // Nếu vị trí X giảm đáng kể, có thể là dòng mới trong cùng một đoạn
          paragraphText += ' ' + text;
        } else {
          // Thêm khoảng trắng phù hợp giữa các từ
          const spaceWidth = lastItem ? 
            Math.abs((item.transform?.[4] || 0) - ((lastItem.transform?.[4] || 0) + (lastItem.width || 0))) : 0;
          if (spaceWidth > 5) {
            paragraphText += ' ' + text;
          } else {
            paragraphText += text;
          }
        }
        
        lastItem = item;
      }
      
      // Thêm đoạn văn cuối cùng của trang
      if (paragraphText.trim().length > 0) {
        paragraphs.push(formatHTML(paragraphText.trim()));
      }
      
      // Thêm ngắt trang nếu không phải trang cuối
      if (i < document.numPages) {
        paragraphs.push(formatHTML(''));
      }
    }
    
    // Xóa tệp tạm thời
    await unlink(tempPath);
    
    return paragraphs.join('');
  } catch (error) {
    console.error("Error converting PDF to HTML:", error);
    throw new Error("Failed to convert PDF to HTML");
  }
}

/**
 * Xử lý và lưu file ảnh từ Data URL để nhúng vào nội dung HTML
 * @param dataUrl Data URL của ảnh
 * @param uploadDir Thư mục lưu ảnh
 * @returns Đường dẫn URL tới ảnh đã lưu
 */
export async function saveImageFromBase64(dataUrl: string, uploadDir: string = 'public/uploads/content-images'): Promise<string> {
  try {
    // Đảm bảo thư mục tồn tại
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Trích xuất dữ liệu từ Data URL
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid data URL format');
    }
    
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    // Xác định phần mở rộng tệp
    let extension = '.jpg';
    if (mimeType === 'image/png') extension = '.png';
    else if (mimeType === 'image/webp') extension = '.webp';
    else if (mimeType === 'image/gif') extension = '.gif';
    
    // Tạo tên tệp duy nhất
    const timestamp = Date.now();
    const hash = createHash('md5')
      .update(`${timestamp}-${Math.random()}`)
      .digest('hex')
      .substring(0, 8);
    const filename = `${timestamp}-${hash}${extension}`;
    
    // Đường dẫn đầy đủ đến tệp
    const filePath = path.join(uploadDir, filename);
    
    // Lưu tệp
    await writeFile(filePath, buffer);
    
    // Trả về đường dẫn URL tương đối
    return `/uploads/content-images/${filename}`;
  } catch (error) {
    console.error('Error saving image:', error);
    throw new Error('Failed to save image from data URL');
  }
}

/**
 * Xử lý nội dung HTML để chuyển đổi các thẻ img với data URL thành các tệp thực tế
 * @param html Chuỗi HTML đầu vào
 * @returns Chuỗi HTML với các liên kết tệp thực tế
 */
export async function processInlineImages(html: string): Promise<string> {
  try {
    // Regular expression để tìm các Data URL trong thẻ img
    const regex = /<img[^>]*src="(data:image\/[^;]+;base64,[^"]+)"[^>]*>/g;
    let match;
    let processedHtml = html;
    
    type Replacement = {
      original: string;
      replacement: string;
    };
    
    const promises: Promise<void>[] = [];
    const replacements: Replacement[] = [];
    
    // Tìm tất cả các Data URL và xử lý chúng
    while ((match = regex.exec(html)) !== null) {
      const fullImgTag = match[0];
      const dataUrl = match[1];
      
      // Xử lý từng ảnh và theo dõi thẻ gốc và URL mới
      promises.push(
        saveImageFromBase64(dataUrl).then(newSrc => {
          replacements.push({
            original: fullImgTag,
            replacement: fullImgTag.replace(dataUrl, newSrc)
          });
        })
      );
    }
    
    // Đợi tất cả ảnh được xử lý
    await Promise.all(promises);
    
    // Thay thế tất cả các thẻ img với các URL mới
    for (const { original, replacement } of replacements) {
      processedHtml = processedHtml.replace(original, replacement);
    }
    
    return processedHtml;
  } catch (error) {
    console.error('Error processing inline images:', error);
    throw new Error('Failed to process inline images in HTML content');
  }
}

/**
 * Xử lý tài liệu và chuyển đổi thành HTML
 * @param buffer Buffer của tệp
 * @param mimeType Loại MIME
 * @returns Nội dung HTML
 */
export async function processDocument(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    let content = '';
    
    switch (mimeType) {
      case 'text/plain':
        content = await txtToHtml(buffer);
        break;
      case 'application/msword':
        content = await docToHtml(buffer);
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        content = await docxToHtml(buffer);
        break;
      case 'application/pdf':
        content = await pdfToHtml(buffer);
        break;
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
    
    // Làm sạch HTML cuối cùng và đảm bảo định dạng nhất quán
    content = cleanHTML(content);
    
    return content;
  } catch (error) {
    console.error("Error in processDocument:", error);
    throw error;
  }
}