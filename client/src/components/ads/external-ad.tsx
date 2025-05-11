import React, { useEffect, useRef } from 'react';

// Interface for external ad configuration
export interface ExternalAdConfig {
  id: number;
  name: string;
  provider: string;
  position: string;
  scriptContent: string;
  containerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  height?: number;
  width?: number;
  displayOrder?: number;
  startDate?: string;
  endDate?: string;
  isMobileEnabled: boolean;
}

// Props for the ExternalAd component
interface ExternalAdProps {
  config: ExternalAdConfig;
  className?: string;
}

/**
 * ExternalAd component renders third-party ad scripts
 * It safely injects the script content into the DOM
 */
export function ExternalAd({ config, className = '' }: ExternalAdProps) {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptInserted = useRef(false);

  useEffect(() => {
    // Skip if no container ref or script was already inserted
    if (!adContainerRef.current || scriptInserted.current) return;
    
    // Create a sanitized container ID if none provided
    const containerId = config.containerId || `ad-container-${config.id}`;
    
    // Setup the ad container with proper ID and dimensions
    const container = adContainerRef.current;
    container.id = containerId;
    
    // Apply width and height if provided
    if (config.width) {
      container.style.width = `${config.width}px`;
    }
    
    if (config.height) {
      container.style.height = `${config.height}px`;
    }
    
    try {
      // First approach: Use innerHTML for well-formed HTML content
      // This is safer for actual ad code that contains HTML + JS
      container.innerHTML = config.scriptContent;
      
      // Find any script tags in the content and re-execute them
      // Scripts added via innerHTML don't execute automatically
      const scriptTags = container.getElementsByTagName('script');
      
      // Clone and replace each script tag to force execution
      Array.from(scriptTags).forEach(oldScript => {
        const newScript = document.createElement('script');
        
        // Copy all attributes from the old script to the new one
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        // Copy the content
        newScript.textContent = oldScript.textContent;
        
        // Replace the old script with the new one
        if (oldScript.parentNode) {
          oldScript.parentNode.replaceChild(newScript, oldScript);
        }
      });
      
      // Mark as inserted to prevent duplicate inserts
      scriptInserted.current = true;
    } catch (error) {
      console.error("Failed to insert external ad script:", error);
    }
    
    // Clean up function
    return () => {
      if (container) {
        container.innerHTML = '';
        scriptInserted.current = false;
      }
    };
  }, [config]);
  
  // Determine style classes based on provider and configuration
  let providerClass = '';
  switch (config.provider.toLowerCase()) {
    case 'google':
    case 'google adsense':
    case 'adsense':
      providerClass = 'google-ad';
      break;
    case 'facebook':
      providerClass = 'facebook-ad';
      break;
    default:
      providerClass = 'external-ad';
  }
  
  return (
    <div 
      ref={adContainerRef} 
      className={`ad-container ${providerClass} ${className}`}
      style={{
        width: config.width ? `${config.width}px` : '100%',
        height: config.height ? `${config.height}px` : 'auto',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      data-ad-provider={config.provider}
      data-ad-position={config.position}
    >
      {/* Ad will be injected here via script */}
    </div>
  );
}