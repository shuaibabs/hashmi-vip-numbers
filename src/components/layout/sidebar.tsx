
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
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/numbers', label: 'All Numbers', icon: Smartphone, adminOnly: false },
  { href: '/signup', label: 'Create User', icon: UserPlus, adminOnly: true },
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
  const { role, user, logout } = useAuth();

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
        {user && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border">
                <AvatarFallback>{user.displayName ? user.displayName.charAt(0) : user.email.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user.displayName || 'User'}</p>
                <p className="text-xs text-sidebar-foreground/70 truncate">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
