"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { ProtectedLayout } from '@/components/layout/protected-layout';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function MainLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && user && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
      router.push('/dashboard');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (user) {
    // If the user is logged in but still on a public page, show a spinner while redirecting.
    if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
       return (
         <div className="flex h-screen w-screen items-center justify-center">
            <Spinner className="h-10 w-10" />
        </div>
       );
    }
    // Otherwise, show the protected part of the app.
    return <ProtectedLayout>{children}</ProtectedLayout>;
  }

  // If there's no user, and they are not on a public page, this part of the logic
  // is handled by ProtectedLayout now, but we only render the children if it's a public path.
  if (!user && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
    return <>{children}</>;
  }
  
  // As a fallback, if no user is found and they are trying to access a protected route,
  // we can redirect them to login from here too.
  if (!user && pathname !== '/login' && pathname !== '/signup' && pathname !== '/') {
    router.push('/login');
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <Spinner className="h-10 w-10" />
        </div>
    );
  }

  return <>{children}</>;
}
