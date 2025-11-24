
"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigation } from '@/context/navigation-context';

export function useNavigationSpinner() {
  const pathname = usePathname();
  const { setIsNavigating } = useNavigation();

  useEffect(() => {
    // This effect runs when the new page component has mounted and the pathname changes.
    // We can be confident navigation has completed, so we hide the spinner.
    setIsNavigating(false);
  }, [pathname, setIsNavigating]);

  // This hook doesn't need to return anything. It just manages the side effect.
  return null;
}
