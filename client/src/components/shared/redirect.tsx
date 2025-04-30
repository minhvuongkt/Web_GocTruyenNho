import { useEffect } from "react";
import { useLocation } from "wouter";
import { normalizeId, hashId } from "@/lib/hashUtils";

interface RedirectProps {
  from: string;
  to: string;
  params?: Record<string, string | number>;
}

/**
 * A component that handles redirects from old URL patterns to new ones
 * 
 * This is particularly useful for maintaining backwards compatibility 
 * when changing URL structures, such as from /manga/:id to /truyen/:id
 */
export function Redirect({ from, to, params = {} }: RedirectProps) {
  const [_, setLocation] = useLocation();
  
  useEffect(() => {
    // Process the "to" path to replace parameters from "params"
    let targetPath = to;
    
    // Replace parameters with their values from params object
    Object.entries(params).forEach(([key, value]) => {
      // If the value is a numeric ID, hash it for the new URL format
      const paramValue = typeof value === 'number' ? hashId(value) : value;
      targetPath = targetPath.replace(`:${key}`, String(paramValue));
    });
    
    // Redirect to the processed path
    setLocation(targetPath);
  }, [from, to, params, setLocation]);
  
  // This component doesn't render anything, it just handles the redirect
  return null;
}

export default Redirect;