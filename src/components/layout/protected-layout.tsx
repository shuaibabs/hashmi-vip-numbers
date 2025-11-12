
"use client";

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { AppHeader } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Spinner } from '../ui/spinner';

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

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
        <div className="flex">
            <AppSidebar />
            <div className="flex flex-col flex-1 min-h-screen">
                <AppHeader />
                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    </SidebarProvider>
  );
}
