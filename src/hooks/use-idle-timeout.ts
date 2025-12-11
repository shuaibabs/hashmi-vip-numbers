
"use client";

import { useEffect, useRef, useCallback } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useFirebaseApp } from '@/firebase';
import { useNavigation } from '@/context/navigation-context';
import { usePathname } from 'next/navigation';
import { useToast } from './use-toast';
import { useAuth } from '@/context/auth-context';

export const useIdleTimeout = (timeout: number) => {
    const app = useFirebaseApp();
    const { user } = useAuth();
    const { navigate } = useNavigation();
    const pathname = usePathname();
    const { toast } = useToast();
    const timer = useRef<NodeJS.Timeout | null>(null);

    const handleLogout = useCallback(async () => {
        if (!app || !user) return;
        const auth = getAuth(app);
        
        await signOut(auth);

        toast({
            title: "Session Expired",
            description: "You have been logged out due to inactivity.",
        });

        navigate('/login', pathname, { replace: true });

    }, [app, user, navigate, pathname, toast]);

    const resetTimer = useCallback(() => {
        if (timer.current) {
            clearTimeout(timer.current);
        }
        timer.current = setTimeout(handleLogout, timeout);
    }, [handleLogout, timeout]);

    useEffect(() => {
        if (!user) return;

        const events = ['mousemove', 'keydown', 'click', 'touchstart'];

        const handleActivity = () => {
            resetTimer();
        };

        events.forEach(event => window.addEventListener(event, handleActivity));
        
        resetTimer();

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
            if (timer.current) {
                clearTimeout(timer.current);
            }
        };
    }, [resetTimer, user]);
};
