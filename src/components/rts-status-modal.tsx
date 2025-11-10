
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useApp } from '@/context/app-context';
import type { NumberRecord } from '@/lib/data';

const formSchema = z.object({
  status: z.enum(['RTS', 'Non-RTS']),
  rtsDate: z.date().optional(),
  note: z.string().optional(),
}).refine(data => {
  if (data.status === 'Non-RTS') {
    return !!data.rtsDate;
  }
  return true;
}, {
  message: 'RTS Date is required for Non-RTS status.',
  path: ['rtsDate'],
});

type RtsStatusModalProps = {
  isOpen: boolean;
  onClose: () => void;
  number: NumberRecord;
};

export function RtsStatusModal({ isOpen, onClose, number }: RtsStatusModalProps) {
  const { updateNumberStatus } = useApp();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: number.status,
      rtsDate: number.rtsDate ? new Date(number.rtsDate) : undefined,
      note: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateNumberStatus(number.id, values.status, values.rtsDate || null, values.note);
    onClose();
    form.reset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update RTS Status</DialogTitle>
          <DialogDescription>
            Update the status for mobile number <span className="font-semibold">{number.mobile}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={(value) => {
                      field.onChange(value);
                      if (value === 'RTS') {
                          form.setValue('rtsDate', undefined);
                          form.clearErrors('rtsDate');
                      }
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="RTS">RTS</SelectItem>
                      <SelectItem value="Non-RTS">Non-RTS</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch('status') === 'Non-RTS' && (
              <FormField
                control={form.control}
                name="rtsDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Schedule RTS Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Add Note (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add a note for this status change..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
