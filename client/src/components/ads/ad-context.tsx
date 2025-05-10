import { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Định nghĩa đối tượng quảng cáo
export interface Advertisement {
  id: number;
  title: string;
  imageUrl: string;
  targetUrl: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'popup' | 'overlay';
  displayFrequency?: number;
  lastDisplayedAt?: string;
  isActive: boolean;
  views: number;
  clicks: number;
}

// Định nghĩa các thông tin về trạng thái quảng cáo
export interface AdPositionState {
  show: boolean;
  lastClosed?: Date;
  lastClicked?: Date;
}

// Định nghĩa context quảng cáo
interface AdContextValue {
  ads: Record<string, Advertisement[]>;
  positions: Record<string, AdPositionState>;
  isLoading: boolean;
  isReading: boolean;
  setIsReading: (reading: boolean) => void;
  showAd: (position: string) => void;
  hideAd: (position: string) => void;
  clickAd: (adId: number, position: string) => void;
  closeAd: (position: string) => void;
}

// Tạo context
const AdContext = createContext<AdContextValue | undefined>(undefined);

// Hook sử dụng context
export function useAds() {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAds must be used within an AdProvider');
  }
  return context;
}

// Provider component
export function AdProvider({ children }: { children: ReactNode }) {
  // Trạng thái quảng cáo cho từng vị trí
  const [ads, setAds] = useState<Record<string, Advertisement[]>>({});
  const [positions, setPositions] = useState<Record<string, AdPositionState>>({
    top: { show: true },
    bottom: { show: true },
    left: { show: true },
    right: { show: true },
    popup: { show: false },
    overlay: { show: false },
  });
  const [isReading, setIsReading] = useState(false);

  // Lấy dữ liệu quảng cáo từ API
  const { data, isLoading } = useQuery({
    queryKey: ['/api/ads/active'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ads/active');
      if (!response.ok) {
        throw new Error('Failed to fetch ads');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Refresh mỗi 5 phút
  });

  // Cập nhật trạng thái quảng cáo khi có dữ liệu
  useEffect(() => {
    if (data?.ads) {
      // Nhóm quảng cáo theo vị trí
      const groupedAds: Record<string, Advertisement[]> = {};
      
      for (const ad of data.ads) {
        if (!groupedAds[ad.position]) {
          groupedAds[ad.position] = [];
        }
        groupedAds[ad.position].push(ad);
      }
      
      setAds(groupedAds);
      
      // Thiết lập trạng thái hiển thị ban đầu cho popup và overlay nếu có
      if (groupedAds.popup?.length > 0 || groupedAds.overlay?.length > 0) {
        setPositions(prev => ({
          ...prev,
          popup: { ...prev.popup, show: groupedAds.popup?.length > 0 },
          overlay: { ...prev.overlay, show: groupedAds.overlay?.length > 0 },
        }));
      }
    }
  }, [data]);

  // Kiểm tra thời gian và hiện lại quảng cáo nếu đến thời gian
  useEffect(() => {
    const checkDisplayTime = () => {
      const now = new Date();
      const updatedPositions = { ...positions };
      
      // Kiểm tra popup
      if (positions.popup.lastClosed) {
        const popupAd = ads.popup?.[0];
        if (popupAd) {
          const elapsed = now.getTime() - positions.popup.lastClosed.getTime();
          const frequency = (popupAd.displayFrequency || 5) * 60 * 1000; // Mặc định 5 phút
          
          if (elapsed >= frequency) {
            updatedPositions.popup.show = true;
            updatedPositions.popup.lastClosed = undefined;
          }
        }
      }
      
      // Kiểm tra overlay
      if (positions.overlay.lastClicked) {
        const overlayAd = ads.overlay?.[0];
        if (overlayAd) {
          const elapsed = now.getTime() - positions.overlay.lastClicked.getTime();
          const frequency = (overlayAd.displayFrequency || 15) * 60 * 1000; // Mặc định 15 phút
          
          if (elapsed >= frequency) {
            updatedPositions.overlay.show = true;
            updatedPositions.overlay.lastClicked = undefined;
          }
        }
      }
      
      if (JSON.stringify(updatedPositions) !== JSON.stringify(positions)) {
        setPositions(updatedPositions);
      }
    };
    
    // Kiểm tra mỗi phút
    const intervalId = setInterval(checkDisplayTime, 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [positions, ads]);

  // Hiển thị quảng cáo
  const showAd = (position: string) => {
    setPositions(prev => ({
      ...prev,
      [position]: { ...prev[position], show: true },
    }));
  };

  // Ẩn quảng cáo
  const hideAd = (position: string) => {
    setPositions(prev => ({
      ...prev,
      [position]: { ...prev[position], show: false },
    }));
  };

  // Xử lý sự kiện khi click vào quảng cáo
  const clickAd = async (adId: number, position: string) => {
    try {
      // Cập nhật trạng thái cục bộ cho overlay
      if (position === 'overlay') {
        setPositions(prev => ({
          ...prev,
          overlay: { 
            ...prev.overlay, 
            show: false,
            lastClicked: new Date() 
          },
        }));
      }
      
      // Gửi sự kiện click
      await apiRequest('POST', `/api/ads/${adId}/click`);
    } catch (error) {
      console.error('Failed to record ad click:', error);
    }
  };

  // Xử lý sự kiện khi đóng quảng cáo popup
  const closeAd = (position: string) => {
    if (position === 'popup') {
      setPositions(prev => ({
        ...prev,
        popup: { 
          ...prev.popup, 
          show: false,
          lastClosed: new Date() 
        },
      }));
    } else {
      hideAd(position);
    }
  };

  // Ẩn quảng cáo khi đang đọc truyện (top, bottom, left, right, popup)
  useEffect(() => {
    if (isReading) {
      setPositions(prev => ({
        ...prev,
        top: { ...prev.top, show: false },
        bottom: { ...prev.bottom, show: false },
        left: { ...prev.left, show: false },
        right: { ...prev.right, show: false },
        popup: { ...prev.popup, show: false },
      }));
    } else {
      setPositions(prev => ({
        ...prev,
        top: { ...prev.top, show: true },
        bottom: { ...prev.bottom, show: true },
        left: { ...prev.left, show: true },
        right: { ...prev.right, show: true },
        // Không tự động hiện lại popup
      }));
    }
  }, [isReading]);

  return (
    <AdContext.Provider
      value={{
        ads,
        positions,
        isLoading,
        isReading,
        setIsReading,
        showAd,
        hideAd,
        clickAd,
        closeAd,
      }}
    >
      {children}
    </AdContext.Provider>
  );
}