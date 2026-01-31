

"use client";

import { useRouter, usePathname } from 'next/navigation';
import { createContext, useContext, useState, type ReactNode, useCallback, useEffect } from 'react';
import { routeComponentMap, getLabelForRoute } from '@/lib/route-component-map';

const PUBLIC_PATHS = ['/login', '/'];

export type Tab = {
  id: string; // The href, e.g., '/dashboard'
  label: string;
  href: string;
  component: React.ComponentType;
};

type TabContextType = {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (href: string) => void;
  closeTab: (tabId: string) => void;
  isNavigating: boolean;
  // For compatibility with old useNavigation hook
  setIsNavigating: (isNavigating: boolean) => void;
  navigate: (href: string, currentPathname: string, options?: { replace?: boolean }) => void;
  back: () => void;
};

const TabContext = createContext<TabContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(true);

  const [tabs, setTabs] = useState<Tab[]>(() => {
    const component = routeComponentMap[pathname as keyof typeof routeComponentMap] || routeComponentMap['/dashboard'];
    const initialPath = component ? pathname : '/dashboard';
     return [{
        id: initialPath,
        href: initialPath,
        label: getLabelForRoute(initialPath),
        component: component || routeComponentMap['/dashboard'],
      }];
  });
  
  const [activeTabId, setActiveTabId] = useState<string | null>(pathname);
  const [tabHistory, setTabHistory] = useState<string[]>([pathname]);

  const openTab = useCallback((href: string) => {
    if (href === activeTabId) return;

    if (!routeComponentMap[href as keyof typeof routeComponentMap]) {
        setIsNavigating(true);
        router.push(href);
        return;
    }
    
    // If the tab is already open, just switch to it
    if (tabs.some(tab => tab.id === href)) {
      setActiveTabId(href);
      setTabHistory(prev => [...prev.filter(id => id !== href), href]);
      router.push(href);
      return;
    }

    // If it's a new tab, add it
    const component = routeComponentMap[href as keyof typeof routeComponentMap];
    if (component) {
        const newTab: Tab = {
            id: href,
            href: href,
            label: getLabelForRoute(href),
            component: component,
        };
        setTabs(prevTabs => [...prevTabs, newTab]);
        setActiveTabId(href);
        setTabHistory(prev => [...prev, href]);
        router.push(href);
    }
  }, [activeTabId, tabs, router]);

  const closeTab = useCallback((tabId: string) => {
    if (tabs.length <= 1) return;

    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);

    const newHistory = tabHistory.filter(id => id !== tabId);
    setTabHistory(newHistory);

    if (activeTabId === tabId) {
      const newActiveId = newHistory[newHistory.length - 1] || newTabs[0]?.id;
      if (newActiveId) {
        setActiveTabId(newActiveId);
        router.push(newActiveId);
      }
    }
  }, [tabs, activeTabId, router, tabHistory]);
  
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const navigate = useCallback((href: string, currentPathname: string, options?: { replace?: boolean }) => {
    const isTargetPublic = PUBLIC_PATHS.some(p => href.startsWith(p));

    if (isTargetPublic) {
        setIsNavigating(true);
        if (options?.replace) {
            router.replace(href);
        } else {
            router.push(href);
        }
    } else {
        openTab(href);
    }
  }, [openTab, router]);

  const back = useCallback(() => {
    router.back();
  }, [router]);
  
  const contextValue = {
    tabs,
    activeTabId,
    openTab,
    closeTab,
    isNavigating,
    setIsNavigating,
    navigate,
    back
  }

  return (
    <TabContext.Provider value={contextValue}>
      {children}
    </TabContext.Provider>
  );
}

export function useTabs() {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTabs must be used within a NavigationProvider');
  }
  return context;
}

export function useNavigation() {
    const context = useContext(TabContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return {
        isNavigating: context.isNavigating,
        setIsNavigating: context.setIsNavigating,
        navigate: context.navigate,
        back: context.back,
    }
}
