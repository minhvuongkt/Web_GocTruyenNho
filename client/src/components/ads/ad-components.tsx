import React from 'react';
import { useAds, type Advertisement } from './ad-context';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Component for top banner ads
export function TopAd() {
  const { ads, positions, isReading, clickAd, closeAd } = useAds();
  const topAds = ads.top || [];
  
  if (!positions.top?.show || topAds.length === 0 || isReading) {
    // Return an empty div with height transition for smooth collapsing/expanding
    return <div className="h-0 transition-height duration-300 ease-in-out overflow-hidden" data-ad-position="top"></div>;
  }
  
  // Display the first ad in the array
  const ad = topAds[0];
  
  return (
    <div className="w-full bg-background border-b mb-4 px-2 pt-1 transition-height duration-300 ease-in-out" data-ad-position="top">
      <div className="relative max-w-7xl mx-auto">
        <a 
          href={ad.targetUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => clickAd(ad.id, 'top')}
          className="block"
        >
          <div className="text-xs text-muted-foreground mb-1">Quảng cáo</div>
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
    // Return an empty div with height transition for smooth collapsing/expanding
    return <div className="h-0 transition-height duration-300 ease-in-out overflow-hidden" data-ad-position="bottom"></div>;
  }
  
  // Display the first ad in the array
  const ad = bottomAds[0];
  
  return (
    <div className="w-full bg-background border-t mt-4 px-2 pt-1 sticky bottom-0 transition-height duration-300 ease-in-out z-10" data-ad-position="bottom">
      <div className="relative max-w-7xl mx-auto">
        <a 
          href={ad.targetUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => clickAd(ad.id, 'bottom')}
          className="block"
        >
          <div className="text-xs text-muted-foreground mb-1">Quảng cáo</div>
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
    // Return an empty div with width transition for smooth collapsing/expanding
    return <div className="hidden lg:block fixed left-0 top-1/4 w-0 transition-all duration-300 ease-in-out overflow-hidden" data-ad-position="left"></div>;
  }
  
  // Display the first ad in the array
  const ad = leftAds[0];
  
  return (
    <div className="hidden lg:block fixed left-0 top-1/4 w-[160px] bg-background border-r p-2 transition-all duration-300 ease-in-out" data-ad-position="left">
      <div className="relative">
        <a 
          href={ad.targetUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => clickAd(ad.id, 'left')}
          className="block"
        >
          <div className="text-xs text-muted-foreground mb-1">Quảng cáo</div>
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
    // Return an empty div with width transition for smooth collapsing/expanding
    return <div className="hidden lg:block fixed right-0 top-1/4 w-0 transition-all duration-300 ease-in-out overflow-hidden" data-ad-position="right"></div>;
  }
  
  // Display the first ad in the array
  const ad = rightAds[0];
  
  return (
    <div className="hidden lg:block fixed right-0 top-1/4 w-[160px] bg-background border-l p-2 transition-all duration-300 ease-in-out" data-ad-position="right">
      <div className="relative">
        <a 
          href={ad.targetUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => clickAd(ad.id, 'right')}
          className="block"
        >
          <div className="text-xs text-muted-foreground mb-1">Quảng cáo</div>
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-4 relative animate-in slide-in-from-bottom-4 duration-300">
        <div className="text-sm font-medium mb-2">Quảng cáo</div>
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
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none animate-in fade-in duration-300">
      <div className="pointer-events-auto max-w-[320px] relative animate-in slide-in-from-top-4 duration-300">
        <a 
          href={ad.targetUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => clickAd(ad.id, 'overlay')}
          className="block relative rounded-lg overflow-hidden shadow-lg bg-background/60 backdrop-blur-sm"
        >
          <img 
            src={ad.imageUrl} 
            alt={ad.title} 
            className="w-full object-contain"
          />
          <div className="absolute top-0 left-0 bg-primary/80 text-primary-foreground px-2 py-1 text-xs">
            Quảng cáo
          </div>
        </a>
        <button 
          onClick={() => closeAd('overlay')} 
          className="absolute -top-2 -right-2 bg-white shadow-md p-1 rounded-full text-gray-700 hover:bg-gray-200 z-10"
          aria-label="Close advertisement"
        >
          <X size={16} />
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