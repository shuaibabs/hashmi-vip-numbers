import type { ReactNode } from 'react';
import { AppSidebar } from './sidebar';
import { AppHeader } from './header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
