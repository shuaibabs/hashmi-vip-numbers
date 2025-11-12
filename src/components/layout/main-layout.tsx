
"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { Spinner } from '@/components/ui/spinner';
import LoginPage from '@/app/login/page';
import { ProtectedLayout } from '@/components/layout/protected-layout';

export function MainLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  // Wait until Firebase has checked the auth state
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  // If user is not logged in, show the login page for all routes
  // The children will be the page trying to be accessed, we intercept it.
  if (!user) {
    if (typeof window !== 'undefined' && window.location.pathname === '/signup') {
        return <>{children}</>;
    }
    return <LoginPage />;
  }

  // If user is logged in, show the protected layout with sidebar and header
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
