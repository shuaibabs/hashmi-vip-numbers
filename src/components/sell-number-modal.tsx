
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useApp } from '@/context/app-context';
import type { NumberRecord } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const formSchema = z.object({
  salePrice: z.coerce.number().min(0, "Sale price can't be negative."),
  soldTo: z.string().min(1, 'Sold to is required.'),
  saleDate: z.date({ required_error: 'Sale date is required.' }),
});

type SellNumberModalProps = {
  isOpen: boolean;
  onClose: () => void;
  number: NumberRecord;
};

export function SellNumberModal({ isOpen, onClose, number }: SellNumberModalProps) {
  const { sellNumber, employees } = useApp();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salePrice: 0,
      soldTo: '',
      saleDate: new Date(),
    },
  });
  
  React.useEffect(() => {
    if(isOpen) {
      form.reset({
        salePrice: number.salePrice ? Number(number.salePrice) : 0,
        soldTo: '',
        saleDate: new Date(),
      })
    }
  }, [isOpen, number, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    sellNumber(number.id, values);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Number as Sold</DialogTitle>
          <DialogDescription>
            Enter sales details for <span className="font-semibold">{number.mobile}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="sell-number-form" className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="salePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sale Price</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter sale price" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="soldTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sold To</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter customer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="saleDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Sale Date</FormLabel>
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
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
                          onSelect={(date) => {
                            if (date) field.onChange(date);
                            setIsDatePickerOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </form>
        </Form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="sell-number-form">Mark as Sold</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
