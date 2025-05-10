import { useEffect, useState } from 'react';

interface AdTimer {
  lastShown: number; // thời điểm cuối hiển thị quảng cáo
  intervalMinutes: number; // khoảng thời gian giữa các lần hiển thị (phút)
}

// Hook quản lý thời gian hiển thị quảng cáo
export function useAdTimer(adKey: string, intervalMinutes: number = 15): [boolean, () => void] {
  const [canShowAd, setCanShowAd] = useState<boolean>(false);

  useEffect(() => {
    // Kiểm tra thời gian từ localStorage
    const checkAdTimer = () => {
      const storageKey = `ad_timer_${adKey}`;
      const adTimerJson = localStorage.getItem(storageKey);
      
      if (!adTimerJson) {
        // Không có dữ liệu, cho phép hiển thị quảng cáo
        setCanShowAd(true);
        return;
      }
      
      try {
        const adTimer = JSON.parse(adTimerJson) as AdTimer;
        const now = Date.now();
        const elapsedMinutes = (now - adTimer.lastShown) / (1000 * 60);
        
        // Kiểm tra nếu đã qua đủ thời gian
        if (elapsedMinutes >= adTimer.intervalMinutes) {
          setCanShowAd(true);
        } else {
          setCanShowAd(false);
          
          // Đặt hẹn giờ để tự động cập nhật khi đến thời gian
          const remainingMs = (adTimer.intervalMinutes * 60 * 1000) - (now - adTimer.lastShown);
          const timerId = setTimeout(() => {
            setCanShowAd(true);
          }, remainingMs);
          
          return () => clearTimeout(timerId);
        }
      } catch (error) {
        console.error('Error parsing ad timer:', error);
        setCanShowAd(true);
      }
    };
    
    checkAdTimer();
  }, [adKey, intervalMinutes]);

  // Cập nhật thời gian khi quảng cáo được hiển thị
  const markAdAsShown = () => {
    const storageKey = `ad_timer_${adKey}`;
    const adTimer: AdTimer = {
      lastShown: Date.now(),
      intervalMinutes
    };
    
    localStorage.setItem(storageKey, JSON.stringify(adTimer));
    setCanShowAd(false);
  };

  return [canShowAd, markAdAsShown];
}

// Hook theo dõi thời gian đọc (để tính lượt xem)
export function useReadingTime(contentId: number, chapterId: number, requiredMinutes: number = 1): boolean {
  const [hasReachedTime, setHasReachedTime] = useState<boolean>(false);
  
  useEffect(() => {
    if (!contentId || !chapterId) return;
    
    const startTime = Date.now();
    let timerInterval: NodeJS.Timeout;
    let readingTimerId: NodeJS.Timeout;
    let lastActive = startTime;
    let totalActiveTime = 0;
    
    // Đặt timer để kiểm tra sau mỗi giây
    timerInterval = setInterval(() => {
      const now = Date.now();
      
      // Nếu người dùng không tương tác trong 30 giây, coi là không đọc
      if (now - lastActive < 30000) {
        totalActiveTime += 1000; // Tăng thời gian đọc lên 1 giây
      }
      
      // Kiểm tra nếu đã đủ thời gian đọc
      if (totalActiveTime >= requiredMinutes * 60 * 1000) {
        setHasReachedTime(true);
        clearInterval(timerInterval);
      }
    }, 1000);
    
    // Theo dõi sự kiện để cập nhật thời gian hoạt động
    const resetActiveTimer = () => {
      lastActive = Date.now();
    };
    
    // Lưu ý các sự kiện để biết người dùng còn đang đọc
    window.addEventListener('scroll', resetActiveTimer);
    window.addEventListener('mousemove', resetActiveTimer);
    window.addEventListener('keydown', resetActiveTimer);
    window.addEventListener('click', resetActiveTimer);
    
    return () => {
      window.removeEventListener('scroll', resetActiveTimer);
      window.removeEventListener('mousemove', resetActiveTimer);
      window.removeEventListener('keydown', resetActiveTimer);
      window.removeEventListener('click', resetActiveTimer);
      clearInterval(timerInterval);
      if (readingTimerId) clearTimeout(readingTimerId);
    };
  }, [contentId, chapterId, requiredMinutes]);
  
  return hasReachedTime;
}