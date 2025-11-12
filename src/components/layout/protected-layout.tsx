"use client";

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { AppHeader } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth is not loading and there's no user, redirect to login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // While loading, or if no user (and redirecting), don't render children
  if (loading || !user) {
    // You can return a global loader here if you want
    return null;
  }

  return (
    <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-col flex-1">
            <AppHeader />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </div>
    </SidebarProvider>
  );
}
