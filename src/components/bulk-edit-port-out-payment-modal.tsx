
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/app-context';
import type { PortOutRecord } from '@/lib/data';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import React from 'react';

const formSchema = z.object({
  paymentStatus: z.enum(['Pending', 'Done']),
});

type BulkEditPortOutPaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedPortOuts: PortOutRecord[];
};

export function BulkEditPortOutPaymentModal({ isOpen, onClose, selectedPortOuts }: BulkEditPortOutPaymentModalProps) {
  const { bulkUpdatePortOutPaymentStatus } = useApp();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentStatus: 'Pending',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        paymentStatus: 'Pending',
      });
    }
  }, [isOpen, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const portOutIds = selectedPortOuts.map(s => s.id);
    bulkUpdatePortOutPaymentStatus(portOutIds, values.paymentStatus);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Edit Payment Status</DialogTitle>
          <DialogDescription>
            Update the payment status for the selected {selectedPortOuts.length} port out record(s).
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div>
                <p className="text-sm font-medium mb-2">Selected Records (by Mobile Number):</p>
                <ScrollArea className="h-24 w-full rounded-md border p-2">
                    <div className="flex flex-wrap gap-2">
                        {selectedPortOuts.map(portOut => (
                            <Badge key={portOut.id} variant="secondary">{portOut.mobile}</Badge>
                        ))}
                    </div>
                </ScrollArea>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} id="bulk-edit-port-out-payment-form" className="space-y-4">
                <FormField
                  control={form.control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Payment Status</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="bulk-edit-port-out-payment-form">Update Status</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
