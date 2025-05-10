import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAds } from './ads-provider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface OverlayAdProps {
  className?: string;
  adCode?: string;
  adImage?: string;
  adLink?: string;
  width?: number | string;
  height?: number | string;
  isOpen?: boolean;
  onClose?: () => void;
  autoShow?: boolean;
  forceShow?: boolean;
  timerKey?: string;
  timerMinutes?: number;
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  delay?: number; // Milliseconds để delay hiển thị sau khi mount
}

export function OverlayAd({
  className,
  adCode,
  adImage,
  adLink = '#',
  width = 'auto',
  height = 'auto',
  isOpen: externalIsOpen,
  onClose,
  autoShow = true,
  forceShow = false,
  timerKey = 'default-overlay-ad',
  timerMinutes = 15,
  position = 'center',
  delay = 0,
}: OverlayAdProps) {
  const { showAds, shouldShowAds, updateLastAdCloseTime } = useAds();
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Xác định trạng thái hiển thị thực tế
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  // Xử lý đóng overlay
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
    updateLastAdCloseTime();
  };

  // Hiệu ứng tự động hiển thị overlay sau khi delay
  useEffect(() => {
    // Nếu không hiển thị quảng cáo hoặc không auto show, không làm gì cả
    if (!showAds || !autoShow) return;

    // Kiểm tra xem có nên hiển thị dựa trên timer không
    const canShow = forceShow || shouldShowAds('overlay', timerKey);

    if (canShow) {
      // Nếu có delay, đợi rồi mới hiển thị
      const timer = setTimeout(() => {
        setInternalIsOpen(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [
    showAds,
    autoShow,
    forceShow,
    shouldShowAds,
    timerKey,
    delay,
  ]);

  // Nếu không hiển thị quảng cáo hoặc không đủ điều kiện hiển thị, return null
  if (!showAds || !isOpen) {
    return null;
  }

  // Xác định vị trí của overlay
  const positionClasses = {
    'center': 'inset-0 flex items-center justify-center',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-hidden">
      <div 
        className={cn(
          'fixed z-50 overflow-hidden shadow-lg rounded-lg bg-white dark:bg-gray-900', 
          positionClasses[position],
          className
        )}
        style={{ 
          width: position === 'center' ? width : width || 300, 
          height: height 
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute right-2 top-2 z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Nội dung quảng cáo */}
        {adCode ? (
          <div
            dangerouslySetInnerHTML={{ __html: adCode }}
            className="w-full h-full"
          />
        ) : adImage ? (
          <a
            href={adLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full overflow-hidden"
          >
            <img
              src={adImage}
              alt="Advertisement"
              className="w-full h-full object-contain"
            />
          </a>
        ) : (
          <div className="flex items-center justify-center p-6 border border-dashed border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 w-full h-full rounded">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nội dung quảng cáo sẽ xuất hiện ở đây
            </p>
          </div>
        )}
      </div>
    </div>
  );
}