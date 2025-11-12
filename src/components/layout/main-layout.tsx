
"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { ProtectedLayout } from '@/components/layout/protected-layout';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const PUBLIC_PATHS = ['/login', '/signup', '/'];

export function MainLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return; // Do nothing while loading
    }

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    // If user is logged in
    if (user) {
      // and is on a public path (like /login), redirect to dashboard
      if (isPublicPath) {
        router.push('/dashboard');
      }
    } 
    // If user is not logged in
    else {
      // and is on a protected path, redirect to login
      if (!isPublicPath) {
        router.push('/login');
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }
  
  if (user && !PUBLIC_PATHS.includes(pathname)) {
    return <ProtectedLayout>{children}</ProtectedLayout>;
  }

  // If user is not logged in, or if user is logged in but the redirect hasn't happened yet,
  // show the children (e.g., login page, or spinner during redirect flicker)
  return <>{children}</>;
}
