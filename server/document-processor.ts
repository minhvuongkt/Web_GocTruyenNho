// Xử lý tài liệu văn bản (TXT, DOC, DOCX, PDF) và chuyển đổi sang HTML
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import { Buffer } from 'buffer';

// Các thư viện được sử dụng
let mammoth: any;
let pdf: any;

// Tạo một thư mục tạm thời nếu cần
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const tempDir = os.tmpdir();

/**
 * Chuyển đổi tệp DOCX sang HTML
 * @param buffer Buffer tệp DOCX
 * @returns Nội dung HTML
 */
export async function docxToHtml(buffer: Buffer): Promise<string> {
  try {
    if (!mammoth) {
      mammoth = (await import('mammoth')).default;
    }

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
      ]
    });

    // Log cảnh báo
    if (result.messages.length > 0) {
      console.log("Mammoth warnings:", result.messages);
    }

    // Định dạng lại nội dung HTML
    let content = result.value;

    // Đảm bảo tất cả các đoạn văn có font mặc định
    content = content.replace(/<p>/g, '<p class="ql-font-arial">');

    // Chuyển đổi định dạng nếu cần
    content = content.replace(/<b>/g, '<strong>').replace(/<\/b>/g, '</strong>');
    content = content.replace(/<i>/g, '<em>').replace(/<\/i>/g, '</em>');

    return content;
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
    // DOC format is handled the same way as DOCX
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
    
    // Tách thành các dòng và bao mỗi dòng trong thẻ p
    const paragraphs = text
      .split(/\r?\n/)
      .filter(line => line.trim().length > 0)
      .map(line => `<p class="ql-font-arial">${line}</p>`)
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
    // Lazy load pdf.js for PDF processing
    if (!pdf) {
      pdf = await import('pdfjs-dist');
    }
    
    // Lưu tạm tệp PDF
    const tempPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
    await writeFile(tempPath, buffer);
    
    // Tạo trình tải và đọc tài liệu
    const data = await readFile(tempPath);
    
    // Xử lý tài liệu PDF (dựa trên pdf.js)
    const document = await pdf.getDocument({ data }).promise;
    
    let content = '';
    
    // Lặp qua từng trang và trích xuất văn bản
    for (let i = 1; i <= document.numPages; i++) {
      const page = await document.getPage(i);
      const textContent = await page.getTextContent();
      
      // Xử lý từng dòng văn bản và bao quanh trong thẻ p
      let lastY = null;
      let paragraphText = '';
      
      for (const item of textContent.items) {
        const text = item.str;
        
        // PDF không có khái niệm đoạn văn, vì vậy chúng ta phải phát hiện đoạn văn dựa trên tọa độ Y
        if (lastY === null || item.transform[5] !== lastY) {
          if (paragraphText.trim().length > 0) {
            content += `<p class="ql-font-arial">${paragraphText}</p>`;
            paragraphText = '';
          }
          lastY = item.transform[5];
        }
        
        paragraphText += text + ' ';
      }
      
      // Thêm đoạn văn cuối cùng
      if (paragraphText.trim().length > 0) {
        content += `<p class="ql-font-arial">${paragraphText}</p>`;
      }
      
      // Thêm ngắt trang nếu không phải trang cuối
      if (i < document.numPages) {
        content += '<p class="ql-font-arial"><br></p>';
      }
    }
    
    // Xóa tệp tạm thời
    await unlink(tempPath);
    
    return content;
  } catch (error) {
    console.error("Error converting PDF to HTML:", error);
    throw new Error("Failed to convert PDF to HTML");
  }
}

/**
 * Xử lý tài liệu và chuyển đổi thành HTML
 * @param buffer Buffer của tệp
 * @param mimeType Loại MIME
 * @returns Nội dung HTML
 */
export async function processDocument(buffer: Buffer, mimeType: string): Promise<string> {
  switch (mimeType) {
    case 'text/plain':
      return await txtToHtml(buffer);
    case 'application/msword':
      return await docToHtml(buffer);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return await docxToHtml(buffer);
    case 'application/pdf':
      return await pdfToHtml(buffer);
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}