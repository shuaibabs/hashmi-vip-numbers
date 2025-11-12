
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
    // Keep loading if Firebase services are not ready.
    if (!auth || !db) {
      setLoading(true);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // If a user is logged in, always assume they might exist in Firestore.
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            // User exists, set their role from the document.
            setRole(userDoc.data().role);
          } else {
            // This logic is for auto-promoting the VERY FIRST user to admin.
            // This should ideally happen on sign-up, but we place it here
            // as a safeguard for the initial seeding process.
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
          // Finally, set the user object itself.
          setUser(firebaseUser);
        } else {
          // User is logged out.
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Error during authentication state change:", error);
        setUser(null);
        setRole(null);
      } finally {
        // This is crucial: set loading to false after all auth logic is complete.
        setLoading(false);
      }
    });

    // Cleanup the subscription on component unmount
    return () => unsubscribe();
  }, [auth, db]); // Rerun effect if auth or db instances change

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
