import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface BannerAdProps {
  className?: string;
}

interface AdData {
  id: number;
  title: string;
  imageUrl: string;
  targetUrl: string;
}

export function BannerAd({ className = '' }: BannerAdProps) {
  const [ad, setAd] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBannerAd() {
      try {
        setLoading(true);
        const response = await fetch('/api/ads?position=banner');
        if (!response.ok) {
          throw new Error('Failed to fetch banner ad');
        }
        
        const data = await response.json();
        if (data && data.length > 0) {
          // Get first active banner ad
          setAd(data[0]);
          // Record view
          await apiRequest('POST', `/api/ads/${data[0].id}/view`);
        }
      } catch (error) {
        console.error('Error fetching banner ad:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBannerAd();
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

  if (loading || !ad) {
    return null; // Don't show anything while loading or if no ad
  }

  return (
    <div className={`banner-ad w-full my-4 ${className}`}>
      <div 
        onClick={handleAdClick} 
        className="cursor-pointer relative rounded-lg overflow-hidden shadow-md border border-gray-200"
      >
        <img 
          src={ad.imageUrl} 
          alt={ad.title} 
          className="w-full h-auto object-cover" 
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black/30 text-white text-xs p-1 text-center">
          Quảng cáo
        </div>
      </div>
    </div>
  );
}
