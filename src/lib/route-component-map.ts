
import DashboardPage from '@/app/dashboard/page';
import AllNumbersPage from '@/app/numbers/page';
import PostpaidPage from '@/app/postpaid/page';
import PreBookingPage from '@/app/pre-booking/page';
import PartnersPage from '@/app/partners/page';
import SignupPage from '@/app/signup/page';
import ManageUsersPage from '@/app/users/page';
import SimLocationsPage from '@/app/sim-locations/page';
import SalesPage from '@/app/sales/page';
import ManageSalesPage from '@/app/manage-sales/page';
import PortOutPage from '@/app/port-out/page';
import DealerPurchasesPage from '@/app/dealer-purchases/page';
import RemindersPage from '@/app/reminders/page';
import CocpPage from '@/app/cocp/page';
import ActivitiesPage from '@/app/activities/page';
import ImportExportPage from '@/app/import-export/page';

export const routeComponentMap = {
  '/dashboard': DashboardPage,
  '/numbers': AllNumbersPage,
  '/postpaid': PostpaidPage,
  '/pre-booking': PreBookingPage,
  '/partners': PartnersPage,
  '/signup': SignupPage,
  '/users': ManageUsersPage,
  '/sim-locations': SimLocationsPage,
  '/sales': SalesPage,
  '/manage-sales': ManageSalesPage,
  '/port-out': PortOutPage,
  '/dealer-purchases': DealerPurchasesPage,
  '/reminders': RemindersPage,
  '/cocp': CocpPage,
  '/activities': ActivitiesPage,
  '/import-export': ImportExportPage,
};

const routeLabels: { [key: string]: string } = {
  '/dashboard': 'Dashboard',
  '/numbers': 'All Numbers',
  '/postpaid': 'Postpaid Numbers',
  '/pre-booking': 'Pre-Booking',
  '/partners': 'Partners',
  '/signup': 'Create User',
  '/users': 'Manage Users',
  '/sim-locations': 'SIM Locations',
  '/sales': 'Sales',
  '/manage-sales': 'Manage Sales',
  '/port-out': 'Port Out',
  '/dealer-purchases': 'Dealer Purchases',
  '/reminders': 'Work Reminders',
  '/cocp': 'COCP',
  '/activities': 'Activities',
  '/import-export': 'Import / Export',
};

export function getLabelForRoute(href: string): string {
    return routeLabels[href] || 'New Tab';
}
