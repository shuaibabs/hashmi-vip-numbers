"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { Spinner } from '@/components/ui/spinner';
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

  // If user is not logged in, render the public page (e.g. login, signup)
  if (!user) {
    return <>{children}</>;
  }

  // If user is logged in, wrap the page content in the protected layout
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
