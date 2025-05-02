import { useEffect, useState } from 'react';
import { OverlayAd } from './overlay-ad';
import { PopupAd } from './popup-ad';

/**
 * Ad Manager Component
 * Manages the timing and display of different ad types,
 * particularly overlay ads which require timing control.
 */
export function AdManager() {
  const [showOverlayAd, setShowOverlayAd] = useState<boolean>(false);
  const [showPopupAd, setShowPopupAd] = useState<boolean>(false);
  
  // Track the last time an overlay ad was shown
  useEffect(() => {
    const lastOverlayTime = localStorage.getItem('lastOverlayAdTime');
    const currentTime = new Date().getTime();
    
    // Check if we need to show an overlay ad
    const checkIfShowOverlayAd = () => {
      // If no timing information exists, this might be the first visit
      if (!lastOverlayTime) {
        // Don't show immediately on first visit, wait a bit
        const delayedTime = currentTime + (2 * 60 * 1000); // 2 minutes delay for first-time visitors
        localStorage.setItem('lastOverlayAdTime', delayedTime.toString());
        return false;
      }
      
      const lastTime = parseInt(lastOverlayTime, 10);
      const timeDifference = currentTime - lastTime;
      
      // Default to 15 minutes if no other frequency is set
      const minFrequency = 15 * 60 * 1000; // 15 minutes in milliseconds
      
      // If enough time has passed, show an overlay ad
      if (timeDifference >= minFrequency) {
        return true;
      }
      
      return false;
    };
    
    // Initial check when component mounts
    const shouldShowOverlayAd = checkIfShowOverlayAd();
    if (shouldShowOverlayAd) {
      // Slight delay to not show immediately when page loads
      const timer = setTimeout(() => {
        setShowOverlayAd(true);
      }, 5000); // 5 second delay
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Manage popup ads - show after a short delay if overlay isn't showing
  useEffect(() => {
    // Check if we need to show a popup ad (different from overlay)
    const lastPopupTime = localStorage.getItem('lastPopupAdTime');
    const currentTime = new Date().getTime();
    
    const checkIfShowPopupAd = () => {
      // If overlay is showing, don't show popup
      if (showOverlayAd) return false;
      
      // If no timing information exists
      if (!lastPopupTime) {
        // First time, show after a short delay
        return true;
      }
      
      const lastTime = parseInt(lastPopupTime, 10);
      const timeDifference = currentTime - lastTime;
      
      // Show popup ads more frequently than overlays
      const minFrequency = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      if (timeDifference >= minFrequency) {
        return true;
      }
      
      return false;
    };
    
    // Check if we should show a popup ad
    const shouldShowPopupAd = checkIfShowPopupAd();
    if (shouldShowPopupAd) {
      // Show popup after a short delay
      const timer = setTimeout(() => {
        setShowPopupAd(true);
      }, 10000); // 10 second delay
      
      return () => clearTimeout(timer);
    }
  }, [showOverlayAd]);
  
  const handleCloseOverlayAd = () => {
    setShowOverlayAd(false);
    // Update the last shown time
    localStorage.setItem('lastOverlayAdTime', new Date().getTime().toString());
  };
  
  const handleClosePopupAd = () => {
    setShowPopupAd(false);
    // Update the last shown time
    localStorage.setItem('lastPopupAdTime', new Date().getTime().toString());
  };
  
  return (
    <>
      {showOverlayAd && <OverlayAd onClose={handleCloseOverlayAd} />}
      {showPopupAd && <PopupAd onClose={handleClosePopupAd} />}
    </>
  );
}
