import { useEffect } from 'react';

/**
 * Hook to set the document title
 * @param title The title to set
 * @param suffix Optional suffix to append to the title
 */
export function useTitle(title: string, suffix = ' | Novel Reading Platform') {
  useEffect(() => {
    // Save the original title to restore it when the component unmounts
    const originalTitle = document.title;
    
    // Set the new title
    document.title = `${title}${suffix}`;
    
    // Restore the original title when the component unmounts
    return () => {
      document.title = originalTitle;
    };
  }, [title, suffix]);
}