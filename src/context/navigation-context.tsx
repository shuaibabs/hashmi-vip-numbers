
"use client";

import { useRouter, usePathname } from 'next/navigation';
import { createContext, useContext, useState, type ReactNode, useCallback, useEffect } from 'react';

type NavigationContextType = {
  isNavigating: boolean;
  setIsNavigating: (isNavigating: boolean) => void;
  navigate: (href: string, options?: { replace?: boolean }) => void;
  back: () => void;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Hide spinner whenever the path changes (i.e., navigation completes)
    setIsNavigating(false);
  }, [pathname]);

  const navigate = useCallback((href: string, options?: { replace?: boolean }) => {
    // Show spinner immediately
    setIsNavigating(true);
    if (options?.replace) {
        router.replace(href);
    } else {
        router.push(href);
    }
  }, [router]);

  const back = useCallback(() => {
    setIsNavigating(true);
    router.back();
  }, [router]);
  

  return (
    <NavigationContext.Provider value={{ isNavigating, setIsNavigating, navigate, back }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
