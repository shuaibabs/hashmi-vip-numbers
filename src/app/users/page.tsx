
"use client";

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/context/auth-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Trash, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function ManageUsersPage() {
  const { users: allUsers, deleteUser, loading } = useApp();
  const { user: currentUser, role: adminRole } = useAuth();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  if (adminRole !== 'admin') {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>You do not have permission to manage users.</AlertDescription>
        </Alert>
        <Button variant="link" asChild className="mt-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  const handleConfirmDelete = () => {
    if (userToDelete) {
        deleteUser(userToDelete.uid);
        setUserToDelete(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Manage Users"
        description="View and remove user accounts from the system."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allUsers.map((user) => (
          <Card key={user.uid}>
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                    <AvatarFallback>{user.displayName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                    <CardTitle className="text-lg">{user.displayName}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className='capitalize'>{user.role}</Badge>
            </CardContent>
            <CardFooter>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            disabled={user.uid === currentUser?.uid}
                            onClick={() => setUserToDelete(user)}
                        >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete User
                        </Button>
                    </AlertDialogTrigger>
                     {userToDelete?.uid === user.uid && (
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the user account for <span className='font-semibold'>{userToDelete.displayName}</span> and remove all associated data.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleConfirmDelete}>
                                    Yes, delete user
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    )}
                </AlertDialog>

            </CardFooter>
          </Card>
        ))}
      </div>
       {allUsers.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No other users found.</p>
          </CardContent>
        </Card>
       )}
        <AlertDialog open={!!userToDelete}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the user account for <span className='font-semibold'>{userToDelete?.displayName}</span> and remove all associated data from the database. The user will no longer be able to log in.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete}>
                        Yes, delete user
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

