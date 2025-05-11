import React, { useEffect, useRef } from 'react';
import { Advertisement } from '@shared/schema';

// Props for the ExternalAd component
interface ExternalAdProps {
  config: Advertisement;
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
    
    // Get metadata
    const metadata = config.metadata as Record<string, any> || {};
    
    // Create a sanitized container ID if none provided
    const containerId = metadata.containerId || `ad-container-${config.id}`;
    
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
      // Get script content from metadata
      const metadata = config.metadata as Record<string, any> || {};
      const scriptContent = metadata.scriptContent || '';
      
      // First approach: Use innerHTML for well-formed HTML content
      // This is safer for actual ad code that contains HTML + JS
      container.innerHTML = scriptContent;
      
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