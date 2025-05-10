import React from 'react';
import { cn } from '@/lib/utils';
import { useAds } from './ads-provider';

export interface BannerAdProps {
  className?: string;
  adCode?: string;
  adImage?: string;
  adLink?: string;
  width?: number | string;
  height?: number | string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'sidebar';
}

export function BannerAd({
  className,
  adCode,
  adImage,
  adLink = '#',
  width = '100%',
  height = 'auto',
  position = 'top',
}: BannerAdProps) {
  const { showAds, shouldShowAds } = useAds();
  
  // Nếu không hiển thị quảng cáo, return null
  if (!showAds || !shouldShowAds('banner')) {
    return null;
  }

  // Xác định kích thước dựa trên vị trí
  const getDefaultDimensions = () => {
    switch (position) {
      case 'top':
      case 'bottom':
        return { width: '100%', height: '90px' };
      case 'left':
      case 'right':
      case 'sidebar':
        return { width: '160px', height: '600px' };
      default:
        return { width: '100%', height: '90px' };
    }
  };

  const defaultDimensions = getDefaultDimensions();
  const bannerWidth = width || defaultDimensions.width;
  const bannerHeight = height || defaultDimensions.height;

  // Nếu có adCode, ưu tiên hiển thị
  if (adCode) {
    return (
      <div
        className={cn('ad-container', className)}
        style={{ width: bannerWidth, height: bannerHeight }}
        dangerouslySetInnerHTML={{ __html: adCode }}
      />
    );
  }

  // Nếu có adImage, hiển thị ảnh
  if (adImage) {
    return (
      <a
        href={adLink}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('ad-container block overflow-hidden', className)}
        style={{ width: bannerWidth, height: bannerHeight }}
      >
        <img
          src={adImage}
          alt="Advertisement"
          className="w-full h-full object-contain"
        />
      </a>
    );
  }

  // Nếu không có dữ liệu quảng cáo, hiển thị vùng trống với border
  return (
    <div
      className={cn(
        'ad-container flex items-center justify-center border border-dashed border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700',
        className
      )}
      style={{ width: bannerWidth, height: bannerHeight }}
    >
      <p className="text-sm text-gray-500 dark:text-gray-400">Quảng cáo</p>
    </div>
  );
}