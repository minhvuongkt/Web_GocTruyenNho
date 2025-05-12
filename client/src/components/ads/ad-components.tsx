import React from 'react';
import { useAds, type Advertisement } from './ad-context';
import { ExternalAd } from './external-ad';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Component for top banner ads
export function TopAd() {
  const { ads, externalAds, positions, isReading, clickAd, closeAd } = useAds();
  const topAds = ads.top || [];
  const topExternalAds = externalAds?.top || [];
  
  // Early return if position is hidden or all ads are empty, or if reading
  if (!positions.top?.show || (topAds.length === 0 && topExternalAds.length === 0) || isReading) {
    // Return an empty div with height transition for smooth collapsing/expanding
    return <div className="h-0 transition-height duration-300 ease-in-out overflow-hidden" data-ad-position="top"></div>;
  }
  
  // Prioritize external ads if available
  if (topExternalAds.length > 0) {
    const externalAd = topExternalAds[0];
    
    return (
      <div className="w-full bg-background border-b mb-4 px-2 pt-1 transition-height duration-300 ease-in-out" data-ad-position="top">
        <div className="relative max-w-7xl mx-auto">
          <ExternalAd config={externalAd} className="mx-auto" />
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
  
  // Display the first ad in the internal ads array if no external ads
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
  const { ads, externalAds, positions, isReading, clickAd, closeAd } = useAds();
  const bottomAds = ads.bottom || [];
  const bottomExternalAds = externalAds?.bottom || [];
  
  // Early return if position is hidden or all ads are empty, or if reading
  if (!positions.bottom?.show || (bottomAds.length === 0 && bottomExternalAds.length === 0) || isReading) {
    // Return an empty div with height transition for smooth collapsing/expanding
    return <div className="h-0 transition-height duration-300 ease-in-out overflow-hidden" data-ad-position="bottom"></div>;
  }
  
  // Prioritize external ads if available
  if (bottomExternalAds.length > 0) {
    const externalAd = bottomExternalAds[0];
    
    return (
      <div className="w-full bg-background border-t border-border mt-4 px-2 pt-1 sticky bottom-0 transition-height duration-300 ease-in-out z-10 shadow-lg" data-ad-position="bottom">
        <div className="relative max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-1">
            <div className="text-xs text-muted-foreground">Quảng cáo từ {externalAd.provider}</div>
            <button 
              onClick={() => closeAd('bottom')} 
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label="Close advertisement"
            >
              <X size={16} />
            </button>
          </div>
          <div className="py-2">
            <ExternalAd config={externalAd} className="mx-auto" />
          </div>
        </div>
      </div>
    );
  }
  
  // Display the first ad in the internal ads array if no external ads
  const ad = bottomAds[0];
  
  return (
    <div className="w-full bg-background border-t border-border mt-4 px-2 pt-1 sticky bottom-0 transition-height duration-300 ease-in-out z-10 shadow-lg" data-ad-position="bottom">
      <div className="relative max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-1">
          <div className="text-xs text-muted-foreground">Quảng cáo</div>
          <button 
            onClick={() => closeAd('bottom')} 
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="Close advertisement"
          >
            <X size={16} />
          </button>
        </div>
        <a 
          href={ad.targetUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => clickAd(ad.id, 'bottom')}
          className="block py-2"
        >
          <img 
            src={ad.imageUrl} 
            alt={ad.title} 
            className="mx-auto max-h-24 object-contain"
          />
          <div className="text-center text-sm mt-1">{ad.title}</div>
        </a>
      </div>
    </div>
  );
}

// Component for left sidebar ads
export function LeftAd() {
  const { ads, externalAds, positions, isReading, clickAd, closeAd } = useAds();
  const leftAds = ads.left || [];
  const leftExternalAds = externalAds?.left || [];
  
  // Early return if position is hidden or all ads are empty, or if reading
  if (!positions.left?.show || (leftAds.length === 0 && leftExternalAds.length === 0) || isReading) {
    // Return an empty div with width transition for smooth collapsing/expanding
    return <div className="hidden lg:block fixed left-0 top-1/4 w-0 transition-all duration-300 ease-in-out overflow-hidden" data-ad-position="left"></div>;
  }
  
  // Prioritize external ads if available
  if (leftExternalAds.length > 0) {
    const externalAd = leftExternalAds[0];
    
    return (
      <div className="hidden lg:block fixed left-0 top-1/4 w-[160px] bg-background border-r p-2 transition-all duration-300 ease-in-out" data-ad-position="left">
        <div className="relative">
          <ExternalAd config={externalAd} />
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
  
  // Display the first ad in the internal ads array if no external ads
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
  const { ads, externalAds, positions, isReading, clickAd, closeAd } = useAds();
  const rightAds = ads.right || [];
  const rightExternalAds = externalAds?.right || [];
  
  // Early return if position is hidden or all ads are empty, or if reading
  if (!positions.right?.show || (rightAds.length === 0 && rightExternalAds.length === 0) || isReading) {
    // Return an empty div with width transition for smooth collapsing/expanding
    return <div className="hidden lg:block fixed right-0 top-1/4 w-0 transition-all duration-300 ease-in-out overflow-hidden" data-ad-position="right"></div>;
  }
  
  // Prioritize external ads if available
  if (rightExternalAds.length > 0) {
    const externalAd = rightExternalAds[0];
    
    return (
      <div className="hidden lg:block fixed right-0 top-1/4 w-[160px] bg-background border-l p-2 transition-all duration-300 ease-in-out" data-ad-position="right">
        <div className="relative">
          <ExternalAd config={externalAd} />
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
  
  // Display the first ad in the internal ads array if no external ads
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
  const { ads, externalAds, positions, isReading, clickAd, closeAd } = useAds();
  const popupAds = ads.popup || [];
  const popupExternalAds = externalAds?.popup || [];
  
  // Early return if position is hidden or all ads are empty, or if reading
  if (!positions.popup?.show || (popupAds.length === 0 && popupExternalAds.length === 0) || isReading) {
    return null;
  }
  
  // Prioritize external ads if available
  if (popupExternalAds.length > 0) {
    const externalAd = popupExternalAds[0];
    
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-300">
        <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-4 relative animate-in slide-in-from-bottom-4 duration-300">
          <div className="text-sm font-medium mb-2 flex items-center">
            <span className="bg-primary/80 text-primary-foreground px-2 py-1 text-xs rounded mr-1">Quảng cáo</span>
            <span className="text-xs text-muted-foreground">Sẽ xuất hiện lại sau 15 phút khi bạn click</span>
          </div>
          <div className="max-w-[300px] mx-auto">
            <ExternalAd config={externalAd} />
          </div>
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
  
  // Display the first ad in the internal ads array if no external ads
  const ad = popupAds[0];
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-4 relative animate-in slide-in-from-bottom-4 duration-300">
        <div className="text-sm font-medium mb-2 flex items-center">
          <span className="bg-primary/80 text-primary-foreground px-2 py-1 text-xs rounded mr-1">Quảng cáo</span>
          <span className="text-xs text-muted-foreground">Sẽ xuất hiện lại sau 15 phút khi bạn click</span>
        </div>
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
          <div className="text-center text-primary hover:text-primary/80 font-medium">{ad.title}</div>
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

// Component for overlay ads - invisible version that only captures clicks
export function OverlayAd() {
  const { ads, externalAds, positions, isReading, clickAd, closeAd } = useAds();
  const overlayAds = ads.overlay || [];
  const overlayExternalAds = externalAds?.overlay || [];
  
  // Early return if position is hidden or all ads are empty, or if reading
  if (!positions.overlay?.show || (overlayAds.length === 0 && overlayExternalAds.length === 0) || isReading) {
    return null;
  }
  
  // Prioritize external ads if available
  if (overlayExternalAds.length > 0) {
    const externalAd = overlayExternalAds[0];
    
    // For script-based ads, we need a container to execute scripts
    const needsScriptExecution = externalAd.metadata && externalAd.metadata.scriptContent;
    
    // Completely invisible - just tracks clicks and executes scripts
    return (
      <div 
        className="fixed inset-0 z-40 cursor-default"
        onClick={() => clickAd(externalAd.id, 'overlay')}
        style={{ backgroundColor: 'transparent' }}
        aria-hidden="true"
      >
        {needsScriptExecution && externalAd.metadata && (
          <div className="sr-only" aria-hidden="true">
            <ExternalAd config={externalAd} />
          </div>
        )}
      </div>
    );
  }
  
  // Get the first regular ad
  const ad = overlayAds[0];
  
  // Invisible overlay that just captures clicks and redirects
  return (
    <div 
      className="fixed inset-0 z-40 cursor-default"
      onClick={() => {
        clickAd(ad.id, 'overlay');
        window.open(ad.targetUrl, '_blank');
      }}
      style={{ backgroundColor: 'transparent' }}
      aria-hidden="true"
    />
  );
}

// Container component that includes all ad components
export function AdsContainer() {
  const { positions } = useAds();

  // Apply content padding classes based on ad visibility
  React.useEffect(() => {
    const mainContent = document.querySelector('main') || document.getElementById('content');
    if (mainContent) {
      // Add or remove content padding classes based on side ad visibility
      if (positions.left?.show) {
        mainContent.classList.add('has-left-ad');
      } else {
        mainContent.classList.remove('has-left-ad');
      }

      if (positions.right?.show) {
        mainContent.classList.add('has-right-ad');
      } else {
        mainContent.classList.remove('has-right-ad');
      }

      // Always add transition class for smooth animations
      mainContent.classList.add('ad-content-padding');
    }
  }, [positions.left?.show, positions.right?.show]);

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