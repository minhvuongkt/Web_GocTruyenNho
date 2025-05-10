import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BannerAdPosition = 'top' | 'bottom' | 'left' | 'right';

export interface BannerAdProps {
  position: BannerAdPosition;
  className?: string;
  adCode?: string; // Mã quảng cáo từ ad network
  adImage?: string; // Ảnh quảng cáo
  adLink?: string; // Link khi click vào quảng cáo
  width?: number | string;
  height?: number | string;
}

export function BannerAd({
  position,
  className,
  adCode,
  adImage,
  adLink,
  width,
  height
}: BannerAdProps) {
  // Xác định style dựa trên vị trí
  const getPositionStyle = () => {
    switch(position) {
      case 'top':
        return 'w-full max-h-[100px] flex justify-center items-center mb-4';
      case 'bottom':
        return 'w-full max-h-[100px] flex justify-center items-center mt-4';
      case 'left':
        return 'h-full max-w-[160px] fixed left-0 top-0 flex flex-col justify-center items-center';
      case 'right':
        return 'h-full max-w-[160px] fixed right-0 top-0 flex flex-col justify-center items-center';
      default:
        return '';
    }
  };

  const getDefaultSize = () => {
    switch(position) {
      case 'top':
      case 'bottom':
        return { width: '728px', height: '90px' };
      case 'left':
      case 'right':
        return { width: '160px', height: '600px' };
      default:
        return { width: '300px', height: '250px' };
    }
  };

  const defaultSize = getDefaultSize();
  const finalWidth = width || defaultSize.width;
  const finalHeight = height || defaultSize.height;

  // Render quảng cáo từ mã script (AdSense, etc.)
  if (adCode) {
    return (
      <div 
        className={cn(getPositionStyle(), className)}
        style={{ width: finalWidth, height: finalHeight }}
        dangerouslySetInnerHTML={{ __html: adCode }}
      />
    );
  }

  // Render quảng cáo từ ảnh
  if (adImage) {
    return (
      <div className={cn(getPositionStyle(), className)}>
        {adLink ? (
          <a 
            href={adLink} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ width: finalWidth, height: finalHeight }}
            className="block"
          >
            <img 
              src={adImage} 
              alt="Advertisement" 
              className="w-full h-full object-cover"
              style={{ width: finalWidth, height: finalHeight }}
            />
          </a>
        ) : (
          <img 
            src={adImage} 
            alt="Advertisement" 
            className="w-full h-full object-cover"
            style={{ width: finalWidth, height: finalHeight }}
          />
        )}
      </div>
    );
  }

  // Placeholder khi không có quảng cáo
  return (
    <div 
      className={cn(
        getPositionStyle(),
        "bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-md flex flex-col items-center justify-center p-4",
        className
      )}
      style={{ width: finalWidth, height: finalHeight }}
    >
      <AlertTriangle className="h-6 w-6 text-yellow-500 mb-2" />
      <p className="text-xs text-center text-slate-500 dark:text-slate-400">Đang tải quảng cáo...</p>
    </div>
  );
}

export default BannerAd;