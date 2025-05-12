import { useEffect, useState, useRef } from 'react';
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
 * Invisible Overlay Ad Component
 * 
 * This component creates an invisible overlay that:
 * 1. Captures clicks anywhere on the page
 * 2. Executes any custom scripts from ad metadata
 * 3. Tracks clicks and redirects to ad target URL
 * 4. Doesn't display any visual elements to the user
 */
export function OverlayAd({ onClose }: OverlayAdProps) {
  const [ad, setAd] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(true);
  const scriptContainerRef = useRef<HTMLDivElement>(null);
  const scriptInserted = useRef(false);
  
  // Close overlay after some time automatically
  useEffect(() => {
    // Auto-close after 30 seconds if not interacted with
    const closeTimer = setTimeout(() => {
      onClose();
    }, 30000);
    
    return () => clearTimeout(closeTimer);
  }, [onClose]);

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

  const handleAdClick = async (e: React.MouseEvent) => {
    // Only capture clicks directly on the overlay itself
    if (e.target === e.currentTarget && ad) {
      try {
        // Record click
        await apiRequest('POST', `/api/ads/${ad.id}/click`);
        // Open ad target in new tab
        window.open(ad.targetUrl, '_blank');
        // Close after click redirects
        onClose();
      } catch (error) {
        console.error('Error recording ad click:', error);
      }
    }
  };

  if (loading || !ad) {
    return null; // Don't show anything while loading or if no ad
  }

  // Check if this is a script-based ad
  const isScriptAd = ad.metadata && ad.metadata.scriptContent;

  return (
    <>
      {/* Completely invisible overlay that captures clicks */}
      <div 
        className="fixed inset-0 z-40 cursor-default"
        onClick={handleAdClick}
        style={{ backgroundColor: 'transparent' }}
        aria-hidden="true"
      >
        {/* Hidden container for script execution only */}
        {isScriptAd && (
          <div 
            ref={scriptContainerRef}
            className="sr-only"
            aria-hidden="true"
          />
        )}
      </div>
    </>
  );
}
