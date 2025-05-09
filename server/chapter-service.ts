// Service xử lý các thao tác với chapter
import { db } from './db';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { processNovelContent, hasProperFormatting, DEFAULT_FONT, DEFAULT_SIZE } from './novel-content-processor';
import { cleanHTML } from './document-processor';

// Interface định nghĩa các tham số cập nhật chapter
export interface UpdateChapterParams {
  id: number;
  contentId?: number;
  number?: number;
  title?: string | null;
  releaseDate?: Date | string | null;
  isLocked?: boolean;
  unlockPrice?: number | null;
  views?: number;
  content?: string;
  fontFamily?: string; // Font family cho nội dung novel
  fontSize?: string;   // Font size cho nội dung novel
}

/**
 * Lấy thông tin của một chapter theo ID
 * @param chapterId ID của chapter cần lấy
 * @param options Tùy chọn lấy dữ liệu
 * @returns Thông tin chapter và nội dung của nó
 */
export async function getChapterById(
  chapterId: number, 
  options: { 
    includeContent?: boolean; 
    contentColumnOnly?: boolean;
    checkContentLength?: boolean;
  } = {}
) {
  try {
    // Mặc định cho các tùy chọn
    const {
      includeContent = true,       // Có lấy nội dung không
      contentColumnOnly = false,   // Chỉ lấy cột content thay vì toàn bộ record
      checkContentLength = false   // Có kiểm tra và trả về độ dài nội dung không
    } = options;

    // Lấy thông tin chapter
    const [chapter] = await db
      .select()
      .from(schema.chapters)
      .where(eq(schema.chapters.id, chapterId));

    if (!chapter) {
      return null;
    }

    // Lấy thông tin content để biết loại truyện
    const [contentInfo] = await db
      .select()
      .from(schema.content)
      .where(eq(schema.content.id, chapter.contentId));

    // Kết quả trả về
    const result: {
      chapter: typeof chapter;
      contentType: string | undefined;
      contents?: any[];
      content?: string;
      contentLength?: number;
    } = {
      chapter,
      contentType: contentInfo?.type
    };

    // Luôn lấy nội dung chapter - đảm bảo cả novel và manga đều có nội dung
    try {
      // Lấy nội dung chap, thêm thông tin độ dài
      const [contentData] = await db
        .select({
          id: schema.chapterContent.id,
          content: schema.chapterContent.content,
          contentLength: sql`length(${schema.chapterContent.content})`
        })
        .from(schema.chapterContent)
        .where(eq(schema.chapterContent.chapterId, chapterId));
      
      if (contentData) {
        // Lưu cả vào contents (cho khả năng tương thích ngược) và content (cho API mới)
        result.content = contentData.content || '';
        result.contentLength = Number(contentData.contentLength || 0);
        result.contents = [contentData];
        
        console.log(`Loaded chapter ${chapterId} content successfully with length: ${result.contentLength}`);
      } else {
        // Nếu không có dữ liệu, đặt giá trị mặc định
        result.content = '';
        result.contentLength = 0;
        result.contents = [];
        
        console.log(`No content found for chapter ${chapterId}. Setting empty content.`);
      }
    } catch (error) {
      // Nếu có lỗi khi truy vấn, vẫn tiếp tục nhưng ghi log và đặt giá trị trống
      console.error(`Error fetching content for chapter ${chapterId}:`, error);
      result.content = '';
      result.contentLength = 0;
      result.contents = [];
    }

    return result;
  } catch (error) {
    console.error("Error getting chapter by ID:", error);
    throw error;
  }
}

/**
 * Lấy chapter theo content ID và số thứ tự chapter
 * @param contentId ID của content
 * @param chapterNumber Số thứ tự chapter
 * @param options Tùy chọn lấy dữ liệu
 * @returns Thông tin chapter và nội dung
 */
export async function getChapterByContentAndNumber(
  contentId: number, 
  chapterNumber: number,
  options: { 
    includeContent?: boolean; 
    contentColumnOnly?: boolean;
    checkContentLength?: boolean;
  } = {}
) {
  try {
    // Lấy thông tin chapter
    const [chapter] = await db
      .select()
      .from(schema.chapters)
      .where(
        and(
          eq(schema.chapters.contentId, contentId),
          eq(schema.chapters.number, chapterNumber)
        )
      );

    if (!chapter) {
      return null;
    }

    // Gọi lại getChapterById với tùy chọn đã cung cấp
    return getChapterById(chapter.id, options);
  } catch (error) {
    console.error("Error getting chapter by content and number:", error);
    throw error;
  }
}

/**
 * Cập nhật thông tin và nội dung của chapter
 * @param params Tham số cập nhật
 * @returns Chapter đã cập nhật
 */
export async function updateChapter(params: UpdateChapterParams) {
  try {
    const { id, content, ...chapterData } = params;

    // Xử lý trường releaseDate
    let finalReleaseDate = chapterData.releaseDate;
    if (chapterData.releaseDate !== undefined) {
      if (typeof chapterData.releaseDate === 'string') {
        if (chapterData.releaseDate.trim() === '') {
          // Chuỗi rỗng = null
          finalReleaseDate = null;
        } else {
          try {
            // Chuyển đổi chuỗi thành đối tượng Date
            const testDate = new Date(chapterData.releaseDate);
            if (!isNaN(testDate.getTime())) {
              finalReleaseDate = testDate;
            } else {
              finalReleaseDate = null;
            }
          } catch (e) {
            console.error("Error parsing date:", e);
            finalReleaseDate = null;
          }
        }
      } else if (chapterData.releaseDate instanceof Date) {
        finalReleaseDate = chapterData.releaseDate;
      } else {
        finalReleaseDate = null;
      }
    }

    // Lấy thông tin chapter hiện tại
    const chapterInfo = await getChapterById(id);
    if (!chapterInfo) {
      throw new Error(`Chapter with ID ${id} not found`);
    }

    // Cập nhật thông tin chapter
    const updateData: any = { ...chapterData };
    if (finalReleaseDate !== undefined) {
      // Nếu null, không cập nhật trường này để tránh lỗi type
      if (finalReleaseDate === null) {
        delete updateData.releaseDate;
      } else {
        updateData.releaseDate = finalReleaseDate as Date;
      }
    }

    // Loại bỏ các trường undefined để tránh lỗi type
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    console.log(`Updating chapter ${id} with data:`, updateData);
    
    const [updatedChapter] = await db
      .update(schema.chapters)
      .set(updateData)
      .where(eq(schema.chapters.id, id))
      .returning();

    // Nếu có cập nhật nội dung
    if (content !== undefined) {
      // Kiểm tra loại truyện để xử lý nội dung phù hợp
      const contentType = chapterInfo.contentType;
      let processedContent = content;

      // Xử lý nội dung dựa trên loại truyện
      if (contentType === 'novel') {
        console.log('Processing novel content for chapter', id, 'content length:', content.length);
        
        // Trích xuất thông tin font và size từ dữ liệu đầu vào (nếu có)
        let font = DEFAULT_FONT;
        let size = DEFAULT_SIZE;
        let forceFormat = false;
        
        if (req.body && req.body.fontSize) {
          size = req.body.fontSize;
          forceFormat = true;
          console.log(`Using user-selected font size: ${size}`);
        }
        
        if (req.body && req.body.fontFamily) {
          font = req.body.fontFamily;
          forceFormat = true;
          console.log(`Using user-selected font family: ${font}`);
        }
        
        // Sử dụng processNovelContent với font và size tùy chỉnh
        processedContent = processNovelContent(content, {
          font: font,
          size: size,
          autoClean: false, // Không làm sạch HTML từ editor
          preserveHtml: true, 
          forceFormat: forceFormat // Áp dụng font/size mới nếu người dùng đã chọn
        });
        
        // Log sample của nội dung đã xử lý để debug
        const sampleLength = Math.min(200, processedContent.length);
        console.log('Processed content sample:', processedContent.substring(0, sampleLength));
      }

      // Xóa nội dung cũ
      if (chapterInfo.contents && chapterInfo.contents.length > 0) {
        console.log(`Deleting ${chapterInfo.contents.length} existing chapter content items`);
        
        for (const item of chapterInfo.contents) {
          await db
            .delete(schema.chapterContent)
            .where(eq(schema.chapterContent.id, item.id));
        }
      }

      // Thêm nội dung mới
      console.log('Saving new chapter content with length:', processedContent.length);
      console.log('Content sample:', processedContent.substring(0, Math.min(100, processedContent.length)));
      
      try {
        // Sử dụng raw SQL để insert nội dung chapter với độ dài không giới hạn
        // để tránh lỗi khi nội dung quá lớn
        const [newContent] = await db
          .insert(schema.chapterContent)
          .values({
            chapterId: id,
            content: processedContent
          })
          .returning({
            id: schema.chapterContent.id,
            chapterId: schema.chapterContent.chapterId,
            contentLength: sql`length(${schema.chapterContent.content})`
          });

        console.log('Chapter content saved successfully:', {
          id: newContent?.id, 
          chapterId: id,
          contentLength: newContent?.contentLength || 0
        });
      } catch (error) {
        console.error('Error inserting chapter content into database:', error);
        throw new Error(`Failed to save chapter content to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return updatedChapter;
  } catch (error) {
    console.error("Error updating chapter:", error);
    throw error;
  }
}

/**
 * Tạo một chapter mới
 * @param chapterData Dữ liệu chapter mới
 * @param content Nội dung chapter
 * @returns Chapter mới được tạo
 */
export async function createChapter(
  chapterData: Omit<schema.InsertChapter, 'id'>,
  content?: string
) {
  try {
    // Kiểm tra truyện tồn tại
    const [contentInfo] = await db
      .select()
      .from(schema.content)
      .where(eq(schema.content.id, chapterData.contentId));

    if (!contentInfo) {
      throw new Error(`Content with ID ${chapterData.contentId} not found`);
    }

    console.log('Creating new chapter for content', chapterData.contentId);
    
    // Tạo chapter mới
    const [newChapter] = await db
      .insert(schema.chapters)
      .values(chapterData)
      .returning();

    // Nếu có nội dung, lưu vào bảng chapter_content
    if (content && newChapter) {
      let processedContent = content;

      // Xử lý nội dung dựa trên loại truyện
      if (contentInfo.type === 'novel') {
        console.log('Processing novel content for new chapter, content length:', content.length);
        
        // Kiểm tra xem nội dung đã có định dạng font/size chưa
        if (!hasProperFormatting(content)) {
          console.log('Content does not have proper formatting, processing novel content...');
          // Sử dụng processNovelContent thay vì cleanHTML trực tiếp
          processedContent = processNovelContent(content, {
            font: DEFAULT_FONT,
            size: DEFAULT_SIZE,
            autoClean: true,
            preserveHtml: true
          });
          console.log('Processed content length:', processedContent.length);
        } else {
          console.log('Content already has proper formatting');
          // Giữ lại định dạng hiện có nhưng vẫn đảm bảo nội dung được xử lý đúng cách
          processedContent = processNovelContent(content, {
            autoClean: false,
            preserveHtml: true
          });
        }
      }

      // Lưu nội dung mới
      console.log('Saving new chapter content with length:', processedContent.length);
      console.log('Content sample:', processedContent.substring(0, Math.min(100, processedContent.length)));
      
      try {
        // Sử dụng raw SQL để insert nội dung chapter với độ dài không giới hạn
        // để tránh lỗi khi nội dung quá lớn
        const [newContent] = await db
          .insert(schema.chapterContent)
          .values({
            chapterId: newChapter.id,
            content: processedContent
          })
          .returning({
            id: schema.chapterContent.id,
            chapterId: schema.chapterContent.chapterId,
            contentLength: sql`length(${schema.chapterContent.content})`
          });

        console.log('Chapter content saved successfully:', {
          id: newContent?.id, 
          chapterId: newChapter.id,
          contentLength: newContent?.contentLength || 0
        });
      } catch (error) {
        console.error('Error inserting chapter content into database:', error);
        throw new Error(`Failed to save chapter content to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return newChapter;
  } catch (error) {
    console.error("Error creating chapter:", error);
    throw error;
  }
}

/**
 * Xóa một chapter
 * @param chapterId ID của chapter cần xóa
 * @returns true nếu xóa thành công
 */
export async function deleteChapter(chapterId: number) {
  try {
    // Lấy thông tin chapter
    const chapterInfo = await getChapterById(chapterId);
    if (!chapterInfo) {
      throw new Error(`Chapter with ID ${chapterId} not found`);
    }

    // Xóa nội dung chapter trước - dùng cách mới để tránh lỗi
    await db
      .delete(schema.chapterContent)
      .where(eq(schema.chapterContent.chapterId, chapterId));
      
    console.log(`Deleted content for chapter ID: ${chapterId}`);

    // Xóa chapter
    await db
      .delete(schema.chapters)
      .where(eq(schema.chapters.id, chapterId));

    return true;
  } catch (error) {
    console.error("Error deleting chapter:", error);
    throw error;
  }
}