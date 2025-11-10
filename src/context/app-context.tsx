"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DUMMY_ACTIVITIES, DUMMY_NUMBERS, DUMMY_PURCHASES, DUMMY_REMINDERS, DUMMY_SALES, type Activity, type NumberRecord, type PurchaseRecord, type Reminder, type SaleRecord } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { isToday, isPast } from 'date-fns';

type UserRole = 'admin' | 'employee';

type AppContextType = {
  role: UserRole;
  setRole: (role: UserRole) => void;
  numbers: NumberRecord[];
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  reminders: Reminder[];
  activities: Activity[];
  updateNumberStatus: (id: number, status: 'RTS' | 'Non-RTS', rtsDate: Date | null, note?: string) => void;
  toggleSalePaymentStatus: (id: number) => void;
  markReminderDone: (id: number) => void;
  addPurchase: (purchase: Omit<PurchaseRecord, 'id'>) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [role, setRole] = useState<UserRole>('admin');
  const [numbers, setNumbers] = useState<NumberRecord[]>(DUMMY_NUMBERS);
  const [sales, setSales] = useState<SaleRecord[]>(DUMMY_SALES);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(DUMMY_PURCHASES);
  const [reminders, setReminders] = useState<Reminder[]>(DUMMY_REMINDERS);
  const [activities, setActivities] = useState<Activity[]>(DUMMY_ACTIVITIES);

  useEffect(() => {
    const checkRtsDates = () => {
      let updated = false;
      const updatedNumbers = numbers.map(num => {
        if (num.status === 'Non-RTS' && num.rtsDate) {
          const rtsDateObj = new Date(num.rtsDate);
          if (isToday(rtsDateObj) || isPast(rtsDateObj)) {
            updated = true;
            addActivity({
                employeeName: 'System',
                action: 'Auto-updated to RTS',
                description: `Number ${num.mobile} automatically became RTS.`
            })
            return { ...num, status: 'RTS', rtsDate: '' };
          }
        }
        return num;
      });
      if (updated) {
        setNumbers(updatedNumbers);
      }
    };
    const interval = setInterval(checkRtsDates, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [numbers]);


  const addActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    setActivities(prev => [
      { id: prev.length + 1, ...activity, timestamp: new Date() },
      ...prev
    ]);
  };

  const updateNumberStatus = (id: number, status: 'RTS' | 'Non-RTS', rtsDate: Date | null, note?: string) => {
    setNumbers(prevNumbers =>
      prevNumbers.map(num =>
        num.id === id
          ? { ...num, status, rtsDate: status === 'RTS' ? '' : rtsDate, notes: note ? `${num.notes || ''}\n${note}`.trim() : num.notes }
          : num
      )
    );
    const updatedNumber = numbers.find(n => n.id === id);
    if(updatedNumber) {
        addActivity({
            employeeName: role === 'admin' ? 'Admin' : 'Naeem', // Example employee
            action: 'Updated RTS Status',
            description: `Marked ${updatedNumber.mobile} as ${status}`
        })
    }
    toast({
      title: 'Success!',
      description: 'Status updated successfully!',
    });
  };

  const toggleSalePaymentStatus = (id: number) => {
    setSales(prevSales =>
      prevSales.map(sale =>
        sale.id === id
          ? { ...sale, paymentStatus: sale.paymentStatus === 'Done' ? 'Pending' : 'Done' }
          : sale
      )
    );
  };

  const markReminderDone = (id: number) => {
    setReminders(prevReminders =>
      prevReminders.map(reminder =>
        reminder.id === id ? { ...reminder, status: 'ACT Done' } : reminder
      )
    );
    const updatedReminder = reminders.find(r => r.id === id);
    if(updatedReminder) {
        addActivity({
            employeeName: role === 'admin' ? 'Admin' : 'Naeem',
            action: 'Marked Task Done',
            description: `Completed task: ${updatedReminder.taskName}`
        })
    }
  };

  const addPurchase = (purchase: Omit<PurchaseRecord, 'id'>) => {
      const newPurchase = { ...purchase, id: purchases.length + 1 };
      setPurchases(prev => [newPurchase, ...prev]);
      setNumbers(prev => [{
        id: prev.length + 1,
        mobile: newPurchase.mobile,
        status: 'Non-RTS',
        purchaseFrom: newPurchase.purchasedFrom,
        purchasePrice: newPurchase.purchasePrice,
        salePrice: '',
        rtsDate: '',
        location: 'Store - Mumbai',
        name: 'Unassigned',
        mobileAlt: '',
        upcStatus: 'Pending',
        currentLocation: 'Store - Mumbai',
        locationType: 'Store',
        assignedTo: 'Unassigned',
        purchaseDate: newPurchase.purchaseDate
      }, ...prev]);

      addActivity({
        employeeName: role === 'admin' ? 'Admin' : 'Naeem',
        action: 'Added Purchase',
        description: `Added new purchase for ${newPurchase.mobile}`
      });
      toast({
          title: 'Success!',
          description: 'New purchase added successfully!',
      });
  };

  const value = {
    role,
    setRole,
    numbers,
    sales,
    purchases,
    reminders,
    activities,
    updateNumberStatus,
    toggleSalePaymentStatus,
    markReminderDone,
    addPurchase,
    addActivity,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
