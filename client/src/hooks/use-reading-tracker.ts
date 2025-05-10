import { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from './use-local-storage';

// Khoảng thời gian tối thiểu để tính là đã đọc (mặc định 2 phút)
const DEFAULT_MIN_READ_TIME = 2 * 60 * 1000; // 2 phút

// Interface để lưu thông tin đọc truyện
interface ReadingProgress {
  [contentId: string]: {
    [chapterId: string]: {
      startTime: number;
      lastActive: number;
      completed: boolean;
      timeSpent: number;
    };
  };
}

interface ReadingTrackerOptions {
  contentId: number | string;
  chapterId: number | string;
  minReadTime?: number; // Số mili giây tối thiểu để được tính là đã đọc
  onComplete?: () => void; // Callback khi đã đọc đủ thời gian
}

/**
 * Hook để theo dõi thời gian đọc của người dùng
 * Ghi nhận chỉ khi người dùng đọc đủ thời gian quy định
 */
export function useReadingTracker({
  contentId,
  chapterId,
  minReadTime = DEFAULT_MIN_READ_TIME,
  onComplete,
}: ReadingTrackerOptions) {
  // Lưu trạng thái đọc vào localStorage
  const [readingProgress, setReadingProgress] = useLocalStorage<ReadingProgress>(
    'reading-progress',
    {}
  );
  
  // Trạng thái hoàn thành đọc
  const [completed, setCompleted] = useState(false);
  
  // Tracking thời gian đọc
  const [timeSpent, setTimeSpent] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const lastActiveRef = useRef<number>(Date.now());
  
  // Đánh dấu thời gian bắt đầu đọc
  useEffect(() => {
    const cId = String(contentId);
    const chId = String(chapterId);
    
    // Kiểm tra nếu đã đọc trước đó
    const existingProgress = readingProgress[cId]?.[chId];
    
    if (existingProgress) {
      // Đã đọc đủ thời gian trước đó
      if (existingProgress.completed) {
        setCompleted(true);
        setTimeSpent(existingProgress.timeSpent);
        return;
      }
      
      // Chưa hoàn thành, tiếp tục bắt đầu đọc
      setTimeSpent(existingProgress.timeSpent || 0);
    }
    
    // Tạo hoặc cập nhật progress
    const now = Date.now();
    setReadingProgress((prev) => ({
      ...prev,
      [cId]: {
        ...(prev[cId] || {}),
        [chId]: {
          ...(prev[cId]?.[chId] || {}),
          startTime: existingProgress?.startTime || now,
          lastActive: now,
          completed: existingProgress?.completed || false,
          timeSpent: existingProgress?.timeSpent || 0,
        },
      },
    }));
    
    // Tạo interval để theo dõi thời gian đọc
    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const lastActive = lastActiveRef.current;
      const timeDiff = now - lastActive;
      
      // Nếu không active quá 1 phút, không tính thời gian
      if (timeDiff < 60 * 1000) {
        // Đang active, cập nhật thời gian đọc
        setTimeSpent((prev) => {
          const newTime = prev + 1000; // Tăng 1 giây
          
          // Cập nhật vào localStorage
          setReadingProgress((prevProgress) => ({
            ...prevProgress,
            [cId]: {
              ...(prevProgress[cId] || {}),
              [chId]: {
                ...(prevProgress[cId]?.[chId] || {}),
                lastActive: now,
                timeSpent: newTime,
              },
            },
          }));
          
          // Kiểm tra nếu đã đọc đủ thời gian quy định
          if (newTime >= minReadTime && !completed) {
            setCompleted(true);
            
            // Đánh dấu là đã hoàn thành
            setReadingProgress((prevProgress) => ({
              ...prevProgress,
              [cId]: {
                ...(prevProgress[cId] || {}),
                [chId]: {
                  ...(prevProgress[cId]?.[chId] || {}),
                  completed: true,
                },
              },
            }));
            
            // Gọi callback khi hoàn thành
            if (onComplete) {
              onComplete();
            }
          }
          
          return newTime;
        });
      }
      
      // Cập nhật thời gian active
      lastActiveRef.current = now;
    }, 1000);
    
    // Cleanup interval khi unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [contentId, chapterId, minReadTime]);
  
  // Cập nhật khi người dùng tương tác với trang
  useEffect(() => {
    const handleActivity = () => {
      lastActiveRef.current = Date.now();
    };
    
    // Gắn các event listener
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    
    return () => {
      // Gỡ bỏ event listener
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);
  
  return {
    completed,
    timeSpent,
    readingProgress,
    // Hàm để reset thời gian đọc
    resetProgress: () => {
      const cId = String(contentId);
      const chId = String(chapterId);
      
      setTimeSpent(0);
      setCompleted(false);
      setReadingProgress((prev) => ({
        ...prev,
        [cId]: {
          ...(prev[cId] || {}),
          [chId]: {
            startTime: Date.now(),
            lastActive: Date.now(),
            completed: false,
            timeSpent: 0,
          },
        },
      }));
    },
  };
}