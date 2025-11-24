

"use client";

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function useNavigationSpinner() {
  const pathname = usePathname();
  const savedPathNameRef = useRef(pathname);
  const [navigationEnded, setNavigationEnded] = useState(false);

  useEffect(() => {
    if (savedPathNameRef.current !== pathname) {
      setNavigationEnded(true);
      savedPathNameRef.current = pathname;
      // Reset after a short delay
      const timer = setTimeout(() => setNavigationEnded(false), 50);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return navigationEnded;
}
