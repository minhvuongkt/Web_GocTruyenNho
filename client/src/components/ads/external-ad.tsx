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
 * For Google AdSense, it creates a proper container with required attributes
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
      const scriptContent = metadata.scriptContent || '';
      
      // For Google AdSense ads, special handling to ensure proper verification
      if (config.provider === 'google' && metadata.adUnitId) {
        // Create AdSense script tag and add to head if not already present
        if (!document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
          const adsenseScript = document.createElement('script');
          adsenseScript.async = true;
          adsenseScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${metadata.adUnitId}`;
          adsenseScript.crossOrigin = "anonymous";
          document.head.appendChild(adsenseScript);
        }
        
        // Clear container first
        container.innerHTML = '';
        
        // Create ins element for AdSense
        const insElement = document.createElement('ins');
        insElement.className = 'adsbygoogle';
        insElement.style.display = 'block';
        insElement.dataset.adClient = metadata.adUnitId;
        insElement.dataset.adSlot = metadata.slotId || '';
        insElement.dataset.adFormat = metadata.format || 'auto';
        insElement.dataset.fullWidthResponsive = 'true';
        
        // Add ins element to container
        container.appendChild(insElement);
        
        // Create push script
        const pushScript = document.createElement('script');
        pushScript.textContent = '(adsbygoogle = window.adsbygoogle || []).push({});';
        container.appendChild(pushScript);
      } else {
        // For other ad providers, use the standard approach
        // First approach: Use innerHTML for well-formed HTML content
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
      }
      
      // Mark as inserted to prevent duplicate inserts
      scriptInserted.current = true;
    } catch (error) {
      console.error("Failed to insert external ad script:", error);
      // Add fallback message for errors
      container.innerHTML = `<div style="width: 100%; height: 100%; display: flex; 
                              justify-content: center; align-items: center; 
                              border: 1px dashed #ccc; padding: 8px; text-align: center; 
                              font-size: 12px; color: #666;">
                              Ad could not be loaded
                             </div>`;
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
  switch (config.provider) {
    case 'google':
      providerClass = 'google-ad';
      break;
    case 'facebook':
      providerClass = 'facebook-ad';
      break;
    default:
      providerClass = 'external-ad';
  }
  
  // Determine classes based on position
  const positionClasses = (() => {
    if (['top', 'bottom', 'left', 'right'].includes(config.position)) {
      return 'sticky-ad'; // For continuous display
    }
    return '';
  })();
  
  return (
    <div 
      ref={adContainerRef} 
      className={`ad-container ${providerClass} ${positionClasses} ${className}`}
      style={{
        width: config.width ? `${config.width}px` : '100%',
        height: config.height ? `${config.height}px` : 'auto',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '0 auto',
        // Add sticky positioning for top/bottom/side ads
        position: ['top', 'bottom', 'left', 'right'].includes(config.position) ? 'sticky' : 'relative',
        top: config.position === 'top' ? '0' : 'auto',
        bottom: config.position === 'bottom' ? '0' : 'auto',
        left: config.position === 'left' ? '0' : 'auto',
        right: config.position === 'right' ? '0' : 'auto',
        zIndex: ['top', 'bottom', 'left', 'right'].includes(config.position) ? '10' : 'auto'
      }}
      data-ad-provider={config.provider}
      data-ad-position={config.position}
    >
      {/* Ad will be injected here via script */}
    </div>
  );
}