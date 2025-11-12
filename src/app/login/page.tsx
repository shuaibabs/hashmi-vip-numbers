
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth as useFirebaseAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RadioTower } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Spinner } from '@/components/ui/spinner';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginPage() {
  const firebaseAuth = useFirebaseAuth();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: 'mhshuaibabbasi@gmail.com',
      password: 'Admin@1234',
    },
  });
  
  // If the user is already authenticated, the main layout will handle redirection.
  // We can show a spinner here while that happens.
  if (authLoading || user) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <Spinner className="h-10 w-10" />
        </div>
    );
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    setError(null);
    if (!firebaseAuth) {
      setError("Auth service is not available.");
      setLoading(false);
      return;
    }
    
    signInWithEmailAndPassword(firebaseAuth, values.email, values.password)
      .catch((err: any) => {
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(err.message || 'An unexpected error occurred.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
                <RadioTower className="w-10 h-10 text-primary" />
            </div>
          <CardTitle className="text-2xl">Welcome to NumberFlow</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter className="flex flex-col items-center justify-center text-sm">
            <p className="text-muted-foreground">
                Only admins can create new users.
            </p>
             <Button variant="link" asChild className="px-0">
                <Link href="/signup">
                    Go to user creation page
                </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
