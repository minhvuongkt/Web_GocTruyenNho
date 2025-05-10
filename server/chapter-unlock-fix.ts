// Utilities để sửa lỗi trong việc mở khóa chương
import { Request, Response } from 'express';
import { unlockedChapters } from '@shared/schema';
import { db } from './db';
import { eq, and } from 'drizzle-orm';

/**
 * Kiểm tra xem một chương đã được mở khóa bởi người dùng hay chưa
 * 
 * @param userId ID của người dùng
 * @param chapterId ID của chương
 * @returns true nếu đã mở khóa, false nếu chưa
 */
export async function checkChapterUnlocked(userId: number, chapterId: number): Promise<boolean> {
  try {
    const [unlocked] = await db
      .select()
      .from(unlockedChapters)
      .where(
        and(
          eq(unlockedChapters.userId, userId),
          eq(unlockedChapters.chapterId, chapterId),
        ),
      );
      
    console.log(`Unlock check for user ${userId}, chapter ${chapterId}: ${unlocked ? 'UNLOCKED' : 'LOCKED'}`);
    return !!unlocked;
  } catch (error) {
    console.error(`Error checking unlock status for chapter ${chapterId}:`, error);
    return false;
  }
}

/**
 * Middleware để xử lý việc kiểm tra trạng thái mở khóa chương
 * 
 * @param req Request Express
 * @param contentId ID của content
 * @param chapterId ID của chapter
 * @returns trạng thái mở khóa (isUnlocked)
 */
export async function handleUnlockCheck(req: Request, chapterId: number): Promise<boolean> {
  // Mặc định là không khóa nếu chapter không bị khóa
  let isUnlocked = true;
  
  // Nếu user đã đăng nhập, kiểm tra trạng thái mở khóa
  if (req.isAuthenticated && req.isAuthenticated()) {
    const userId = (req.user as any).id;
    isUnlocked = await checkChapterUnlocked(userId, chapterId);
    console.log(`User ${userId} checked chapter ${chapterId} unlock status: ${isUnlocked ? 'UNLOCKED' : 'LOCKED'}`);
  } else {
    console.log(`Anonymous user accessed chapter ${chapterId}`);
    isUnlocked = false; // Không đăng nhập thì chắc chắn là chưa mở khóa
  }
  
  return isUnlocked;
}