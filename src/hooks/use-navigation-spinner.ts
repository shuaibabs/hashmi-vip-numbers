
"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useNavigationSpinner() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // This effect runs on component mount and whenever the pathname changes.
    // We only want to show the spinner for actual navigation events, not the initial load.
    // So we use a variable to track if this is the first render.
    let isInitialLoad = true;

    // We can't directly check if it's the first run of useEffect easily,
    // so we use a little trick with a timeout.
    const timer = setTimeout(() => {
      isInitialLoad = false;
    }, 0);

    return () => clearTimeout(timer);
  }, []);


  useEffect(() => {
    // Show spinner on pathname change
    setIsNavigating(true);

    // Hide spinner after a short delay to allow the new page to render
    const timer = setTimeout(() => {
        setIsNavigating(false);
    }, 300); // Adjust delay as needed

    return () => clearTimeout(timer);
  }, [pathname]);

  // Only return true if on the client and navigating
  return isClient && isNavigating;
}
