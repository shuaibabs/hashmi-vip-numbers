"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import type { User } from '@/lib/data';

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

  useEffect(() => {
    // Only proceed if Firebase services are initialized
    if (!auth || !db) {
      // Keep loading if services are not ready
      setLoading(true);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setRole(userDoc.data().role);
          } else {
            // This logic handles the very first admin user creation
            const usersCollection = collection(db, "users");
            const usersSnap = await getDocs(usersCollection);
            const isFirstUser = usersSnap.empty;
            
            const newRole = isFirstUser ? 'admin' : 'employee';
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email || 'New User',
              role: newRole,
            };
            await setDoc(userDocRef, newUser);
            setRole(newRole);
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
        // Crucially, set loading to false after checking auth state
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

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
