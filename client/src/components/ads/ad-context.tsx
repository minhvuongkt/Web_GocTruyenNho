import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface Advertisement {
  id: number;
  title: string;
  imageUrl: string;
  targetUrl: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'popup' | 'overlay';
  displayFrequency?: number;
  lastDisplayedAt?: string;
  isActive: boolean;
  views: number;
  clicks: number;
}

export interface AdPositionState {
  show: boolean;
  lastClosed?: Date;
  lastClicked?: Date;
}

interface AdContextValue {
  ads: Record<string, Advertisement[]>;
  positions: Record<string, AdPositionState>;
  isLoading: boolean;
  isReading: boolean;
  setIsReading: (reading: boolean) => void;
  showAd: (position: string) => void;
  hideAd: (position: string) => void;
  clickAd: (adId: number, position: string) => void;
  closeAd: (position: string) => void;
}

const AdContext = createContext<AdContextValue | undefined>(undefined);

export function useAds() {
  const context = useContext(AdContext);
  if (context === undefined) {
    throw new Error('useAds must be used within an AdProvider');
  }
  return context;
}

export function AdProvider({ children }: { children: ReactNode }) {
  const [ads, setAds] = useState<Record<string, Advertisement[]>>({});
  const [positions, setPositions] = useState<Record<string, AdPositionState>>({
    top: { show: true },
    bottom: { show: true },
    left: { show: true },
    right: { show: true },
    popup: { show: false },
    overlay: { show: false },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isReading, setIsReading] = useState(false);

  // Fetch ads on component mount
  useEffect(() => {
    fetchAds();
  }, []);
  
  // Effect to hide banner ads when reading content
  useEffect(() => {
    if (isReading) {
      // Hide all banner ads but keep popup/overlay state based on their timers
      setPositions(prev => {
        const updated = { ...prev };
        updated.top = { ...prev.top, show: false };
        updated.bottom = { ...prev.bottom, show: false };
        updated.left = { ...prev.left, show: false };
        updated.right = { ...prev.right, show: false };
        return updated;
      });
    } else {
      // Show banner ads again when not reading
      setPositions(prev => {
        const updated = { ...prev };
        updated.top = { ...prev.top, show: true };
        updated.bottom = { ...prev.bottom, show: true };
        updated.left = { ...prev.left, show: true };
        updated.right = { ...prev.right, show: true };
        return updated;
      });
    }
  }, [isReading]);

  // Check for popup/overlay timing
  useEffect(() => {
    const interval = setInterval(() => {
      checkAdTimings();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [positions]);

  const fetchAds = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('/api/ads/active', { method: 'GET' });
      
      // Check if response is valid
      if (response && Array.isArray(response)) {
        // Group ads by position
        const groupedAds: Record<string, Advertisement[]> = {};
        response.forEach((ad: Advertisement) => {
          if (!groupedAds[ad.position]) {
            groupedAds[ad.position] = [];
          }
          groupedAds[ad.position].push(ad);
        });
        
        setAds(groupedAds);
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAdTimings = () => {
    setPositions(prev => {
      const updated = { ...prev };
      
      // Check popup timing (reappear after 5 minutes if closed, 15 minutes if clicked)
      if (updated.popup.lastClosed) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (updated.popup.lastClosed < fiveMinutesAgo) {
          updated.popup.show = true;
          updated.popup.lastClosed = undefined;
        }
      } else if (updated.popup.lastClicked) {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (updated.popup.lastClicked < fifteenMinutesAgo) {
          updated.popup.show = true;
          updated.popup.lastClicked = undefined;
        }
      }
      
      // For overlay, implement the same timing as requested (5 minutes if closed, 15 minutes if clicked)
      if (updated.overlay.lastClosed) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (updated.overlay.lastClosed < fiveMinutesAgo) {
          updated.overlay.show = true;
          updated.overlay.lastClosed = undefined;
        }
      } else if (updated.overlay.lastClicked) {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (updated.overlay.lastClicked < fifteenMinutesAgo) {
          updated.overlay.show = true;
          updated.overlay.lastClicked = undefined;
        }
      }
      
      return updated;
    });
  };

  const showAd = (position: string) => {
    setPositions(prev => {
      const updated = { ...prev };
      updated[position] = { ...prev[position], show: true };
      return updated;
    });
  };

  const hideAd = (position: string) => {
    setPositions(prev => {
      const updated = { ...prev };
      updated[position] = { ...prev[position], show: false };
      return updated;
    });
  };

  const closeAd = (position: string) => {
    setPositions(prev => {
      const updated = { ...prev };
      updated[position] = { 
        ...prev[position], 
        show: false,
        lastClosed: new Date(),
      };
      return updated;
    });
    
    // Set a timer to show popup/overlay ads again after 5 minutes
    if (position === 'popup' || position === 'overlay') {
      const reopenDelay = 5 * 60 * 1000; // 5 minutes in milliseconds
      setTimeout(() => {
        setPositions(current => {
          // Only reopen if it's still closed
          if (!current[position]?.show) {
            return {
              ...current,
              [position]: { ...current[position], show: true }
            };
          }
          return current;
        });
      }, reopenDelay);
    }
  };

  const clickAd = async (adId: number, position: string) => {
    try {
      // Record the click
      await apiRequest(`/api/ads/${adId}/click`, { method: 'POST' });
      
      // Update local state
      setPositions(prev => {
        const updated = { ...prev };
        updated[position] = { 
          ...prev[position], 
          show: false,
          lastClicked: new Date(),
        };
        return updated;
      });
      
      // Update the click count in our local state
      setAds(prev => {
        const updated = { ...prev };
        if (updated[position]) {
          updated[position] = updated[position].map(ad => {
            if (ad.id === adId) {
              return { ...ad, clicks: ad.clicks + 1 };
            }
            return ad;
          });
        }
        return updated;
      });
      
      // Set a timer to show popup/overlay ads again after 15 minutes (when clicked)
      if (position === 'popup' || position === 'overlay') {
        const reopenDelay = 15 * 60 * 1000; // 15 minutes in milliseconds
        setTimeout(() => {
          setPositions(current => {
            // Only reopen if it's still closed
            if (!current[position]?.show) {
              return {
                ...current,
                [position]: { ...current[position], show: true }
              };
            }
            return current;
          });
        }, reopenDelay);
      }
    } catch (error) {
      console.error('Error recording ad click:', error);
    }
  };

  return (
    <AdContext.Provider value={{
      ads,
      positions,
      isLoading,
      isReading,
      setIsReading,
      showAd,
      hideAd,
      clickAd,
      closeAd
    }}>
      {children}
    </AdContext.Provider>
  );
}