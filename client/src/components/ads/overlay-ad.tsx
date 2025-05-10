import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface OverlayAdProps {
  onClose: () => void;
}

interface AdData {
  id: number;
  title: string;
  imageUrl: string;
  targetUrl: string;
}

export function OverlayAd({ onClose }: OverlayAdProps) {
  const [ad, setAd] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOverlayAd() {
      try {
        setLoading(true);
        const response = await fetch('/api/ads?position=overlay');
        if (!response.ok) {
          throw new Error('Failed to fetch overlay ad');
        }
        
        const data = await response.json();
        if (data && data.length > 0) {
          // Get first active overlay ad
          setAd(data[0]);
          // Record view
          await apiRequest('POST', `/api/ads/${data[0].id}/view`);
          // Record display time
          await apiRequest('POST', `/api/ads/${data[0].id}/display`);
        }
      } catch (error) {
        console.error('Error fetching overlay ad:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOverlayAd();
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
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-3xl w-full bg-white rounded-lg overflow-hidden shadow-xl">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full bg-white text-gray-700 hover:bg-gray-200 transition-colors z-10"
          aria-label="Close advertisement"
        >
          <X className="h-6 w-6" />
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
