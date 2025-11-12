
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode, useRef } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import type { User } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  user: FirebaseUser | null;
  role: 'admin' | 'employee' | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useFirebaseAuth();
  const db = useFirestore();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<'admin' | 'employee' | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const wasInitiallyLoading = useRef(true);

  useEffect(() => {
    if (!auth || !db) {
      if (wasInitiallyLoading.current) {
        setLoading(true);
      }
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        const isLoggingIn = !user && firebaseUser; // Transition from null to a user
        
        if (firebaseUser) {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setRole(userDoc.data().role);
          } else {
            const usersCollection = collection(db, "users");
            const usersSnap = await getDocs(usersCollection);
            const isFirstUser = usersSnap.empty;
            
            const newRole = isFirstUser ? 'admin' : 'employee';
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
              role: newRole,
            };
            await setDoc(userDocRef, newUser);
            setRole(newRole);
          }
          setUser(firebaseUser);

          if (isLoggingIn) {
             toast({
              title: "Logged In Successfully",
              description: `Welcome back, ${firebaseUser.displayName || firebaseUser.email}!`,
            });
          }
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Error during authentication state change:", error);
        setUser(null);
        setRole(null);
      } finally {
        if (wasInitiallyLoading.current) {
            setLoading(false);
            wasInitiallyLoading.current = false;
        }
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, db, toast]);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
