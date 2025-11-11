"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/context/app-context';
import type { NumberRecord } from '@/lib/data';

const formSchema = z.object({
  activationStatus: z.enum(['Done', 'Pending', 'Fail']),
  uploadStatus: z.enum(['Done', 'Pending', 'Fail']),
  note: z.string().optional(),
});

type ActivationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  number: NumberRecord;
};

export function ActivationModal({ isOpen, onClose, number }: ActivationModalProps) {
  const { updateActivationDetails } = useApp();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activationStatus: number.activationStatus,
      uploadStatus: number.uploadStatus,
      note: '',
    },
  });
  
  // Reset form when modal opens or number changes
  React.useEffect(() => {
    if(isOpen) {
      form.reset({
        activationStatus: number.activationStatus,
        uploadStatus: number.uploadStatus,
        note: '',
      })
    }
  }, [isOpen, number, form])

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateActivationDetails(number.id, values);
    onClose();
    form.reset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Activation Details</DialogTitle>
          <DialogDescription>
            Update statuses for mobile number <span className="font-semibold">{number.mobile}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="activation-form" className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="activationStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activation Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select activation status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                      <SelectItem value="Fail">Fail</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="uploadStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select upload status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                      <SelectItem value="Fail">Fail</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Add Note (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add a note for this activation update..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="activation-form">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
