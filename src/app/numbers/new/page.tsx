
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { NewNumberData } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

const formSchema = z.object({
  mobile: z.string().regex(/^\d{10}$/, 'Mobile number must be 10 digits.'),
  name: z.string().min(1, 'Name is required.'),
  numberType: z.enum(['Prepaid', 'Postpaid', 'COCP']),
  purchaseFrom: z.string().min(1, 'Purchase from is required.'),
  purchasePrice: z.coerce.number().min(0, 'Purchase price cannot be negative.'),
  salePrice: z.coerce.number().min(0, 'Sale price cannot be negative.').optional(),
  purchaseDate: z.date({ required_error: 'Purchase date is required.'}),
  currentLocation: z.string().min(1, 'Current location is required.'),
  locationType: z.enum(['Store', 'Employee', 'Dealer']),
  assignedTo: z.string().min(1, 'Assigned to is required.'),
  notes: z.string().optional(),
});

export default function NewNumberPage() {
  const { addNumber, employees } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mobile: '',
      name: '',
      numberType: 'Prepaid',
      purchaseFrom: '',
      purchasePrice: 0,
      salePrice: 0,
      purchaseDate: new Date(),
      currentLocation: '',
      locationType: 'Store',
      assignedTo: 'Unassigned',
      notes: '',
    },
  });

  useEffect(() => {
    const mobileParam = searchParams.get('mobile');
    if (mobileParam) {
      form.setValue('mobile', mobileParam);
    }
  }, [searchParams, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    addNumber(values as NewNumberData);
    router.push('/numbers');
  }

  return (
    <>
      <PageHeader
        title="Add New Number"
        description="Manually add a new number to the master inventory."
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </PageHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Number Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input placeholder="9876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="numberType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Prepaid">Prepaid</SelectItem>
                        <SelectItem value="Postpaid">Postpaid</SelectItem>
                        <SelectItem value="COCP">COCP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Purchase &amp; Sale Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="purchaseFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchased From (Vendor)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Vendor A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Purchase Date</FormLabel>
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
               </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="purchasePrice"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Purchase Price (₹)</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="100" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="salePrice"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Intended Sale Price (₹)</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="Optional" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>Location &amp; Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField
                        control={form.control}
                        name="currentLocation"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Current Location</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g. Mumbai Store" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="assignedTo"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Assigned To</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Unassigned">Unassigned</SelectItem>
                                {employees.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>
                  <FormField
                      control={form.control}
                      name="locationType"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Location Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                              <SelectItem value="Store">Store</SelectItem>
                              <SelectItem value="Employee">Employee</SelectItem>
                              <SelectItem value="Dealer">Dealer</SelectItem>
                          </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
                <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Any other relevant details about this number..."
                            className="resize-none"
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/numbers')}>Cancel</Button>
            <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Save Number
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
