import { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface OverlayAdProps {
  onClose: () => void;
}

interface AdData {
  id: number;
  title: string;
  imageUrl?: string;
  targetUrl: string;
  metadata?: Record<string, any>;
  provider?: string;
}

/**
 * Overlay Ad Component - Designed to handle both traditional ads and script-based ads
 * 
 * This component can:
 * 1. Display regular ads with images and click tracking
 * 2. Execute custom scripts from ad metadata
 * 3. Track clicks and views for analytics
 */
export function OverlayAd({ onClose }: OverlayAdProps) {
  const [ad, setAd] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(true);
  const scriptContainerRef = useRef<HTMLDivElement>(null);
  const scriptInserted = useRef(false);

  // Fetch overlay ad on mount
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

  // Handle script insertion for script-based ads
  useEffect(() => {
    // Only process if we have an ad with metadata and a script container
    if (!ad || !ad.metadata || !scriptContainerRef.current || scriptInserted.current) {
      return;
    }

    const container = scriptContainerRef.current;
    const metadata = ad.metadata;

    // Check if we have script content in metadata
    if (metadata.scriptContent) {
      try {
        // Insert script content
        container.innerHTML = metadata.scriptContent;
        
        // Execute any script tags
        const scriptTags = container.getElementsByTagName('script');
        Array.from(scriptTags).forEach(oldScript => {
          const newScript = document.createElement('script');
          
          // Copy attributes
          Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          
          // Copy content
          newScript.textContent = oldScript.textContent;
          
          // Replace script to trigger execution
          if (oldScript.parentNode) {
            oldScript.parentNode.replaceChild(newScript, oldScript);
          }
        });
        
        scriptInserted.current = true;
      } catch (error) {
        console.error('Failed to execute ad script:', error);
      }
    }

    // Cleanup function
    return () => {
      if (container) {
        container.innerHTML = '';
        scriptInserted.current = false;
      }
    };
  }, [ad]);

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

  // Check if this is a script-based ad (with metadata.scriptContent)
  const isScriptAd = ad.metadata && ad.metadata.scriptContent;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center justify-center">
      <div 
        className="relative max-w-xs w-full rounded-lg overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        title={ad.title}
        onClick={!isScriptAd ? handleAdClick : undefined}
      >
        {/* Close button */}
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering the parent click
            onClose();
          }}
          className="absolute top-1 right-1 p-1 rounded-full bg-white/80 text-gray-700 hover:bg-white transition-colors z-10"
          aria-label="Close advertisement"
        >
          <X className="h-4 w-4" />
        </button>
        
        {/* Container for script-based ads */}
        {isScriptAd ? (
          <div 
            ref={scriptContainerRef}
            className="w-full min-h-12"
            // Script will be injected here
          />
        ) : (
          <>
            {/* Standard ad content - display if not script-based */}
            {/* If image URL exists, show the image */}
            {ad.imageUrl && (
              <img 
                src={ad.imageUrl} 
                alt={ad.title} 
                className="w-full h-auto max-h-24" 
              />
            )}
            
            {/* If no image, show a simple text-based ad */}
            {!ad.imageUrl && (
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 text-white text-center">
                <div className="font-medium">{ad.title}</div>
                <div className="text-xs mt-1 opacity-80">Click để xem thêm</div>
              </div>
            )}
          </>
        )}
        
        {/* Ad indicator badge */}
        <div className="absolute top-0 left-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5">
          {ad.provider === 'google' ? 'Google Ads' : 'Quảng cáo'}
        </div>
      </div>
    </div>
  );
}
