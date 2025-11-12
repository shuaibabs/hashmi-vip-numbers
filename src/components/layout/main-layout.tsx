
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
      return; // Do nothing while auth state is loading
    }

    const pathIsPublic = PUBLIC_PATHS.includes(pathname);

    // If user is logged in
    if (user) {
      // If they are on a public path (like /login), redirect them to the dashboard
      if (pathIsPublic) {
        router.push('/dashboard');
      }
      // Otherwise, they are on a protected path and can stay.
    } 
    // If user is not logged in
    else {
      // If they are on a protected path, redirect them to login
      if (!pathIsPublic) {
        router.push('/login');
      }
      // Otherwise, they are on a public path and can stay.
    }
  }, [user, loading, pathname, router]);

  // While loading, show a spinner to prevent flicker or premature rendering
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }
  
  // If a user is logged in and not on a public path, render the protected app layout
  if (user && !PUBLIC_PATHS.includes(pathname)) {
    return <ProtectedLayout>{children}</ProtectedLayout>;
  }

  // Otherwise, render the children (this will be the login/signup page for unauthenticated users)
  return <>{children}</>;
}
