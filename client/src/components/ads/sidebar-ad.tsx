import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface SidebarAdProps {
  position: 'sidebar_left' | 'sidebar_right';
}

interface AdData {
  id: number;
  title: string;
  imageUrl: string;
  targetUrl: string;
}

export function SidebarAd({ position }: SidebarAdProps) {
  const [ad, setAd] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSidebarAd() {
      try {
        setLoading(true);
        const response = await fetch(`/api/ads?position=${position}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${position} ad`);
        }
        
        const data = await response.json();
        if (data && data.length > 0) {
          // Get first active ad
          setAd(data[0]);
          // Record view
          await apiRequest('POST', `/api/ads/${data[0].id}/view`);
        }
      } catch (error) {
        console.error(`Error fetching ${position} ad:`, error);
      } finally {
        setLoading(false);
      }
    }

    fetchSidebarAd();
  }, [position]);

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
    <div className="sidebar-ad my-4">
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
