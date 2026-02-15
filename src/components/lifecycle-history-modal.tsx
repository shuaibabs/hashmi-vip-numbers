
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
import { TableSpinner } from './ui/spinner';
import {
  FilePlus2,
  Package,
  FilePen,
  Trash2,
  UserCog,
  DollarSign,
  Bookmark,
  LogIn,
  FileClock,
  History,
} from 'lucide-react';


type LifecycleHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mobileNumber: string;
};

const getActionIcon = (action: string) => {
  const lowerAction = action.toLowerCase();
  if (lowerAction.includes('added') || lowerAction.includes('created') || lowerAction.includes('imported')) return <FilePlus2 className="h-4 w-4" />;
  if (lowerAction.includes('sold')) return <DollarSign className="h-4 w-4 text-green-500" />;
  if (lowerAction.includes('updated')) return <FilePen className="h-4 w-4 text-blue-500" />;
  if (lowerAction.includes('deleted') || lowerAction.includes('cancelled')) return <Trash2 className="h-4 w-4 text-red-500" />;
  if (lowerAction.includes('assigned')) return <UserCog className="h-4 w-4" />;
  if (lowerAction.includes('pre-booked')) return <Bookmark className="h-4 w-4 text-amber-500" />;
  if (lowerAction.includes('checked in')) return <LogIn className="h-4 w-4" />;
  if (lowerAction.includes('rts')) return <FileClock className="h-4 w-4" />;
  return <History className="h-4 w-4" />;
};

export function LifecycleHistoryModal({ isOpen, onClose, mobileNumber }: LifecycleHistoryModalProps) {
  const { activities, loading } = useApp();

  const lifecycle = useMemo(() => {
    if (!mobileNumber || loading) return [];
    // Use a regex to match the whole number to avoid partial matches
    const mobileRegex = new RegExp(`\\b${mobileNumber}\\b`);
    return activities
      .filter(activity => mobileRegex.test(activity.description))
      .sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());
  }, [activities, mobileNumber, loading]);

  const processDescription = (description: string) => {
    // This pattern looks for descriptions of bulk actions, e.g., ": 10 numbers:"
    const bulkPattern = /: \d+ numbers?:/;
    const matchIndex = description.search(bulkPattern);
    
    // If it's a bulk action, truncate the description to keep it clean.
    if (matchIndex !== -1) {
      return description.substring(0, matchIndex);
    }
    
    return description;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Lifecycle History: {mobileNumber}</DialogTitle>
          <DialogDescription>
            A chronological log of all actions performed on this number.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4 -mr-4">
          <div className="relative py-4 pr-4">
             {/* The main timeline vertical bar */}
            {lifecycle.length > 0 && <div className="absolute left-5 top-2 h-full w-0.5 bg-border" />}

            {loading && <div className="flex justify-center items-center h-48"><TableSpinner colSpan={1} /></div>}
            
            {!loading && lifecycle.length === 0 && (
                 <div className="text-center text-muted-foreground py-16">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium">No History Found</h3>
                    <p className="mt-1 text-sm text-gray-500">No activities have been logged for this number yet.</p>
                </div>
            )}
            
            <div className="space-y-8">
              {lifecycle.map((activity, index) => (
                <div key={activity.id} className="relative flex items-start gap-4">
                  <div className="absolute left-5 top-2.5 -translate-x-1/2 h-full">
                     <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-secondary">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/20">
                            {getActionIcon(activity.action)}
                        </span>
                    </span>
                  </div>
                  <div className="pl-12 w-full">
                    <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold">
                            {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {activity.timestamp ? format(activity.timestamp.toDate(), 'PPP p') : 'Syncing...'}
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{processDescription(activity.description)}</p>
                    <p className="text-xs text-muted-foreground mt-1">by <span className="font-medium">{activity.employeeName}</span></p>
                  </div>
                </div>
              ))}
            </div>
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
