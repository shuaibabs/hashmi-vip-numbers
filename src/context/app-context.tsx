"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  type Activity,
  type NumberRecord,
  type Reminder,
  type SaleRecord,
  DUMMY_EMPLOYEES,
  NewNumberData,
  type DealerPurchaseRecord,
  NewDealerPurchaseData,
  type PortOutRecord,
  getDummyNumbers,
  getDummyReminders,
  getDummyDealerPurchases,
} from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { isToday, isPast } from 'date-fns';
import { useAuth } from './auth-context';
import {
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  deleteDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { useCollectionData, useCollection } from 'react-firebase-hooks/firestore';
import { useFirestore } from '@/firebase';
import { SIMULATED_EMPLOYEE_NAME } from '@/lib/constants';

type AppContextType = {
  loading: boolean;
  role: 'admin' | 'employee';
  numbers: NumberRecord[];
  sales: SaleRecord[];
  portOuts: PortOutRecord[];
  reminders: Reminder[];
  activities: Activity[];
  employees: string[];
  dealerPurchases: DealerPurchaseRecord[];
  seedDatabase: () => Promise<void>;
  databaseSeeded: boolean;
  isSeeding: boolean;
  updateNumberStatus: (id: string, status: 'RTS' | 'Non-RTS', rtsDate: Date | null, note?: string) => void;
  updateSaleStatuses: (id: string, statuses: { paymentStatus: 'Done' | 'Pending'; portOutStatus: 'Done' | 'Pending' }) => void;
  markReminderDone: (id: string) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp' | 'createdBy'>, showToast?: boolean) => void;
  assignNumbersToEmployee: (numberIds: string[], employeeName: string) => void;
  updateActivationDetails: (id: string, details: { activationStatus: 'Done' | 'Pending' | 'Fail', uploadStatus: 'Done' | 'Pending' | 'Fail', note?: string }) => void;
  checkInNumber: (id: string) => void;
  sellNumber: (id: string, details: { salePrice: number; soldTo: string; website: string; upcStatus: 'Generated' | 'Pending'; saleDate: Date }) => void;
  addNumber: (data: NewNumberData) => void;
  addDealerPurchase: (data: NewDealerPurchaseData) => void;
  updateDealerPurchase: (id: string, statuses: { paymentStatus: 'Done' | 'Pending'; portOutStatus: 'Done' | 'Pending' }) => void;
  deletePortOuts: (ids: string[]) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const db = useFirestore();
  const [databaseSeeded, setDatabaseSeeded] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // --- Firestore Data Hooks ---
  const [numbersSnapshot, numbersLoading] = useCollection(db ? collection(db, 'numbers') : null);
  const numbers: NumberRecord[] = (numbersSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) as NumberRecord[]) || [];

  const [salesSnapshot, salesLoading] = useCollection(db ? collection(db, 'sales') : null);
  const sales: SaleRecord[] = (salesSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) as SaleRecord[]) || [];

  const [portOutsSnapshot, portOutsLoading] = useCollection(db ? collection(db, 'portouts') : null);
  const portOuts: PortOutRecord[] = (portOutsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) as PortOutRecord[]) || [];

  const [remindersSnapshot, remindersLoading] = useCollection(db ? collection(db, 'reminders') : null);
  const reminders: Reminder[] = (remindersSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) as Reminder[]) || [];

  const [activitiesSnapshot, activitiesLoading] = useCollection(db ? query(collection(db, 'activities')) : null);
  const activities: Activity[] = (activitiesSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) as Activity[]) || [];

  const [dealerPurchasesSnapshot, dealerPurchasesLoading] = useCollection(db ? collection(db, 'dealerPurchases') : null);
  const dealerPurchases: DealerPurchaseRecord[] = (dealerPurchasesSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) as DealerPurchaseRecord[]) || [];

  const [employees] = useState<string[]>(DUMMY_EMPLOYEES);

  const loading =
    numbersLoading ||
    salesLoading ||
    portOutsLoading ||
    remindersLoading ||
    activitiesLoading ||
    dealerPurchasesLoading;

  useEffect(() => {
    if (!loading && numbers.length === 0 && reminders.length === 0 && dealerPurchases.length === 0) {
      setDatabaseSeeded(false);
    } else {
      setDatabaseSeeded(true);
    }
  }, [loading, numbers.length, reminders.length, dealerPurchases.length]);
  
  // This function will be called by an admin to seed the database.
  const seedDatabase = async () => {
    if (!db || !user) return;
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);

      // Seed numbers
      const numbersCol = collection(db, 'numbers');
      const dummyNumbers = getDummyNumbers(user.uid);
      dummyNumbers.forEach(num => {
        const docRef = doc(numbersCol);
        batch.set(docRef, num);
      });

      // Seed reminders
      const remindersCol = collection(db, 'reminders');
      const dummyReminders = getDummyReminders(user.uid);
      dummyReminders.forEach(rem => {
        const docRef = doc(remindersCol);
        batch.set(docRef, rem);
      });

      // Seed dealer purchases
      const dealerPurchasesCol = collection(db, 'dealerPurchases');
      const dummyDealerPurchases = getDummyDealerPurchases(user.uid);
      dummyDealerPurchases.forEach(dp => {
        const docRef = doc(dealerPurchasesCol);
        batch.set(docRef, dp);
      });

      await batch.commit();
      
      addActivity({
        employeeName: user.displayName || 'Admin',
        action: 'Seeded Database',
        description: 'Populated the database with initial sample data.',
      });

      setDatabaseSeeded(true);
      toast({
        title: 'Database Seeded',
        description: 'Sample data has been successfully added to Firestore.',
      });
    } catch (error: any) {
      console.error("Error seeding database:", error);
      toast({
        variant: 'destructive',
        title: 'Seeding Failed',
        description: error.message || 'Could not seed the database.',
      });
    } finally {
        setIsSeeding(false);
    }
  };


  const addActivity = async (activity: Omit<Activity, 'id' | 'timestamp' | 'createdBy'>, showToast = true) => {
    if (!db || !user) return;
    const newActivity = { 
        ...activity, 
        timestamp: serverTimestamp(),
        createdBy: user.uid,
    };
    await addDoc(collection(db, 'activities'), newActivity);
    if (showToast) {
       toast({
        title: activity.action,
        description: activity.description,
      });
    }
  };
  
  useEffect(() => {
    if (!db) return;

    const checkRtsDates = async () => {
      let updated = false;
      const batch = writeBatch(db);
      
      const now = new Date();
      numbers.forEach(num => {
        if (num.status === 'Non-RTS' && num.rtsDate) {
          const rtsDateObj = num.rtsDate.toDate();
          if (isToday(rtsDateObj) || isPast(rtsDateObj)) {
            updated = true;
            const docRef = doc(db, 'numbers', num.id);
            batch.update(docRef, {
                status: 'RTS',
                rtsDate: null,
                activationStatus: 'Done'
            });
            addActivity({
                employeeName: 'System',
                action: 'Auto-updated to RTS',
                description: `Number ${num.mobile} automatically became RTS.`
            }, false);
          }
        }
      });

      if (updated) {
        await batch.commit();
      }
    };
    const interval = setInterval(checkRtsDates, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, numbers]);


  const updateNumberStatus = async (id: string, status: 'RTS' | 'Non-RTS', rtsDate: Date | null, note?: string) => {
    if (!db || !user) return;
    const numDocRef = doc(db, 'numbers', id);
    const num = numbers.find(n => n.id === id);
    if (!num) return;

    const updateData: any = {
        status: status,
        rtsDate: status === 'RTS' ? null : (rtsDate ? Timestamp.fromDate(rtsDate) : null)
    };
    if (note) {
        updateData.notes = `${num.notes || ''}\n${note}`.trim();
    }
    await updateDoc(numDocRef, updateData);

    addActivity({
        employeeName: user.displayName || 'User',
        action: 'Updated RTS Status',
        description: `Marked ${num.mobile} as ${status}`
    });
  };

  const updateSaleStatuses = async (id: string, statuses: { paymentStatus: 'Done' | 'Pending'; portOutStatus: 'Done' | 'Pending' }) => {
    if (!db || !user) return;
    const saleToUpdate = sales.find(s => s.id === id);
    if (!saleToUpdate) return;
    
    if (statuses.portOutStatus === 'Done') {
        const batch = writeBatch(db);
        const portOutsCol = collection(db, 'portouts');
        const newPortOutData: Omit<PortOutRecord, 'id'> = {
            mobile: saleToUpdate.mobile,
            soldTo: saleToUpdate.soldTo,
            salePrice: saleToUpdate.salePrice,
            paymentStatus: statuses.paymentStatus,
            saleDate: saleToUpdate.saleDate,
            upcStatus: saleToUpdate.upcStatus,
            createdBy: saleToUpdate.createdBy,
            portOutDate: Timestamp.now(),
        };
        batch.set(doc(portOutsCol), newPortOutData);
        batch.delete(doc(db, 'sales', id));
        await batch.commit();
        
        addActivity({
            employeeName: user.displayName || 'User',
            action: 'Marked Port Out Done',
            description: `Number ${saleToUpdate.mobile} has been ported out.`,
        });
    } else {
        await updateDoc(doc(db, 'sales', id), {
            paymentStatus: statuses.paymentStatus,
            portOutStatus: statuses.portOutStatus,
        });
        addActivity({
            employeeName: user.displayName || 'User',
            action: 'Updated Sale Status',
            description: `Updated sale for ${saleToUpdate.mobile}. Payment: ${statuses.paymentStatus}, Port-out: ${statuses.portOutStatus}.`,
        });
    }
  };

  const markReminderDone = async (id: string) => {
    if (!db || !user) return;
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    
    await updateDoc(doc(db, 'reminders', id), { status: 'ACT Done' });
    
    addActivity({
        employeeName: user.displayName || 'User',
        action: 'Marked Task Done',
        description: `Completed task: ${reminder.taskName}`
    })
  };

  const assignNumbersToEmployee = async (numberIds: string[], employeeName: string) => {
    if (!db || !user) return;
    const batch = writeBatch(db);
    numberIds.forEach(id => {
      const docRef = doc(db, 'numbers', id);
      batch.update(docRef, {
        assignedTo: employeeName,
        name: employeeName,
        locationType: 'Employee',
        currentLocation: `Employee - ${employeeName}`,
        location: `Employee - ${employeeName}`
      });
    });
    await batch.commit();

    addActivity({
      employeeName: 'Admin',
      action: 'Assigned Numbers',
      description: `Assigned ${numberIds.length} number(s) to ${employeeName}.`
    });
  };

  const updateActivationDetails = async (id: string, details: { activationStatus: 'Done' | 'Pending' | 'Fail', uploadStatus: 'Done' | 'Pending' | 'Fail', note?: string }) => {
    if (!db || !user) return;
    const numDocRef = doc(db, 'numbers', id);
    const num = numbers.find(n => n.id === id);
    if (!num) return;

    const isActivated = details.activationStatus === 'Done';
    const updateData: any = {
        activationStatus: details.activationStatus,
        uploadStatus: details.uploadStatus,
        status: isActivated ? 'RTS' : num.status,
        rtsDate: isActivated && !num.rtsDate ? Timestamp.now() : num.rtsDate
    };

    if (details.note) {
        updateData.notes = `${num.notes || ''}\n---Activation Note---\n${details.note}`.trim();
    }
    
    await updateDoc(numDocRef, updateData);

    addActivity({
        employeeName: user.displayName || 'User',
        action: 'Updated Activation Status',
        description: `Updated ${num.mobile}. Activation: ${details.activationStatus}, Upload: ${details.uploadStatus}`
    });
  };
  
  const checkInNumber = async (id: string) => {
    if (!db || !user) return;
    const num = numbers.find(n => n.id === id);
    if (!num) return;
    await updateDoc(doc(db, 'numbers', id), { checkInDate: Timestamp.now() });

    addActivity({
        employeeName: user.displayName || 'User',
        action: 'Checked In Number',
        description: `Checked in SIM number ${num.mobile}.`
    });
  };

  const sellNumber = async (id: string, details: { salePrice: number; soldTo: string; website: string; upcStatus: 'Generated' | 'Pending'; saleDate: Date }) => {
    if (!db || !user) return;
    const soldNumber = numbers.find(n => n.id === id);
    if (!soldNumber) return;

    const newSale: Omit<SaleRecord, 'id'> = {
      mobile: soldNumber.mobile,
      salePrice: details.salePrice,
      soldTo: details.soldTo,
      paymentStatus: 'Pending',
      portOutStatus: 'Pending',
      upcStatus: details.upcStatus,
      saleDate: Timestamp.fromDate(details.saleDate),
      createdBy: user.uid,
    };

    const batch = writeBatch(db);
    batch.set(doc(collection(db, 'sales')), newSale);
    batch.delete(doc(db, 'numbers', id));
    await batch.commit();

    addActivity({
      employeeName: user.displayName || 'User',
      action: 'Sold Number',
      description: `Sold number ${soldNumber.mobile} to ${details.soldTo} for ₹${details.salePrice}`
    });
  };

  const addNumber = async (data: NewNumberData) => {
    if (!db || !user) return;
    const newNumber: Omit<NumberRecord, 'id'> = {
      ...data,
      status: 'Non-RTS',
      rtsDate: null,
      activationStatus: 'Pending',
      uploadStatus: 'Pending',
      checkInDate: null,
      safeCustodyDate: null,
      createdBy: user.uid,
      purchaseDate: Timestamp.fromDate(data.purchaseDate as Date),
    };
    await addDoc(collection(db, 'numbers'), newNumber);
    addActivity({
      employeeName: user.displayName || 'User',
      action: 'Added Number',
      description: `Manually added new number ${data.mobile}`
    });
  };
  
  const addDealerPurchase = async (data: NewDealerPurchaseData) => {
    if (!db || !user) return;
    const newPurchase: Omit<DealerPurchaseRecord, 'id'> = {
      ...data,
      paymentStatus: 'Pending',
      portOutStatus: 'Pending',
      createdBy: user.uid,
    };
    await addDoc(collection(db, 'dealerPurchases'), newPurchase);
    addActivity({
      employeeName: user.displayName || 'User',
      action: 'Added Dealer Purchase',
      description: `Added new dealer purchase for ${data.mobile}`,
    });
  };

  const updateDealerPurchase = async (id: string, statuses: { paymentStatus: 'Done' | 'Pending'; portOutStatus: 'Done' | 'Pending' }) => {
    if (!db || !user) return;
    const purchase = dealerPurchases.find(p => p.id === id);
    if (!purchase) return;

    await updateDoc(doc(db, 'dealerPurchases', id), statuses);

    addActivity({
        employeeName: user.displayName || 'User',
        action: 'Updated Dealer Purchase',
        description: `Updated status for ${purchase.mobile}.`,
    });
  };

  const deletePortOuts = async (ids: string[]) => {
    if (!db || !user) return;
    const batch = writeBatch(db);
    ids.forEach(id => {
        batch.delete(doc(db, 'portouts', id));
    });
    await batch.commit();

    addActivity({
        employeeName: user.displayName || 'User',
        action: 'Deleted Port Out Records',
        description: `Deleted ${ids.length} record(s) from port out history.`
    });
  }

  // Filter data based on role
  const roleFilteredNumbers = role === 'admin' ? numbers : numbers.filter(n => n.assignedTo === SIMULATED_EMPLOYEE_NAME);
  const roleFilteredSales = role === 'admin' ? sales : sales.filter(s => roleFilteredNumbers.some(n => n.mobile === s.mobile));
  const roleFilteredPortOuts = role === 'admin' ? portOuts : portOuts.filter(p => roleFilteredNumbers.some(n => n.mobile === p.mobile));
  const roleFilteredReminders = role === 'admin' ? reminders : reminders.filter(r => r.assignedTo === SIMULATED_EMPLOYEE_NAME);

  const value = {
    loading,
    role: role || 'employee',
    numbers: roleFilteredNumbers,
    sales: roleFilteredSales,
    portOuts: roleFilteredPortOuts,
    reminders: roleFilteredReminders,
    activities,
    employees,
    dealerPurchases,
    seedDatabase,
    databaseSeeded,
    isSeeding,
    updateNumberStatus,
    updateSaleStatuses,
    markReminderDone,
    addActivity,
    assignNumbersToEmployee,
    updateActivationDetails,
    checkInNumber,
    sellNumber,
    addNumber,
    addDealerPurchase,
    updateDealerPurchase,
    deletePortOuts,
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
