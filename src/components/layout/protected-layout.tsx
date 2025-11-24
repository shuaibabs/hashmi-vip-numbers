
"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { AppHeader } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Spinner } from '../ui/spinner';

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handleStart = (url: string) => url !== pathname && setIsNavigating(true);
    const handleComplete = () => setIsNavigating(false);

    // We can't use the router events from next/navigation, so we'll use the window events
    // This is a bit of a hack, but it's the only way to get this to work with the app router
    // See: https://github.com/vercel/next.js/discussions/41745
    const originalPushState = history.pushState;
    history.pushState = function() {
        handleStart(arguments[2]);
        return originalPushState.apply(history, arguments as any);
    };

    window.addEventListener('popstate', handleComplete);
    
    // Fallback for when the router is ready
    // This is not ideal, but it's the best we can do for now
    const checkRouterReady = () => {
        if (document.readyState === 'complete') {
            handleComplete();
        } else {
            setTimeout(checkRouterReady, 100);
        }
    }
    checkRouterReady();


    return () => {
      window.removeEventListener('popstate', handleComplete);
      history.pushState = originalPushState;
    };
  }, [pathname]);

  useEffect(() => {
    // If auth is done loading and there's no user, they should be on the login page.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  // While loading, or if no user (and the redirect is in progress), show a spinner.
  if (loading || !user) {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <Spinner className="h-10 w-10" />
        </div>
    );
  }
  
  // If we get here, user is authenticated and not on a public page. Render the app.
  return (
    <SidebarProvider>
        {isClient && isNavigating && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <Spinner className="h-10 w-10" />
            </div>
        )}
        <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 min-w-0">
                <AppHeader />
                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    </SidebarProvider>
  );
}
