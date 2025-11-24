
"use client";

import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
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
  Users,
  Database,
} from 'lucide-react';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { useFirebaseApp } from '@/firebase';
import { useAuth } from '@/context/auth-context';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/numbers', label: 'All Numbers', icon: Smartphone, adminOnly: false },
  { href: '/signup', label: 'Create User', icon: UserPlus, adminOnly: true },
  { href: '/users', label: 'Manage Users', icon: Users, adminOnly: true },
  { href: '/sim-locations', label: 'SIM Locations', icon: MapPin, adminOnly: false },
  { href: '/sales', label: 'Sales', icon: DollarSign, adminOnly: false },
  { href: '/port-out', label: 'Port Out', icon: LogOut, adminOnly: false },
  { href: '/dealer-purchases', label: 'Dealer Purchases', icon: ShoppingCart, adminOnly: false },
  { href: '/reminders', label: 'Work Reminders', icon: ClipboardList, adminOnly: false },
  { href: '/cocp', label: 'COCP', icon: RadioTower, adminOnly: false },
  { href: '/activities', label: 'Activities', icon: History, adminOnly: false },
  { href: '/import-export', label: 'Import / Export', icon: FileOutput, adminOnly: false },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { role, user } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();
  
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            <RadioTower className="w-8 h-8 text-primary"/>
            <h1 className="text-xl font-bold text-sidebar-foreground">Hashmi VIP Numbers</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            if (item.devOnly && !isDevelopment) return null;
            
            return (!item.adminOnly || role === 'admin') && (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref onClick={handleLinkClick}>
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
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Separator className="my-2 bg-sidebar-border" />
         <div className="p-4 text-center text-xs text-sidebar-foreground/70 space-y-2 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center justify-center gap-2">
                <span>Developed by</span>
                 <a href="https://trionex.digital" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-semibold text-sidebar-foreground/90 hover:text-sidebar-foreground transition-colors">
                    <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.236L19.95 8.718L12 13.2L4.05 8.718L12 4.236ZM13 14.3V19.8L20 16V10.5L13 14.3ZM11 14.3L4 10.5V16L11 19.8V14.3Z"
                            fill="currentColor"
                        />
                    </svg>
                    <span>Trionex Digital</span>
                 </a>
            </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

