"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { ProtectedLayout } from '@/components/layout/protected-layout';

export function MainLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (user) {
    return <ProtectedLayout>{children}</ProtectedLayout>;
  }

  return <>{children}</>;
}
