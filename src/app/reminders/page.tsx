"use client";

import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { User, Calendar, PlusCircle } from 'lucide-react';
import { TableSpinner } from '@/components/ui/spinner';
import { useState } from 'react';
import { AddReminderModal } from '@/components/add-reminder-modal';
import { useAuth } from '@/context/auth-context';

export default function RemindersPage() {
  const { reminders, markReminderDone, loading } = useApp();
  const { role } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const sortedReminders = [...reminders].sort((a, b) => a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime())
                                        .sort((a, b) => (a.status === 'Upload Pending' ? -1 : 1) - (b.status === 'ACT Done' ? -1 : 1));

  if (loading) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <TableSpinner colSpan={1} />
        </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Work Reminders"
        description="Manage and track your assigned tasks and reminders."
      >
        {role === 'admin' && (
          <Button onClick={() => setIsAddModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4"/>
            New Reminder
          </Button>
        )}
      </PageHeader>
      {sortedReminders.length === 0 && !loading ? (
        <Card>
            <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No reminders found.</p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedReminders.map(reminder => (
            <Card key={reminder.id} className="flex flex-col">
                <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle>{reminder.taskName}</CardTitle>
                    <Badge variant={reminder.status === 'ACT Done' ? 'secondary' : 'destructive'} className={reminder.status === 'ACT Done' ? `bg-green-500/20 text-green-700` : `bg-yellow-500/20 text-yellow-700`}>
                        {reminder.status}
                    </Badge>
                </div>
                <CardDescription className="pt-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <User className="mr-2 h-4 w-4" /> Assigned to: <span className="font-medium ml-1">{reminder.assignedTo}</span>
                    </div>
                </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" /> Due: <span className="font-medium ml-1">{format(reminder.dueDate.toDate(), 'PPP')}</span>
                </div>
                </CardContent>
                <CardFooter>
                {reminder.status === 'Upload Pending' && (
                    <Button className="w-full" onClick={() => markReminderDone(reminder.id)}>
                    Mark as Done
                    </Button>
                )}
                {reminder.status === 'ACT Done' && (
                    <p className="w-full text-center text-sm text-green-600 font-medium">Task Completed</p>
                )}
                </CardFooter>
            </Card>
            ))}
        </div>
      )}
      <AddReminderModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </>
  );
}
