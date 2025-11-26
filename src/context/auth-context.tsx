
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import type { User } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

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

  useEffect(() => {
    if (!auth || !db) {
      setLoading(true);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        const isLoggingIn = !user && firebaseUser; // Transition from null to a user
        
        if (firebaseUser) {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setRole(userDoc.data().role);
          } else {
            // This logic runs if it's a user's first-ever sign-in to this app.
            const usersCollection = collection(db, "users");
            const usersSnap = await getDocs(usersCollection);
            const isFirstUser = usersSnap.empty;
            
            const newRole = isFirstUser ? 'admin' : 'employee';
            const newUser: User = {
              uid: firebaseUser.uid,
              id: firebaseUser.uid,
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
      } catch (error: any) {
        console.error("Error during authentication state change:", error);
        
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `users/${firebaseUser?.uid || 'unknown'}`,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        }

        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
