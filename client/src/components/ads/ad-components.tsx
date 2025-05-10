import React from 'react';
import { useAds, type Advertisement } from './ad-context';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Component for top banner ads
export function TopAd() {
  const { ads, positions, isReading, clickAd, closeAd } = useAds();
  const topAds = ads.top || [];
  
  if (!positions.top?.show || topAds.length === 0 || isReading) {
    return null;
  }
  
  // Display the first ad in the array
  const ad = topAds[0];
  
  return (
    <div className="w-full bg-background border-b mb-4 px-2 pt-1">
      <div className="relative max-w-7xl mx-auto">
        <a 
          href={ad.targetUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => clickAd(ad.id, 'top')}
          className="block"
        >
          <div className="text-xs text-muted-foreground mb-1">Advertisement</div>
          <img 
            src={ad.imageUrl} 
            alt={ad.title} 
            className="mx-auto max-h-24 object-contain"
          />
        </a>
        <button 
          onClick={() => closeAd('top')} 
          className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-foreground"
          aria-label="Close advertisement"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// Component for bottom banner ads
export function BottomAd() {
  const { ads, positions, isReading, clickAd, closeAd } = useAds();
  const bottomAds = ads.bottom || [];
  
  if (!positions.bottom?.show || bottomAds.length === 0 || isReading) {
    return null;
  }
  
  // Display the first ad in the array
  const ad = bottomAds[0];
  
  return (
    <div className="w-full bg-background border-t mt-4 px-2 pt-1 sticky bottom-0">
      <div className="relative max-w-7xl mx-auto">
        <a 
          href={ad.targetUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => clickAd(ad.id, 'bottom')}
          className="block"
        >
          <div className="text-xs text-muted-foreground mb-1">Advertisement</div>
          <img 
            src={ad.imageUrl} 
            alt={ad.title} 
            className="mx-auto max-h-24 object-contain"
          />
        </a>
        <button 
          onClick={() => closeAd('bottom')} 
          className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-foreground"
          aria-label="Close advertisement"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// Component for left sidebar ads
export function LeftAd() {
  const { ads, positions, isReading, clickAd, closeAd } = useAds();
  const leftAds = ads.left || [];
  
  if (!positions.left?.show || leftAds.length === 0 || isReading) {
    return null;
  }
  
  // Display the first ad in the array
  const ad = leftAds[0];
  
  return (
    <div className="hidden lg:block fixed left-0 top-1/4 w-[160px] bg-background border-r p-2">
      <div className="relative">
        <a 
          href={ad.targetUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => clickAd(ad.id, 'left')}
          className="block"
        >
          <div className="text-xs text-muted-foreground mb-1">Advertisement</div>
          <img 
            src={ad.imageUrl} 
            alt={ad.title} 
            className="w-full object-contain"
          />
        </a>
        <button 
          onClick={() => closeAd('left')} 
          className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-foreground"
          aria-label="Close advertisement"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

// Component for right sidebar ads
export function RightAd() {
  const { ads, positions, isReading, clickAd, closeAd } = useAds();
  const rightAds = ads.right || [];
  
  if (!positions.right?.show || rightAds.length === 0 || isReading) {
    return null;
  }
  
  // Display the first ad in the array
  const ad = rightAds[0];
  
  return (
    <div className="hidden lg:block fixed right-0 top-1/4 w-[160px] bg-background border-l p-2">
      <div className="relative">
        <a 
          href={ad.targetUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => clickAd(ad.id, 'right')}
          className="block"
        >
          <div className="text-xs text-muted-foreground mb-1">Advertisement</div>
          <img 
            src={ad.imageUrl} 
            alt={ad.title} 
            className="w-full object-contain"
          />
        </a>
        <button 
          onClick={() => closeAd('right')} 
          className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-foreground"
          aria-label="Close advertisement"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

// Component for popup ads
export function PopupAd() {
  const { ads, positions, isReading, clickAd, closeAd } = useAds();
  const popupAds = ads.popup || [];
  
  if (!positions.popup?.show || popupAds.length === 0 || isReading) {
    return null;
  }
  
  // Display the first ad in the array
  const ad = popupAds[0];
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-4 relative">
        <div className="text-sm font-medium mb-2">Advertisement</div>
        <a 
          href={ad.targetUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => clickAd(ad.id, 'popup')}
          className="block"
        >
          <img 
            src={ad.imageUrl} 
            alt={ad.title} 
            className="w-full object-contain mb-2"
          />
          <div className="text-center text-primary hover:text-primary/80">{ad.title}</div>
        </a>
        <button 
          onClick={() => closeAd('popup')} 
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
          aria-label="Close advertisement"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

// Component for overlay ads
export function OverlayAd() {
  const { ads, positions, isReading, clickAd, closeAd } = useAds();
  const overlayAds = ads.overlay || [];
  
  if (!positions.overlay?.show || overlayAds.length === 0 || isReading) {
    return null;
  }
  
  // Display the first ad in the array
  const ad = overlayAds[0];
  
  return (
    <div className="fixed inset-0 bg-black/25 z-40 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto">
        <a 
          href={ad.targetUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => clickAd(ad.id, 'overlay')}
          className="block relative"
        >
          <img 
            src={ad.imageUrl} 
            alt={ad.title} 
            className="max-w-full max-h-[80vh] object-contain"
          />
          <div className="absolute top-0 left-0 bg-primary/80 text-primary-foreground px-2 py-1 text-xs">
            Advertisement
          </div>
        </a>
        <button 
          onClick={() => closeAd('overlay')} 
          className="absolute top-0 right-0 bg-background/80 p-1 rounded-bl-md text-foreground"
          aria-label="Close advertisement"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}

// Container component that includes all ad components
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