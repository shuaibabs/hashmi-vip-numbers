
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DUMMY_ACTIVITIES, DUMMY_NUMBERS, DUMMY_PURCHASES, DUMMY_REMINDERS, DUMMY_SALES, type Activity, type NumberRecord, type PurchaseRecord, type Reminder, type SaleRecord, DUMMY_EMPLOYEES } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { isToday, isPast } from 'date-fns';

type UserRole = 'admin' | 'employee';

// For employee simulation, we'll pick one.
const SIMULATED_EMPLOYEE_NAME = 'Naeem';

type AppContextType = {
  role: UserRole;
  setRole: (role: UserRole) => void;
  numbers: NumberRecord[];
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  reminders: Reminder[];
  activities: Activity[];
  employees: string[];
  updateNumberStatus: (id: number, status: 'RTS' | 'Non-RTS', rtsDate: Date | null, note?: string) => void;
  toggleSalePaymentStatus: (id: number) => void;
  markReminderDone: (id: number) => void;
  addPurchase: (purchase: Omit<PurchaseRecord, 'id'>) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  assignNumbersToEmployee: (numberIds: number[], employeeName: string) => void;
  activateNumber: (id: number) => void;
  updateActivationDetails: (id: number, details: { activationStatus: 'Done' | 'Pending' | 'Fail', uploadStatus: 'Done' | 'Pending' | 'Fail', note?: string }) => void;
  checkInNumber: (id: number) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [role, setRole] = useState<UserRole>('admin');
  
  // These hold the master list of all data
  const [allNumbers, setAllNumbers] = useState<NumberRecord[]>(DUMMY_NUMBERS);
  const [allSales, setAllSales] = useState<SaleRecord[]>(DUMMY_SALES);
  const [allPurchases, setAllPurchases] = useState<PurchaseRecord[]>(DUMMY_PURCHASES);
  const [allReminders, setAllReminders] = useState<Reminder[]>(DUMMY_REMINDERS);
  const [allActivities, setAllActivities] = useState<Activity[]>(DUMMY_ACTIVITIES);
  const [employees] = useState<string[]>(DUMMY_EMPLOYEES);

  // These will hold the filtered data based on role
  const [numbers, setNumbers] = useState<NumberRecord[]>(allNumbers);
  const [sales, setSales] = useState<SaleRecord[]>(allSales);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(allPurchases);
  const [reminders, setReminders] = useState<Reminder[]>(allReminders);
  const [activities, setActivities] = useState<Activity[]>(allActivities);

  useEffect(() => {
    if (role === 'admin') {
      setNumbers(allNumbers);
      setSales(allSales);
      setPurchases(allPurchases);
      setReminders(allReminders);
      setActivities(allActivities);
    } else {
      // It's an employee, filter all data for the simulated employee
      setNumbers(allNumbers.filter(n => n.assignedTo === SIMULATED_EMPLOYEE_NAME));
      
      const employeeMobiles = new Set(allNumbers.filter(n => n.assignedTo === SIMULATED_EMPLOYEE_NAME).map(n => n.mobile));
      setSales(allSales.filter(s => employeeMobiles.has(s.mobile)));
      setPurchases(allPurchases.filter(p => employeeMobiles.has(p.mobile)));
      
      setReminders(allReminders.filter(r => r.assignedTo === SIMULATED_EMPLOYEE_NAME));
      // For simplicity, we show all activities to employees for now
      setActivities(allActivities);
    }
  }, [role, allNumbers, allSales, allPurchases, allReminders, allActivities]);


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

  const addPurchase = (purchase: Omit<PurchaseRecord, 'id'>) => {
      const newPurchase = { ...purchase, id: allPurchases.length + 1 };
      setAllPurchases(prev => [newPurchase, ...prev]);
      const newNumber = {
        id: allNumbers.length + 1,
        mobile: newPurchase.mobile,
        status: 'Non-RTS' as 'Non-RTS',
        purchaseFrom: newPurchase.purchasedFrom,
        purchasePrice: newPurchase.purchasePrice,
        salePrice: '',
        rtsDate: null,
        location: 'Store - Mumbai',
        name: 'Unassigned',
        mobileAlt: '',
        upcStatus: 'Pending' as 'Pending',
        currentLocation: 'Store - Mumbai',
        locationType: 'Store' as 'Store',
        assignedTo: 'Unassigned',
        purchaseDate: newPurchase.purchaseDate,
        notes: '',
        activationStatus: 'Pending' as 'Pending',
        uploadStatus: 'Pending' as 'Pending',
        checkInDate: null,
      };
      setAllNumbers(prev => [newNumber, ...prev]);

      addActivity({
        employeeName: role === 'admin' ? 'Admin' : SIMULATED_EMPLOYEE_NAME,
        action: 'Added Purchase',
        description: `Added new purchase for ${newPurchase.mobile}`
      });
      toast({
          title: 'Success!',
          description: 'New purchase added successfully!',
      });
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

  const activateNumber = (id: number) => {
    let activatedNumber: NumberRecord | undefined;
    setAllNumbers(prevNumbers => 
      prevNumbers.map(num => {
        if (num.id === id) {
          activatedNumber = { ...num, status: 'RTS', activationStatus: 'Done', rtsDate: new Date() };
          return activatedNumber;
        }
        return num;
      })
    );

    if (activatedNumber) {
      addActivity({
        employeeName: role === 'admin' ? 'Admin' : SIMULATED_EMPLOYEE_NAME,
        action: 'Activated Number',
        description: `Activated SIM number ${activatedNumber.mobile}.`
      });
      toast({
        title: "Activation Successful",
        description: `Number ${activatedNumber.mobile} has been activated.`,
      });
    }
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

  const value = {
    role,
    setRole,
    numbers,
    sales,
    purchases,
    reminders,
    activities,
    employees,
    updateNumberStatus,
    toggleSalePaymentStatus,
    markReminderDone,
    addPurchase,
    addActivity,
    assignNumbersToEmployee,
    activateNumber,
    updateActivationDetails,
    checkInNumber,
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
