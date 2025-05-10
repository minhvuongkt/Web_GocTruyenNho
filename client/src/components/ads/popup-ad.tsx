import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAds } from './ads-provider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface PopupAdProps {
  className?: string;
  adCode?: string;
  adImage?: string;
  adLink?: string;
  title?: string;
  width?: number | string;
  height?: number | string;
  isOpen?: boolean;
  onClose?: () => void;
  autoShow?: boolean;
  forceShow?: boolean;
  timerKey?: string; // Khóa duy nhất để theo dõi timer cho popup này
  timerMinutes?: number;
  delay?: number; // Milliseconds để delay hiển thị sau khi mount
}

export function PopupAd({
  className,
  adCode,
  adImage,
  adLink = '#',
  title = 'Quảng cáo',
  width = 400,
  height = 300,
  isOpen: externalIsOpen,
  onClose,
  autoShow = true, // Tự động hiển thị khi component được mount
  forceShow = false, // Bắt buộc hiển thị bỏ qua timer
  timerKey = 'default-popup-ad', // Khóa mặc định
  timerMinutes = 15, // 15 phút giữa các lần hiển thị
  delay = 0, // Không delay mặc định
}: PopupAdProps) {
  const { showAds, shouldShowAds, updateLastAdCloseTime } = useAds();
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Xác định trạng thái hiển thị thực tế
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  // Xử lý đóng popup
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
    updateLastAdCloseTime();
  };

  // Hiệu ứng tự động hiển thị popup sau khi delay
  useEffect(() => {
    // Nếu không hiển thị quảng cáo hoặc không auto show, không làm gì cả
    if (!showAds || !autoShow) return;

    // Kiểm tra xem có nên hiển thị dựa trên timer không
    const canShow = forceShow || shouldShowAds('popup', timerKey);
    
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
  if (!showAds || (!isOpen && !autoShow)) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className={cn('', className)}
        style={{ maxWidth: width, maxHeight: height }}
      >
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle>{title}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute right-4 top-4"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}