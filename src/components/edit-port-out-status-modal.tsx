
"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/app-context';
import { PortOutRecord } from '@/lib/data';

const formSchema = z.object({
  paymentStatus: z.enum(['Pending', 'Done']),
});

type EditPortOutStatusModalProps = {
  isOpen: boolean;
  onClose: () => void;
  portOut: PortOutRecord;
};

export function EditPortOutStatusModal({ isOpen, onClose, portOut }: EditPortOutStatusModalProps) {
  const { updatePortOutStatus } = useApp();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentStatus: portOut.paymentStatus,
    },
  });

  useEffect(() => {
    if (portOut) {
      form.reset({
        paymentStatus: portOut.paymentStatus,
      });
    }
  }, [portOut, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    updatePortOutStatus(portOut.id, values);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Port Out Status</DialogTitle>
          <DialogDescription>
            Update payment status for ported out number <span className="font-semibold">{portOut.mobile}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="edit-port-out-status-form" className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment status" />
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
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="edit-port-out-status-form">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
