import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface PopupAdProps {
  onClose: () => void;
}

interface AdData {
  id: number;
  title: string;
  imageUrl: string;
  targetUrl: string;
}

export function PopupAd({ onClose }: PopupAdProps) {
  const [ad, setAd] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPopupAd() {
      try {
        setLoading(true);
        const response = await fetch('/api/ads?position=popup');
        if (!response.ok) {
          throw new Error('Failed to fetch popup ad');
        }
        
        const data = await response.json();
        if (data && data.length > 0) {
          // Get first active popup ad
          setAd(data[0]);
          // Record view
          await apiRequest('POST', `/api/ads/${data[0].id}/view`);
        }
      } catch (error) {
        console.error('Error fetching popup ad:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPopupAd();
  }, []);

  const handleAdClick = async () => {
    if (ad) {
      try {
        // Record click
        await apiRequest('POST', `/api/ads/${ad.id}/click`);
        // Open ad target in new tab
        window.open(ad.targetUrl, '_blank');
      } catch (error) {
        console.error('Error recording ad click:', error);
      }
    }
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (!ad) {
    // No ad to display, execute onClose to clean up
    onClose();
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm rounded-lg overflow-hidden shadow-lg bg-white">
      <div className="relative">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full bg-white/80 text-gray-700 hover:bg-gray-200 transition-colors z-10"
          aria-label="Close advertisement"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div onClick={handleAdClick} className="cursor-pointer">
          <img 
            src={ad.imageUrl} 
            alt={ad.title} 
            className="w-full h-auto" 
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/30 text-white text-xs p-1 text-center">
            Quảng cáo
          </div>
        </div>
      </div>
    </div>
  );
}
