import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface AdsContextType {
  showAds: boolean; // Có hiển thị quảng cáo không
  showBanners: boolean; // Có hiển thị banner hai bên không
  toggleAds: () => void; // Bật/tắt quảng cáo
  lastAdCloseTime: number | null; // Thời gian cuối cùng khi đóng quảng cáo popup
  updateLastAdCloseTime: () => void; // Cập nhật thời gian đóng quảng cáo popup
  shouldShowAds: (adType: 'popup' | 'overlay' | 'banner', adKey?: string) => boolean; // Kiểm tra có nên hiển thị quảng cáo không
}

const AdsContext = createContext<AdsContextType>({
  showAds: true,
  showBanners: true,
  toggleAds: () => {},
  lastAdCloseTime: null,
  updateLastAdCloseTime: () => {},
  shouldShowAds: () => true,
});

export const useAds = () => useContext(AdsContext);

// Thời gian tối thiểu giữa các lần hiển thị quảng cáo popup (15 phút = 900000ms)
const AD_INTERVAL = 15 * 60 * 1000;

export interface AdsProviderProps {
  children: ReactNode;
}

export function AdsProvider({ children }: AdsProviderProps) {
  // Lưu trạng thái hiển thị quảng cáo vào localStorage
  const [showAds, setShowAds] = useLocalStorage<boolean>('showAds', true);
  const [showBanners, setShowBanners] = useLocalStorage<boolean>('showBanners', true);
  const [lastAdCloseTime, setLastAdCloseTime] = useLocalStorage<number | null>('lastAdCloseTime', null);
  
  // Theo dõi lần cuối đóng từng loại quảng cáo cụ thể
  const [adTimers, setAdTimers] = useLocalStorage<Record<string, number>>('adTimers', {});

  // Bật/tắt quảng cáo
  const toggleAds = () => {
    setShowAds(!showAds);
    setShowBanners(!showBanners);
  };

  // Cập nhật thời gian đóng quảng cáo popup
  const updateLastAdCloseTime = () => {
    const now = Date.now();
    setLastAdCloseTime(now);
  };

  // Cập nhật thời gian đóng quảng cáo cụ thể
  const updateAdTimer = (adKey: string) => {
    const now = Date.now();
    setAdTimers((prev) => ({
      ...prev,
      [adKey]: now,
    }));
  };

  // Kiểm tra xem có nên hiển thị quảng cáo hay không
  const shouldShowAds = (adType: 'popup' | 'overlay' | 'banner', adKey?: string) => {
    if (!showAds) return false;
    
    if (adType === 'banner') {
      return showBanners;
    }
    
    if (adType === 'popup' || adType === 'overlay') {
      const now = Date.now();
      
      // Nếu có adKey cụ thể, kiểm tra timer của ad đó
      if (adKey && adTimers[adKey]) {
        return now - adTimers[adKey] > AD_INTERVAL;
      }
      
      // Nếu không có adKey, sử dụng lastAdCloseTime chung
      if (lastAdCloseTime) {
        return now - lastAdCloseTime > AD_INTERVAL;
      }
    }
    
    return true;
  };

  const value = {
    showAds,
    showBanners,
    toggleAds,
    lastAdCloseTime,
    updateLastAdCloseTime,
    shouldShowAds,
  };

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}