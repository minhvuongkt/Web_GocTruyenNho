import React, { useEffect, useRef } from 'react';
import { ExternalAdConfig } from './ad-context';
import { cn } from '@/lib/utils';

interface ExternalAdProps {
  config: ExternalAdConfig;
  className?: string;
}

/**
 * Component that renders third-party ad scripts from providers like Google AdSense
 */
export function ExternalAd({ config, className }: ExternalAdProps) {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adContainerRef.current || !config.scriptContent) return;

    // If there's a specific container ID required, set it on the div
    if (config.containerId) {
      adContainerRef.current.id = config.containerId;
    }

    // Create a script element
    const script = document.createElement('script');
    
    // Use script content from the configuration
    script.innerHTML = config.scriptContent;
    
    // For some third-party scripts, you may need these attributes
    // for security and proper functioning
    script.async = true;
    
    // Depending on provider, set different attributes
    if (config.provider === 'google') {
      script.setAttribute('data-ad-client', 'google-adsense');
    } else if (config.provider === 'facebook') {
      script.setAttribute('data-ad-client', 'facebook-ads');
    }
    
    // Add the script to the container
    adContainerRef.current.appendChild(script);

    // Cleanup function to remove scripts when unmounting
    return () => {
      if (adContainerRef.current) {
        // Remove all child nodes (scripts)
        while (adContainerRef.current.firstChild) {
          adContainerRef.current.removeChild(adContainerRef.current.firstChild);
        }
      }
    };
  }, [config]);

  // Apply different classes based on ad position
  const positionClasses = {
    top: 'w-full h-[90px] mb-4',
    bottom: 'w-full h-[90px] mt-4',
    left: 'w-[160px] h-[600px] mr-4',
    right: 'w-[160px] h-[600px] ml-4',
    popup: 'w-[300px] h-[250px]',
    overlay: 'w-full h-full bg-black/30 backdrop-blur-sm',
    custom: '', // Custom size will be defined by the script itself
  };

  return (
    <div
      ref={adContainerRef}
      className={cn(
        'external-ad',
        'border border-border rounded overflow-hidden relative',
        positionClasses[config.position],
        className
      )}
      data-ad-provider={config.provider}
      data-ad-position={config.position}
    >
      {/* Container for the external ad script */}
      <div className="text-xs text-muted-foreground absolute top-0 right-0 bg-background px-1 opacity-50">
        Ad by {config.provider}
      </div>
    </div>
  );
}