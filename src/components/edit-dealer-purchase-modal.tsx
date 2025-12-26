
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
import { DealerPurchaseRecord } from '@/lib/data';

const formSchema = z.object({
  paymentStatus: z.enum(['Pending', 'Done']),
  portOutStatus: z.enum(['Pending', 'Done']),
});

type EditDealerPurchaseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  purchase: DealerPurchaseRecord;
};

export function EditDealerPurchaseModal({ isOpen, onClose, purchase }: EditDealerPurchaseModalProps) {
  const { updateDealerPurchase } = useApp();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentStatus: purchase.paymentStatus,
      portOutStatus: purchase.portOutStatus,
    },
  });

  useEffect(() => {
    if (purchase) {
      form.reset({
        paymentStatus: purchase.paymentStatus,
        portOutStatus: purchase.portOutStatus,
      });
    }
  }, [purchase, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    updateDealerPurchase(purchase.id, values);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Purchase Status</DialogTitle>
          <DialogDescription>
            Update statuses for mobile number <span className="font-semibold">{purchase.mobile}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="edit-dealer-purchase-form" className="space-y-4 py-4">
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
             <FormField
              control={form.control}
              name="portOutStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Port Out Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select port out status" />
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
          <Button type="submit" form="edit-dealer-purchase-form">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
