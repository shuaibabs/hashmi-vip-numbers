
"use client";

import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { User, Calendar, PlusCircle, Check, Trash } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useState } from 'react';
import { AddReminderModal } from '@/components/add-reminder-modal';
import { useAuth } from '@/context/auth-context';
import { Reminder } from '@/lib/data';
import { MarkReminderDoneModal } from '@/components/mark-reminder-done-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function RemindersPage() {
  const { reminders, loading, deleteReminder } = useApp();
  const { role } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDoneModalOpen, setIsDoneModalOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);
  
  const sortedReminders = [...reminders].sort((a, b) => a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime())
                                        .sort((a, b) => (a.status === 'Pending' ? -1 : 1) - (b.status === 'Done' ? 1 : -1));

  if (loading) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <Spinner className="h-8 w-8" />
        </div>
    )
  }

  const handleMarkDoneClick = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setIsDoneModalOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (reminderToDelete) {
        deleteReminder(reminderToDelete.id);
        setReminderToDelete(null);
    }
  };

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
      {sortedReminders.length === 0 ? (
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
                    <div className="flex items-center gap-2">
                         <Badge variant={reminder.status === 'Done' ? 'secondary' : 'destructive'} className={reminder.status === 'Done' ? `bg-green-500/20 text-green-700` : `bg-yellow-500/20 text-yellow-700`}>
                            {reminder.status}
                        </Badge>
                        {role === 'admin' && reminder.status === 'Done' && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => setReminderToDelete(reminder)}>
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                {reminderToDelete?.id === reminder.id && (
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action will permanently delete the completed task "{reminderToDelete.taskName}".
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel onClick={() => setReminderToDelete(null)}>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                )}
                            </AlertDialog>
                        )}
                    </div>
                </div>
                <CardDescription className="pt-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <User className="mr-2 h-4 w-4" /> Assigned to: <span className="font-medium ml-1">{reminder.assignedTo}</span>
                    </div>
                </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" /> Due: <span className="font-medium ml-1">{format(reminder.dueDate.toDate(), 'PPP')}</span>
                    </div>
                    {reminder.notes && (
                        <div className="text-sm">
                            <p className="font-medium">Completion Note:</p>
                            <p className="text-muted-foreground whitespace-pre-wrap">{reminder.notes}</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                {reminder.status === 'Pending' && (
                    <Button className="w-full" onClick={() => handleMarkDoneClick(reminder)}>
                        <Check className="mr-2 h-4 w-4" />
                        Mark as Done
                    </Button>
                )}
                {reminder.status === 'Done' && (
                     <div className="text-sm text-muted-foreground w-full text-center">
                        {reminder.completionDate ? (
                            `Completed on ${format(reminder.completionDate.toDate(), 'PPP')}`
                        ) : (
                            "Task Completed"
                        )}
                    </div>
                )}
                </CardFooter>
            </Card>
            ))}
        </div>
      )}
      <AddReminderModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      {selectedReminder && (
        <MarkReminderDoneModal
            isOpen={isDoneModalOpen}
            onClose={() => setIsDoneModalOpen(false)}
            reminder={selectedReminder}
        />
      )}
    </>
  );
}
