
"use client";

import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Smartphone,
  RadioTower,
  MapPin,
  DollarSign,
  ClipboardList,
  History,
  FileOutput,
  Signal,
  ShoppingCart,
  LogOut,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import Link from 'next/link';
import { Separator } from '../ui/separator';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/numbers', label: 'All Numbers', icon: Smartphone, adminOnly: false },
  { href: '/activation', label: 'Activation', icon: Signal, adminOnly: false },
  { href: '/sim-locations', label: 'SIM Locations', icon: MapPin, adminOnly: false },
  { href: '/sales', label: 'Sales', icon: DollarSign, adminOnly: false },
  { href: '/port-out', label: 'Port Out', icon: LogOut, adminOnly: false },
  { href: '/dealer-purchases', label: 'Dealer Purchases', icon: ShoppingCart, adminOnly: false },
  { href: '/reminders', label: 'Work Reminders', icon: ClipboardList, adminOnly: false },
  { href: '/cocp', label: 'COCP', icon: RadioTower, adminOnly: false },
  { href: '/activities', label: 'Employee Activities', icon: History, adminOnly: true },
  { href: '/import-export', label: 'Import / Export', icon: FileOutput, adminOnly: false },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { role } = useApp();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            <RadioTower className="w-8 h-8 text-primary"/>
            <h1 className="text-xl font-bold text-sidebar-foreground">NumberFlow</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) =>
            (!item.adminOnly || role === 'admin') && (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    as="a"
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Separator className="my-2 bg-sidebar-border" />
        <div className="text-xs text-sidebar-foreground/50 p-4 text-center">
            © {new Date().getFullYear()} NumberFlow Inc.
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
