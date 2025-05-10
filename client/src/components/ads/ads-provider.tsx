import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

// Thời gian mặc định giữa các lần hiển thị quảng cáo (15 phút)
const DEFAULT_AD_INTERVAL = 15 * 60 * 1000;

// Loại quảng cáo
type AdType = 'banner' | 'popup' | 'overlay';

// Trạng thái quảng cáo đã đóng
interface AdCloseState {
  [key: string]: number; // Thời gian đóng quảng cáo
}

interface AdsContextType {
  // Trạng thái hiển thị quảng cáo
  showAds: boolean;
  toggleAds: () => void;
  
  // Điều khiển hiển thị các loại quảng cáo
  showBanners: boolean;
  showPopups: boolean;
  showOverlays: boolean;
  toggleBanners: () => void;
  togglePopups: () => void;
  toggleOverlays: () => void;
  
  // Kiểm tra xem có nên hiển thị quảng cáo không
  shouldShowAds: (type: AdType, key?: string) => boolean;
  
  // Cập nhật thời gian đóng quảng cáo
  updateLastAdCloseTime: (key?: string) => void;
  
  // Ẩn quảng cáo khi đọc truyện
  hideAdsOnReading: boolean;
  setHideAdsOnReading: (hide: boolean) => void;
}

const AdsContext = createContext<AdsContextType | undefined>(undefined);

export function AdsProvider({ children }: { children: React.ReactNode }) {
  // Trạng thái hiển thị quảng cáo tổng thể
  const [showAds, setShowAds] = useLocalStorage('showAds', true);
  
  // Trạng thái hiển thị từng loại quảng cáo
  const [showBanners, setShowBanners] = useLocalStorage('showBanners', true);
  const [showPopups, setShowPopups] = useLocalStorage('showPopups', true);
  const [showOverlays, setShowOverlays] = useLocalStorage('showOverlays', true);
  
  // Ẩn quảng cáo khi đọc truyện
  const [hideAdsOnReading, setHideAdsOnReading] = useLocalStorage('hideAdsOnReading', true);
  
  // Lưu thời gian đóng quảng cáo
  const [adCloseHistory, setAdCloseHistory] = useLocalStorage<AdCloseState>('adCloseHistory', {});
  
  // Toggle hiển thị quảng cáo
  const toggleAds = () => setShowAds(prev => !prev);
  
  // Toggle hiển thị từng loại quảng cáo
  const toggleBanners = () => setShowBanners(prev => !prev);
  const togglePopups = () => setShowPopups(prev => !prev);
  const toggleOverlays = () => setShowOverlays(prev => !prev);
  
  // Cập nhật thời gian đóng quảng cáo
  const updateLastAdCloseTime = (key = 'global') => {
    setAdCloseHistory(prev => ({
      ...prev,
      [key]: Date.now()
    }));
  };
  
  // Kiểm tra xem có nên hiển thị quảng cáo không dựa trên thời gian đóng
  const shouldShowAds = (type: AdType, key = 'global'): boolean => {
    // Kiểm tra xem quảng cáo có được bật không
    if (!showAds) return false;
    
    // Kiểm tra từng loại quảng cáo
    if (type === 'banner' && !showBanners) return false;
    if (type === 'popup' && !showPopups) return false;
    if (type === 'overlay' && !showOverlays) return false;
    
    // Lấy thời gian đóng quảng cáo cuối cùng
    const lastCloseTime = adCloseHistory[key] || 0;
    const now = Date.now();
    
    // Kiểm tra xem đã qua đủ thời gian hiển thị lại chưa
    return now - lastCloseTime > DEFAULT_AD_INTERVAL;
  };
  
  // Cung cấp context
  const value: AdsContextType = {
    showAds,
    toggleAds,
    showBanners,
    showPopups,
    showOverlays,
    toggleBanners,
    togglePopups,
    toggleOverlays,
    shouldShowAds,
    updateLastAdCloseTime,
    hideAdsOnReading,
    setHideAdsOnReading,
  };
  
  return (
    <AdsContext.Provider value={value}>
      {children}
    </AdsContext.Provider>
  );
}

// Hook để sử dụng context quảng cáo
export function useAds(): AdsContextType {
  const context = useContext(AdsContext);
  if (context === undefined) {
    throw new Error('useAds must be used within an AdsProvider');
  }
  return context;
}