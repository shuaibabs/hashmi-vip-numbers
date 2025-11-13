"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  type Activity,
  type NumberRecord,
  type Reminder,
  type SaleRecord,
  NewNumberData,
  type DealerPurchaseRecord,
  NewDealerPurchaseData,
  type PortOutRecord,
} from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { isToday, isPast } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import {
  collection,
  query,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  deleteDoc,
  writeBatch,
  Timestamp,
  onSnapshot,
  getDocs,
  where,
  DocumentData,
  Unsubscribe,
  QuerySnapshot,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { calculateDigitalRoot } from '@/lib/utils';

// Helper to get the next serial number for a collection
const getNextSrNo = (records: { srNo?: number }[]): number => {
  if (!records || records.length === 0) {
    return 1;
  }
  const maxSrNo = Math.max(...records.map(r => r.srNo || 0));
  return maxSrNo + 1;
};

// Helper function to map snapshot to data with ID
const mapSnapshotToData = <T>(snapshot: QuerySnapshot<DocumentData>): T[] => {
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as T));
};


type AppContextType = {
  loading: boolean;
  numbers: NumberRecord[];
  sales: SaleRecord[];
  portOuts: PortOutRecord[];
  reminders: Reminder[];
  activities: Activity[];
  employees: string[];
  dealerPurchases: DealerPurchaseRecord[];
  updateNumberStatus: (id: string, status: 'RTS' | 'Non-RTS', rtsDate: Date | null, note?: string) => void;
  updateSaleStatuses: (id: string, statuses: { paymentStatus: 'Done' | 'Pending'; portOutStatus: 'Done' | 'Pending' }) => void;
  markReminderDone: (id: string) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'srNo' | 'timestamp' | 'createdBy'>, showToast?: boolean) => void;
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
  const { user, role, loading: authLoading } = useAuth();
  const db = useFirestore();

  const [numbers, setNumbers] = useState<NumberRecord[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [portOuts, setPortOuts] = useState<PortOutRecord[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [dealerPurchases, setDealerPurchases] = useState<DealerPurchaseRecord[]>([]);
  const [employees, setEmployees] = useState<string[]>([]);

  const [numbersLoading, setNumbersLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [portOutsLoading, setPortOutsLoading] = useState(true);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [dealerPurchasesLoading, setDealerPurchasesLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    if (!db || !user) {
      // If not logged in, reset state and stop loading
      setNumbers([]);
      setSales([]);
      setPortOuts([]);
      setReminders([]);
      setActivities([]);
      setDealerPurchases([]);
      setEmployees([]);
      setNumbersLoading(false);
      setSalesLoading(false);
      setPortOutsLoading(false);
      setRemindersLoading(false);
      setActivitiesLoading(false);
      setDealerPurchasesLoading(false);
      setUsersLoading(false);
      return;
    }
    
    // Set loading true when user changes
    setNumbersLoading(true);
    setSalesLoading(true);
    setPortOutsLoading(true);
    setRemindersLoading(true);
    setActivitiesLoading(true);
    setDealerPurchasesLoading(true);
    setUsersLoading(true);

    const subscriptions: Unsubscribe[] = [];
    const collectionMappings = [
      { name: 'numbers', setter: setNumbers, loader: setNumbersLoading },
      { name: 'sales', setter: setSales, loader: setSalesLoading },
      { name: 'portouts', setter: setPortOuts, loader: setPortOutsLoading },
      { name: 'reminders', setter: setReminders, loader: setRemindersLoading },
      { name: 'activities', setter: setActivities, loader: setActivitiesLoading },
      { name: 'dealerPurchases', setter: setDealerPurchases, loader: setDealerPurchasesLoading },
      { name: 'users', setter: (data: any[]) => setEmployees(data.map(u => u.displayName)), loader: setUsersLoading },
    ];

    collectionMappings.forEach(({ name, setter, loader }) => {
      const q = query(collection(db, name));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const data = mapSnapshotToData(querySnapshot);
        setter(data as any); // Cast as any because setters have different types
        loader(false);
      }, (error) => {
        console.error(`Error fetching ${name}:`, error);
        loader(false);
      });
      subscriptions.push(unsubscribe);
    });

    return () => {
      subscriptions.forEach(sub => sub());
    };
  }, [db, user]);


  // Combined loading state: true if auth is loading OR if auth is done but any data is still loading.
  const loading =
    authLoading || 
    (!!user && (
      numbersLoading ||
      salesLoading ||
      portOutsLoading ||
      remindersLoading ||
      activitiesLoading ||
      dealerPurchasesLoading ||
      usersLoading
    ));

  const isMobileNumberDuplicate = (mobile: string): boolean => {
    const allMobiles = new Set([
      ...numbers.map(n => n.mobile),
      ...sales.map(s => s.mobile),
      ...portOuts.map(p => p.mobile),
      ...dealerPurchases.map(d => d.mobile),
    ]);
    return allMobiles.has(mobile);
  };


  const addActivity = (activity: Omit<Activity, 'id' | 'srNo' | 'timestamp' | 'createdBy'>, showToast = true) => {
    if (!db || !user) return;
    const newActivity = { 
        ...activity, 
        srNo: getNextSrNo(activities),
        timestamp: serverTimestamp(),
        createdBy: user.uid,
    };
    addDoc(collection(db, 'activities'), newActivity)
      .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: 'activities',
            operation: 'create',
            requestResourceData: newActivity,
          });
          errorEmitter.emit('permission-error', permissionError);
      });

    if (showToast) {
       toast({
        title: activity.action,
        description: activity.description,
      });
    }
  };
  
  useEffect(() => {
    if (!db || !numbers || numbers.length === 0) {
      return;
    }
    const checkRtsDates = async () => {
      // Extra guard clause to ensure db is available before any operation.
      if (!db) {
        return;
      }

      let updated = false;
      const batch = writeBatch(db);
      
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
        batch.commit().catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: 'numbers',
                operation: 'update',
                requestResourceData: {info: 'Batch update for RTS status'},
            });
            errorEmitter.emit('permission-error', permissionError);
        });
      }
    };

    const interval = setInterval(checkRtsDates, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, numbers]);


  const updateNumberStatus = (id: string, status: 'RTS' | 'Non-RTS', rtsDate: Date | null, note?: string) => {
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
    updateDoc(numDocRef, updateData).then(() => {
        addActivity({
            employeeName: user.displayName || 'User',
            action: 'Updated RTS Status',
            description: `Marked ${num.mobile} as ${status}`
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: numDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const updateSaleStatuses = (id: string, statuses: { paymentStatus: 'Done' | 'Pending'; portOutStatus: 'Done' | 'Pending' }) => {
    if (!db || !user) return;
    const saleToUpdate = sales.find(s => s.id === id);
    if (!saleToUpdate) return;
    
    if (statuses.portOutStatus === 'Done') {
        const batch = writeBatch(db);
        const portOutsCol = collection(db, 'portouts');
        const newPortOutData: Omit<PortOutRecord, 'id'> = {
            srNo: getNextSrNo(portOuts),
            mobile: saleToUpdate.mobile,
            sum: calculateDigitalRoot(saleToUpdate.mobile),
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
        batch.commit().then(() => {
            addActivity({
                employeeName: user.displayName || 'User',
                action: 'Marked Port Out Done',
                description: `Number ${saleToUpdate.mobile} has been ported out.`,
            });
        }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: 'sales/portouts',
                operation: 'create',
                requestResourceData: {info: 'Batch write for port out'},
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    } else {
        const saleDocRef = doc(db, 'sales', id);
        updateDoc(saleDocRef, {
            paymentStatus: statuses.paymentStatus,
            portOutStatus: statuses.portOutStatus,
        }).then(() => {
            addActivity({
                employeeName: user.displayName || 'User',
                action: 'Updated Sale Status',
                description: `Updated sale for ${saleToUpdate.mobile}. Payment: ${statuses.paymentStatus}, Port-out: ${statuses.portOutStatus}.`,
            });
        }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: saleDocRef.path,
                operation: 'update',
                requestResourceData: statuses,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    }
  };

  const markReminderDone = (id: string) => {
    if (!db || !user) return;
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    const reminderDocRef = doc(db, 'reminders', id);
    
    updateDoc(reminderDocRef, { status: 'ACT Done' }).then(() => {
        addActivity({
            employeeName: user.displayName || 'User',
            action: 'Marked Task Done',
            description: `Completed task: ${reminder.taskName}`
        })
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: reminderDocRef.path,
            operation: 'update',
            requestResourceData: { status: 'ACT Done' },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const assignNumbersToEmployee = (numberIds: string[], employeeName: string) => {
    if (!db || !user) return;
    const batch = writeBatch(db);
    const updateData = {
        assignedTo: employeeName,
        name: employeeName,
        locationType: 'Employee',
        currentLocation: `Employee - ${employeeName}`,
        location: `Employee - ${employeeName}`
    };
    numberIds.forEach(id => {
      const docRef = doc(db, 'numbers', id);
      batch.update(docRef, updateData);
    });
    batch.commit().then(() => {
        addActivity({
            employeeName: 'Admin',
            action: 'Assigned Numbers',
            description: `Assigned ${numberIds.length} number(s) to ${employeeName}.`
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'numbers',
            operation: 'update',
            requestResourceData: {info: `Batch assign to ${employeeName}`},
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const updateActivationDetails = (id: string, details: { activationStatus: 'Done' | 'Pending' | 'Fail', uploadStatus: 'Done' | 'Pending' | 'Fail', note?: string }) => {
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
    
    updateDoc(numDocRef, updateData).then(() => {
        addActivity({
            employeeName: user.displayName || 'User',
            action: 'Updated Activation Status',
            description: `Updated ${num.mobile}. Activation: ${details.activationStatus}, Upload: ${details.uploadStatus}`
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: numDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const checkInNumber = (id: string) => {
    if (!db || !user) return;
    const num = numbers.find(n => n.id === id);
    if (!num) return;
    const numDocRef = doc(db, 'numbers', id);
    updateDoc(numDocRef, { checkInDate: Timestamp.now() }).then(() => {
        addActivity({
            employeeName: user.displayName || 'User',
            action: 'Checked In Number',
            description: `Checked in SIM number ${num.mobile}.`
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: numDocRef.path,
            operation: 'update',
            requestResourceData: { checkInDate: 'NOW' },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const sellNumber = (id: string, details: { salePrice: number; soldTo: string; website: string; upcStatus: 'Generated' | 'Pending'; saleDate: Date }) => {
    if (!db || !user) return;
    const soldNumber = numbers.find(n => n.id === id);
    if (!soldNumber) return;

    const newSale: Omit<SaleRecord, 'id'> = {
      srNo: getNextSrNo(sales),
      mobile: soldNumber.mobile,
      sum: calculateDigitalRoot(soldNumber.mobile),
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
    batch.commit().then(() => {
        addActivity({
            employeeName: user.displayName || 'User',
            action: 'Sold Number',
            description: `Sold number ${soldNumber.mobile} to ${details.soldTo} for ₹${details.salePrice}`
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'sales',
            operation: 'create',
            requestResourceData: { info: `Sell number ${soldNumber.mobile}` },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const addNumber = (data: NewNumberData) => {
    if (!db || !user) return;
    
    if (isMobileNumberDuplicate(data.mobile)) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Number',
        description: `The mobile number ${data.mobile} already exists in the system.`,
      });
      return;
    }

    const newNumber: Omit<NumberRecord, 'id'> = {
      ...data,
      srNo: getNextSrNo(numbers),
      sum: calculateDigitalRoot(data.mobile),
      status: 'Non-RTS',
      rtsDate: null,
      activationStatus: 'Pending',
      uploadStatus: 'Pending',
      checkInDate: null,
      safeCustodyDate: null,
      createdBy: user.uid,
      purchaseDate: Timestamp.fromDate(data.purchaseDate as Date),
    };
    const numbersCollection = collection(db, 'numbers');
    addDoc(numbersCollection, newNumber).then(() => {
        addActivity({
            employeeName: user.displayName || 'User',
            action: 'Added Number',
            description: `Manually added new number ${data.mobile}`
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'numbers',
            operation: 'create',
            requestResourceData: newNumber,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const addDealerPurchase = (data: NewDealerPurchaseData) => {
    if (!db || !user) return;

    if (isMobileNumberDuplicate(data.mobile)) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Number',
        description: `The mobile number ${data.mobile} already exists in the system.`,
      });
      return;
    }

    const newPurchase: Omit<DealerPurchaseRecord, 'id'> = {
      ...data,
      srNo: getNextSrNo(dealerPurchases),
      sum: calculateDigitalRoot(data.mobile),
      paymentStatus: 'Pending',
      portOutStatus: 'Pending',
      createdBy: user.uid,
    };
    const dealerPurchasesCollection = collection(db, 'dealerPurchases');
    addDoc(dealerPurchasesCollection, newPurchase).then(() => {
        addActivity({
          employeeName: user.displayName || 'User',
          action: 'Added Dealer Purchase',
          description: `Added new dealer purchase for ${data.mobile}`,
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'dealerPurchases',
            operation: 'create',
            requestResourceData: newPurchase,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const updateDealerPurchase = (id: string, statuses: { paymentStatus: 'Done' | 'Pending'; portOutStatus: 'Done' | 'Pending' }) => {
    if (!db || !user) return;
    const purchase = dealerPurchases.find(p => p.id === id);
    if (!purchase) return;
    const docRef = doc(db, 'dealerPurchases', id);

    updateDoc(docRef, statuses).then(() => {
        addActivity({
            employeeName: user.displayName || 'User',
            action: 'Updated Dealer Purchase',
            description: `Updated status for ${purchase.mobile}.`,
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: statuses,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const deletePortOuts = (ids: string[]) => {
    if (!db || !user) return;
    const batch = writeBatch(db);
    ids.forEach(id => {
        batch.delete(doc(db, 'portouts', id));
    });
    batch.commit().then(() => {
        addActivity({
            employeeName: user.displayName || 'User',
            action: 'Deleted Port Out Records',
            description: `Deleted ${ids.length} record(s) from port out history.`
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'portouts',
            operation: 'delete',
            requestResourceData: {info: `Batch delete ${ids.length} records`},
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }

  // Filter data based on role
  const roleFilteredNumbers = role === 'admin' ? numbers : (numbers || []).filter(n => n.assignedTo === user?.displayName);
  const roleFilteredReminders = role === 'admin' ? reminders : (reminders || []).filter(r => r.assignedTo === user?.displayName);

  const value: AppContextType = {
    loading,
    numbers: roleFilteredNumbers,
    sales,
    portOuts,
    reminders: roleFilteredReminders,
    activities,
    employees,
    dealerPurchases,
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
