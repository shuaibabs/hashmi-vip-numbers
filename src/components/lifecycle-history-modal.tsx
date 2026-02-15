
"use client";

import { useMemo } from 'react';
import { useApp } from '@/context/app-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { TableSpinner } from './ui/spinner';

type LifecycleHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mobileNumber: string;
};

export function LifecycleHistoryModal({ isOpen, onClose, mobileNumber }: LifecycleHistoryModalProps) {
  const { activities, loading } = useApp();

  const lifecycle = useMemo(() => {
    if (!mobileNumber || loading) return [];
    return activities
      .filter(activity => activity.description.includes(mobileNumber))
      .sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());
  }, [activities, mobileNumber, loading]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Lifecycle History: {mobileNumber}</DialogTitle>
          <DialogDescription>
            A chronological log of all actions performed on this number.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="py-4 space-y-6">
            {loading && <TableSpinner colSpan={1} />}
            {!loading && lifecycle.length === 0 && (
                 <div className="text-center text-muted-foreground py-8">
                    No activity history found for this number.
                </div>
            )}
            {lifecycle.map((activity, index) => (
              <div key={activity.id}>
                <div className="flex items-start gap-4">
                    <Avatar className="h-9 w-9 border">
                        <AvatarFallback>{activity.employeeName?.[0].toUpperCase() || 'S'}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1 flex-1">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium leading-none">
                                <span className="font-semibold">{activity.employeeName}</span> {activity.action.toLowerCase()}
                            </p>
                             <p className="text-xs text-muted-foreground">
                                {format(activity.timestamp.toDate(), 'PPP p')}
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                </div>
                {index < lifecycle.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
