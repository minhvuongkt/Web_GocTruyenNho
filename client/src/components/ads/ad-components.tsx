import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAds, type Advertisement } from './ad-context';
import { cn } from '@/lib/utils';

// Quảng cáo ở vị trí trên cùng
export function TopAd() {
  const { ads, positions, clickAd, closeAd } = useAds();
  const topAds = ads.top || [];
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // Luân phiên quảng cáo
  useEffect(() => {
    if (topAds.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % topAds.length);
      }, 10000); // Đổi quảng cáo mỗi 10 giây
      return () => clearInterval(interval);
    }
  }, [topAds.length]);

  if (!positions.top.show || topAds.length === 0) return null;

  const ad = topAds[currentAdIndex];
  
  const handleAdClick = () => {
    clickAd(ad.id, 'top');
    window.open(ad.targetUrl, '_blank');
  };

  return (
    <div className="w-full bg-background border-b shadow-sm">
      <div className="container mx-auto px-4 relative">
        <button 
          onClick={() => closeAd('top')}
          className="absolute right-5 top-1 p-1 rounded-full hover:bg-gray-200 z-10"
          aria-label="Đóng quảng cáo"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div onClick={handleAdClick} className="cursor-pointer w-full flex justify-center py-2">
          <img 
            src={ad.imageUrl} 
            alt={ad.title} 
            className="h-16 w-auto" 
          />
          <div className="absolute bottom-0 right-12 bg-black/30 text-white text-xs px-1">
            Quảng cáo
          </div>
        </div>
      </div>
    </div>
  );
}

// Quảng cáo ở vị trí dưới cùng
export function BottomAd() {
  const { ads, positions, clickAd, closeAd } = useAds();
  const bottomAds = ads.bottom || [];
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // Luân phiên quảng cáo
  useEffect(() => {
    if (bottomAds.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % bottomAds.length);
      }, 10000); // Đổi quảng cáo mỗi 10 giây
      return () => clearInterval(interval);
    }
  }, [bottomAds.length]);

  if (!positions.bottom.show || bottomAds.length === 0) return null;

  const ad = bottomAds[currentAdIndex];
  
  const handleAdClick = () => {
    clickAd(ad.id, 'bottom');
    window.open(ad.targetUrl, '_blank');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-md z-20">
      <div className="container mx-auto px-4 relative">
        <button 
          onClick={() => closeAd('bottom')}
          className="absolute right-5 top-1 p-1 rounded-full hover:bg-gray-200 z-10"
          aria-label="Đóng quảng cáo"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div onClick={handleAdClick} className="cursor-pointer w-full flex justify-center py-2">
          <img 
            src={ad.imageUrl} 
            alt={ad.title} 
            className="h-16 w-auto" 
          />
          <div className="absolute bottom-1 right-12 bg-black/30 text-white text-xs px-1">
            Quảng cáo
          </div>
        </div>
      </div>
    </div>
  );
}

// Quảng cáo ở vị trí trái
export function LeftAd() {
  const { ads, positions, clickAd, closeAd } = useAds();
  const leftAds = ads.left || [];
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // Luân phiên quảng cáo
  useEffect(() => {
    if (leftAds.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % leftAds.length);
      }, 15000); // Đổi quảng cáo mỗi 15 giây
      return () => clearInterval(interval);
    }
  }, [leftAds.length]);

  if (!positions.left.show || leftAds.length === 0) return null;

  const ad = leftAds[currentAdIndex];
  
  const handleAdClick = () => {
    clickAd(ad.id, 'left');
    window.open(ad.targetUrl, '_blank');
  };

  return (
    <div className="fixed top-1/3 left-0 transform -translate-y-1/2 z-20">
      <div className="relative bg-background shadow-md rounded-r">
        <button 
          onClick={() => closeAd('left')}
          className="absolute -right-2 -top-2 p-1 rounded-full bg-white shadow hover:bg-gray-200 z-10"
          aria-label="Đóng quảng cáo"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div onClick={handleAdClick} className="cursor-pointer">
          <img 
            src={ad.imageUrl} 
            alt={ad.title} 
            className="w-20 h-auto" 
          />
          <div className="absolute bottom-0 right-0 bg-black/30 text-white text-xs px-1">
            QC
          </div>
        </div>
      </div>
    </div>
  );
}

// Quảng cáo ở vị trí phải
export function RightAd() {
  const { ads, positions, clickAd, closeAd } = useAds();
  const rightAds = ads.right || [];
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // Luân phiên quảng cáo
  useEffect(() => {
    if (rightAds.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % rightAds.length);
      }, 15000); // Đổi quảng cáo mỗi 15 giây
      return () => clearInterval(interval);
    }
  }, [rightAds.length]);

  if (!positions.right.show || rightAds.length === 0) return null;

  const ad = rightAds[currentAdIndex];
  
  const handleAdClick = () => {
    clickAd(ad.id, 'right');
    window.open(ad.targetUrl, '_blank');
  };

  return (
    <div className="fixed top-1/3 right-0 transform -translate-y-1/2 z-20">
      <div className="relative bg-background shadow-md rounded-l">
        <button 
          onClick={() => closeAd('right')}
          className="absolute -left-2 -top-2 p-1 rounded-full bg-white shadow hover:bg-gray-200 z-10"
          aria-label="Đóng quảng cáo"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div onClick={handleAdClick} className="cursor-pointer">
          <img 
            src={ad.imageUrl} 
            alt={ad.title} 
            className="w-20 h-auto" 
          />
          <div className="absolute bottom-0 left-0 bg-black/30 text-white text-xs px-1">
            QC
          </div>
        </div>
      </div>
    </div>
  );
}

// Quảng cáo dạng popup
export function PopupAd() {
  const { ads, positions, clickAd, closeAd } = useAds();
  const popupAds = ads.popup || [];
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // Luân phiên quảng cáo
  useEffect(() => {
    if (popupAds.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % popupAds.length);
      }, 30000); // Đổi quảng cáo mỗi 30 giây
      return () => clearInterval(interval);
    }
  }, [popupAds.length]);

  if (!positions.popup.show || popupAds.length === 0) return null;

  const ad = popupAds[currentAdIndex];
  
  const handleAdClick = () => {
    clickAd(ad.id, 'popup');
    window.open(ad.targetUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
      <div className="relative bg-background rounded-lg shadow-lg max-w-lg w-full">
        <button 
          onClick={() => closeAd('popup')}
          className="absolute -right-3 -top-3 p-1 rounded-full bg-white shadow hover:bg-gray-200 z-10"
          aria-label="Đóng quảng cáo"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">{ad.title}</h3>
          
          <div onClick={handleAdClick} className="cursor-pointer">
            <img 
              src={ad.imageUrl} 
              alt={ad.title} 
              className="w-full h-auto rounded" 
            />
          </div>
          
          <div className="mt-3 flex justify-end">
            <div className="bg-black/30 text-white text-xs px-1 py-0.5 rounded">
              Quảng cáo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quảng cáo dạng lớp phủ (overlay)
export function OverlayAd() {
  const { ads, positions, clickAd } = useAds();
  const overlayAds = ads.overlay || [];
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // Luân phiên quảng cáo
  useEffect(() => {
    if (overlayAds.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % overlayAds.length);
      }, 30000); // Đổi quảng cáo mỗi 30 giây
      return () => clearInterval(interval);
    }
  }, [overlayAds.length]);

  if (!positions.overlay.show || overlayAds.length === 0) return null;

  const ad = overlayAds[currentAdIndex];
  
  const handleAdClick = () => {
    clickAd(ad.id, 'overlay');
    window.open(ad.targetUrl, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 bg-transparent z-40 pointer-events-none flex items-center justify-center"
    >
      <div 
        className="absolute inset-0 bg-black/5 backdrop-blur-[1px] pointer-events-auto"
        onClick={handleAdClick}
      ></div>
      
      <div 
        className="pointer-events-auto bg-transparent text-center max-w-4xl w-full"
        onClick={handleAdClick}
      >
        <div className="inline-block relative cursor-pointer">
          <img 
            src={ad.imageUrl} 
            alt={ad.title} 
            className="max-w-full h-auto shadow-2xl rounded" 
          />
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
            Click để truy cập trang quảng cáo
          </div>
        </div>
      </div>
    </div>
  );
}

// AdsContainer - Component chứa tất cả các quảng cáo
export function AdsContainer() {
  return (
    <>
      <TopAd />
      <BottomAd />
      <LeftAd />
      <RightAd />
      <PopupAd />
      <OverlayAd />
    </>
  );
}