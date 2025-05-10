import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogDescription
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useAdTimer } from '@/hooks/use-ads';

export interface PopupAdProps {
  title?: string;
  isOpen?: boolean;
  onClose?: () => void;
  adCode?: string;
  adImage?: string;
  adLink?: string;
  width?: number | string;
  height?: number | string;
  autoShow?: boolean; // Tự động hiển thị khi thỏa mãn thời gian
  forceShow?: boolean; // Bỏ qua kiểm tra thời gian
  timerKey?: string; // Khóa để lưu trữ thời gian hiển thị
  timerMinutes?: number; // Số phút giữa các lần hiển thị
}

export function PopupAd({
  title = 'Quảng cáo',
  isOpen: externalIsOpen,
  onClose,
  adCode,
  adImage,
  adLink,
  width = 500,
  height = 400,
  autoShow = true,
  forceShow = false,
  timerKey = 'popup_ad',
  timerMinutes = 15
}: PopupAdProps) {
  const [canShowAd, markAdAsShown] = useAdTimer(timerKey, timerMinutes);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Xác định trạng thái đóng/mở dựa trên props và internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  // Xử lý đóng popup
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
    
    if (canShowAd) {
      markAdAsShown();
    }
  };

  // Tự động hiển thị khi thỏa mãn điều kiện thời gian
  useEffect(() => {
    if (autoShow && (canShowAd || forceShow) && externalIsOpen === undefined) {
      // Delay hiển thị quảng cáo để tránh làm phiền người dùng ngay lập tức
      const timer = setTimeout(() => {
        setInternalIsOpen(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [autoShow, canShowAd, forceShow, externalIsOpen]);

  // Nếu không thể hiện quảng cáo và không bắt buộc mở, thì không hiển thị gì
  if (!canShowAd && !forceShow && externalIsOpen === undefined) {
    return null;
  }

  // Render ad content
  const renderAdContent = () => {
    if (adCode) {
      return (
        <div 
          style={{ width, height }}
          dangerouslySetInnerHTML={{ __html: adCode }}
        />
      );
    }

    if (adImage) {
      return (
        <div className="flex justify-center items-center" style={{ width, height }}>
          {adLink ? (
            <a 
              href={adLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
              onClick={handleClose}
            >
              <img 
                src={adImage} 
                alt="Advertisement" 
                className="max-w-full max-h-full object-contain"
              />
            </a>
          ) : (
            <img 
              src={adImage} 
              alt="Advertisement" 
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
      );
    }

    return (
      <div 
        className="bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center p-6 rounded-md"
        style={{ width, height: height || 300 }}
      >
        <p className="text-center text-slate-500 dark:text-slate-400">
          Không có nội dung quảng cáo
        </p>
      </div>
    );
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent className="p-0 overflow-hidden max-w-screen-md" style={{ width: 'auto', maxWidth: '90vw' }}>
        <AlertDialogHeader className="bg-primary text-primary-foreground p-2 flex items-center justify-between">
          <AlertDialogTitle className="text-sm">{title}</AlertDialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full hover:bg-white/20 text-white"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDialogHeader>
        
        <div className="overflow-auto">
          {renderAdContent()}
        </div>
        
        <AlertDialogFooter className="px-4 py-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClose} 
            className="w-full"
          >
            Đóng quảng cáo
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default PopupAd;