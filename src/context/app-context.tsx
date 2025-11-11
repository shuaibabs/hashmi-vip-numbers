
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DUMMY_ACTIVITIES, DUMMY_NUMBERS, DUMMY_REMINDERS, DUMMY_SALES, type Activity, type NumberRecord, type Reminder, type SaleRecord, DUMMY_EMPLOYEES, NewNumberData, DUMMY_DEALER_PURCHASES, DealerPurchaseRecord, NewDealerPurchaseData } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { isToday, isPast } from 'date-fns';

type UserRole = 'admin' | 'employee';

// For employee simulation, we'll pick one.
const SIMULATED_EMPLOYEE_NAME = 'Naeem';

type AppContextType = {
  loading: boolean;
  role: UserRole;
  setRole: (role: UserRole) => void;
  numbers: NumberRecord[];
  sales: SaleRecord[];
  reminders: Reminder[];
  activities: Activity[];
  employees: string[];
  dealerPurchases: DealerPurchaseRecord[];
  updateNumberStatus: (id: number, status: 'RTS' | 'Non-RTS', rtsDate: Date | null, note?: string) => void;
  toggleSalePaymentStatus: (id: number) => void;
  markReminderDone: (id: number) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  assignNumbersToEmployee: (numberIds: number[], employeeName: string) => void;
  updateActivationDetails: (id: number, details: { activationStatus: 'Done' | 'Pending' | 'Fail', uploadStatus: 'Done' | 'Pending' | 'Fail', note?: string }) => void;
  checkInNumber: (id: number) => void;
  sellNumber: (id: number, details: { salePrice: number; soldTo: string; website: string; upcStatus: 'Generated' | 'Pending'; saleDate: Date }) => void;
  addNumber: (data: NewNumberData) => void;
  addDealerPurchase: (data: NewDealerPurchaseData) => void;
  updateDealerPurchase: (id: number, statuses: { paymentStatus: 'Done' | 'Pending'; portOutStatus: 'Done' | 'Pending' }) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [role, setRole] = useState<UserRole>('admin');
  const [loading, setLoading] = useState(true);
  
  // These hold the master list of all data
  const [allNumbers, setAllNumbers] = useState<NumberRecord[]>(DUMMY_NUMBERS);
  const [allSales, setAllSales] = useState<SaleRecord[]>(DUMMY_SALES);
  const [allReminders, setAllReminders] = useState<Reminder[]>(DUMMY_REMINDERS);
  const [allActivities, setAllActivities] = useState<Activity[]>(DUMMY_ACTIVITIES);
  const [allDealerPurchases, setAllDealerPurchases] = useState<DealerPurchaseRecord[]>(DUMMY_DEALER_PURCHASES);
  const [employees] = useState<string[]>(DUMMY_EMPLOYEES);

  // These will hold the filtered data based on role
  const [numbers, setNumbers] = useState<NumberRecord[]>(allNumbers);
  const [sales, setSales] = useState<SaleRecord[]>(allSales);
  const [reminders, setReminders] = useState<Reminder[]>(allReminders);
  const [activities, setActivities] = useState<Activity[]>(allActivities);
  const [dealerPurchases, setDealerPurchases] = useState<DealerPurchaseRecord[]>(allDealerPurchases);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000); // Simulate loading
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (role === 'admin') {
      setNumbers(allNumbers);
      setSales(allSales);
      setReminders(allReminders);
      setActivities(allActivities);
      setDealerPurchases(allDealerPurchases);
    } else {
      // It's an employee, filter all data for the simulated employee
      setNumbers(allNumbers.filter(n => n.assignedTo === SIMULATED_EMPLOYEE_NAME));
      
      const employeeMobiles = new Set(allNumbers.filter(n => n.assignedTo === SIMULATED_EMPLOYEE_NAME).map(n => n.mobile));
      setSales(allSales.filter(s => employeeMobiles.has(s.mobile)));
      
      setReminders(allReminders.filter(r => r.assignedTo === SIMULATED_EMPLOYEE_NAME));
      setDealerPurchases(allDealerPurchases); // Employees can see all dealer purchases for now
      // For simplicity, we show all activities to employees for now
      setActivities(allActivities);
    }
  }, [role, allNumbers, allSales, allReminders, allActivities, allDealerPurchases]);


  const addActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity = { id: allActivities.length + 1, ...activity, timestamp: new Date() };
    setAllActivities(prev => [newActivity, ...prev]);
    
    // Show toast notification for admin
    if (role === 'admin') {
      toast({
        title: `Activity: ${activity.employeeName} ${activity.action}`,
        description: activity.description,
      });
    }
  };
  
  useEffect(() => {
    const checkRtsDates = () => {
      let updated = false;
      const updatedNumbers = allNumbers.map(num => {
        if (num.status === 'Non-RTS' && num.rtsDate) {
          const rtsDateObj = new Date(num.rtsDate);
          if (isToday(rtsDateObj) || isPast(rtsDateObj)) {
            updated = true;
            addActivity({
                employeeName: 'System',
                action: 'Auto-updated to RTS',
                description: `Number ${num.mobile} automatically became RTS.`
            })
            return { ...num, status: 'RTS' as 'RTS', rtsDate: null, activationStatus: 'Done' as 'Done' };
          }
        }
        return num;
      });
      if (updated) {
        setAllNumbers(updatedNumbers);
      }
    };
    const interval = setInterval(checkRtsDates, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allNumbers]);


  const updateNumberStatus = (id: number, status: 'RTS' | 'Non-RTS', rtsDate: Date | null, note?: string) => {
    let updatedNumberRef: NumberRecord | undefined;
    setAllNumbers(prevNumbers =>
      prevNumbers.map(num => {
        if (num.id === id) {
          const updatedNum = { ...num, status, rtsDate: status === 'RTS' ? null : rtsDate, notes: note ? `${num.notes || ''}\n${note}`.trim() : num.notes };
          updatedNumberRef = updatedNum;
          return updatedNum;
        }
        return num;
      })
    );
    
    if(updatedNumberRef) {
        addActivity({
            employeeName: role === 'admin' ? 'Admin' : SIMULATED_EMPLOYEE_NAME,
            action: 'Updated RTS Status',
            description: `Marked ${updatedNumberRef.mobile} as ${status}`
        });
        toast({
          title: 'Success!',
          description: 'Status updated successfully!',
        });
    }
  };

  const toggleSalePaymentStatus = (id: number) => {
    setAllSales(prevSales =>
      prevSales.map(sale =>
        sale.id === id
          ? { ...sale, paymentStatus: sale.paymentStatus === 'Done' ? 'Pending' : 'Done' }
          : sale
      )
    );
  };

  const markReminderDone = (id: number) => {
    setAllReminders(prevReminders =>
      prevReminders.map(reminder =>
        reminder.id === id ? { ...reminder, status: 'ACT Done' } : reminder
      )
    );
    const updatedReminder = allReminders.find(r => r.id === id);
    if(updatedReminder) {
        addActivity({
            employeeName: role === 'admin' ? 'Admin' : SIMULATED_EMPLOYEE_NAME,
            action: 'Marked Task Done',
            description: `Completed task: ${updatedReminder.taskName}`
        })
    }
  };

  const assignNumbersToEmployee = (numberIds: number[], employeeName: string) => {
    setAllNumbers(prevNumbers =>
      prevNumbers.map(num =>
        numberIds.includes(num.id)
          ? { ...num, assignedTo: employeeName, name: employeeName, locationType: 'Employee', currentLocation: `Employee - ${employeeName}`, location: `Employee - ${employeeName}` }
          : num
      )
    );
    addActivity({
      employeeName: 'Admin',
      action: 'Assigned Numbers',
      description: `Assigned ${numberIds.length} number(s) to ${employeeName}.`
    });
    toast({
      title: 'Assignment Successful',
      description: `${numberIds.length} number(s) have been assigned to ${employeeName}.`
    });
  };

  const updateActivationDetails = (id: number, details: { activationStatus: 'Done' | 'Pending' | 'Fail', uploadStatus: 'Done' | 'Pending' | 'Fail', note?: string }) => {
    let updatedNumberRef: NumberRecord | undefined;
    setAllNumbers(prevNumbers =>
      prevNumbers.map(num => {
        if (num.id === id) {
          const isActivated = details.activationStatus === 'Done';
          const updatedNum = { 
            ...num, 
            activationStatus: details.activationStatus,
            uploadStatus: details.uploadStatus,
            status: isActivated ? 'RTS' as 'RTS' : num.status,
            rtsDate: isActivated ? new Date() : num.rtsDate,
            notes: details.note ? `${num.notes || ''}\n---Activation Note---\n${details.note}`.trim() : num.notes 
          };
          updatedNumberRef = updatedNum;
          return updatedNum;
        }
        return num;
      })
    );

    if (updatedNumberRef) {
      addActivity({
        employeeName: role === 'admin' ? 'Admin' : SIMULATED_EMPLOYEE_NAME,
        action: 'Updated Activation Status',
        description: `Updated ${updatedNumberRef.mobile}. Activation: ${details.activationStatus}, Upload: ${details.uploadStatus}`
      });
      toast({
        title: "Activation Details Updated",
        description: `Details for number ${updatedNumberRef.mobile} have been updated.`,
      });
    }
  };
  
  const checkInNumber = (id: number) => {
    let checkedInNumber: NumberRecord | undefined;
    setAllNumbers(prevNumbers =>
      prevNumbers.map(num => {
        if (num.id === id) {
          checkedInNumber = { ...num, checkInDate: new Date() };
          return checkedInNumber;
        }
        return num;
      })
    );

    if (checkedInNumber) {
      addActivity({
        employeeName: role === 'admin' ? 'Admin' : SIMULATED_EMPLOYEE_NAME,
        action: 'Checked In Number',
        description: `Checked in SIM number ${checkedInNumber.mobile}.`
      });
      toast({
        title: "Check-In Successful",
        description: `Number ${checkedInNumber.mobile} has been checked in.`,
      });
    }
  };

  const sellNumber = (id: number, details: { salePrice: number; soldTo: string; website: string; upcStatus: 'Generated' | 'Pending'; saleDate: Date }) => {
    const soldNumber = allNumbers.find(n => n.id === id);
    if (!soldNumber) return;

    const newSale: SaleRecord = {
      id: allSales.length + 1,
      mobile: soldNumber.mobile,
      salePrice: details.salePrice,
      soldTo: details.soldTo,
      paymentStatus: 'Pending',
      saleDate: details.saleDate
    };

    setAllSales(prev => [newSale, ...prev]);

    setAllNumbers(prev => prev.filter(n => n.id !== id));

    addActivity({
      employeeName: role === 'admin' ? 'Admin' : SIMULATED_EMPLOYEE_NAME,
      action: 'Sold Number',
      description: `Sold number ${soldNumber.mobile} to ${details.soldTo} for ₹${details.salePrice}`
    });

    toast({
      title: 'Number Sold!',
      description: `${soldNumber.mobile} has been moved to sales.`,
    });
  };

  const addNumber = (data: NewNumberData) => {
    const newId = Math.max(...allNumbers.map(n => n.id)) + 1;
    const newNumber: NumberRecord = {
      id: newId,
      ...data,
      status: 'Non-RTS',
      rtsDate: null,
      activationStatus: 'Pending',
      uploadStatus: 'Pending',
      checkInDate: null,
      safeCustodyDate: null,
    };
    setAllNumbers(prev => [newNumber, ...prev]);
    addActivity({
      employeeName: role === 'admin' ? 'Admin' : SIMULATED_EMPLOYEE_NAME,
      action: 'Added Number',
      description: `Manually added new number ${data.mobile}`
    });
    toast({
      title: "Number Added",
      description: `Successfully added ${data.mobile} to the inventory.`
    });
  };
  
  const addDealerPurchase = (data: NewDealerPurchaseData) => {
    const newId = Math.max(0, ...allDealerPurchases.map(p => p.id)) + 1;
    const newPurchase: DealerPurchaseRecord = {
      id: newId,
      ...data,
      paymentStatus: 'Pending',
      portOutStatus: 'Pending',
    };
    setAllDealerPurchases(prev => [newPurchase, ...prev]);
    addActivity({
      employeeName: role === 'admin' ? 'Admin' : SIMULATED_EMPLOYEE_NAME,
      action: 'Added Dealer Purchase',
      description: `Added new dealer purchase for ${data.mobile}`,
    });
    toast({
      title: 'Dealer Purchase Added',
      description: `Successfully added ${data.mobile}.`,
    });
  };

  const updateDealerPurchase = (id: number, statuses: { paymentStatus: 'Done' | 'Pending'; portOutStatus: 'Done' | 'Pending' }) => {
    let updatedPurchase: DealerPurchaseRecord | undefined;
    setAllDealerPurchases(prev =>
      prev.map(p => {
        if (p.id === id) {
          updatedPurchase = { ...p, ...statuses };
          return updatedPurchase;
        }
        return p;
      })
    );

    if (updatedPurchase) {
      addActivity({
        employeeName: role === 'admin' ? 'Admin' : SIMULATED_EMPLOYEE_NAME,
        action: 'Updated Dealer Purchase',
        description: `Updated status for ${updatedPurchase.mobile}.`,
      });
      toast({
        title: 'Dealer Purchase Updated',
        description: 'Statuses have been successfully updated.',
      });
    }
  };


  const value = {
    loading,
    role,
    setRole,
    numbers,
    sales,
    reminders,
    activities,
    employees,
    dealerPurchases,
    updateNumberStatus,
    toggleSalePaymentStatus,
    markReminderDone,
    addActivity,
    assignNumbersToEmployee,
    updateActivationDetails,
    checkInNumber,
    sellNumber,
    addNumber,
    addDealerPurchase,
    updateDealerPurchase,
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
