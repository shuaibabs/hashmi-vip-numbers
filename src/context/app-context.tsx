
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  type Activity,
  type NumberRecord,
  type Reminder,
  type SaleRecord,
  NewNumberData,
  type DealerPurchaseRecord,
  NewDealerPurchaseData,
  type PortOutRecord,
  NewReminderData,
  type User,
} from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { isToday, isPast, isValid, parse, subDays } from 'date-fns';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

// Helper to get the next serial number for a collection
const getNextSrNo = (records: { srNo?: number }[]): number => {
  if (!records || records.length === 0) {
    return 1;
  }
  const maxSrNo = Math.max(...records.map(r => r.srNo || 0));
  return maxSrNo + 1;
};

// Helper function to map snapshot to data with ID
const mapSnapshotToData = <T extends { id: string }>(snapshot: QuerySnapshot<DocumentData>): T[] => {
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as T));
};

// Helper function to convert undefined values to null in an object
const sanitizeObjectForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) {
        return null;
    }
    if (typeof obj !== 'object' || obj instanceof Timestamp || obj instanceof Date) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObjectForFirestore(item));
    }

    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            newObj[key] = value === undefined ? null : sanitizeObjectForFirestore(value);
        }
    }
    return newObj;
};

type BulkAddResult = {
  validRecords: NewNumberData[];
  failedRecords: { record: any, reason: string }[];
}

type AppContextType = {
  loading: boolean;
  numbers: NumberRecord[];
  sales: SaleRecord[];
  portOuts: PortOutRecord[];
  reminders: Reminder[];
  activities: Activity[];
  users: User[];
  employees: string[];
  vendors: string[];
  dealerPurchases: DealerPurchaseRecord[];
  seenActivitiesCount: number;
  markActivitiesAsSeen: () => void;
  isMobileNumberDuplicate: (mobile: string, currentId?: string) => boolean;
  updateNumberStatus: (id: string, status: 'RTS' | 'Non-RTS', rtsDate: Date | null, note?: string) => void;
  updateUploadStatus: (id: string, uploadStatus: 'Pending' | 'Done') => void;
  bulkUpdateUploadStatus: (numberIds: string[], uploadStatus: 'Pending' | 'Done') => void;
  updateSaleStatuses: (id: string, statuses: { paymentStatus: 'Done' | 'Pending'; upcStatus: 'Generated' | 'Pending'; }) => void;
  bulkUpdateUpcStatus: (saleIds: string[], upcStatus: 'Pending' | 'Generated') => void;
  markSaleAsPortedOut: (saleId: string) => void;
  bulkMarkAsPortedOut: (sales: SaleRecord[]) => void;
  markReminderDone: (id: string, note?: string) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'srNo' | 'timestamp' | 'createdBy'>, showToast?: boolean) => void;
  assignNumbersToEmployee: (numberIds: string[], employeeName: string, location: { locationType: 'Store' | 'Employee' | 'Dealer'; currentLocation: string; }) => void;
  checkInNumber: (id: string) => void;
  sellNumber: (id: string, details: { salePrice: number; soldTo: string; saleDate: Date }) => void;
  bulkSellNumbers: (numbersToSell: NumberRecord[], details: { salePrice: number; soldTo: string; saleDate: Date; }) => void;
  cancelSale: (saleId: string) => void;
  addNumber: (data: NewNumberData) => void;
  addMultipleNumbers: (data: NewNumberData) => Promise<void>;
  addDealerPurchase: (data: NewDealerPurchaseData) => void;
  updateDealerPurchase: (id: string, statuses: { paymentStatus: 'Done' | 'Pending'; portOutStatus: 'Done' | 'Pending'; upcStatus: 'Generated' | 'Pending' }) => void;
  deletePortOuts: (records: PortOutRecord[]) => void;
  bulkAddNumbers: (records: any[]) => Promise<BulkAddResult>;
  addReminder: (data: NewReminderData) => void;
  deleteReminder: (id: string) => void;
  deleteDealerPurchases: (records: DealerPurchaseRecord[]) => void;
  updatePortOutStatus: (id: string, status: { paymentStatus: 'Done' | 'Pending' }) => void;
  bulkUpdatePortOutPaymentStatus: (portOutIds: string[], paymentStatus: 'Pending' | 'Done') => void;
  deleteActivities: (activityIds: string[]) => void;
  updateSafeCustodyDate: (numberId: string, newDate: Date) => void;
  deleteNumbers: (numberIds: string[]) => void;
  deleteUser: (uid: string) => void;
  updateNumberLocation: (numberIds: string[], location: { locationType: 'Store' | 'Employee' | 'Dealer', currentLocation: string }) => void;
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
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<string[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  
  const [roleFilteredActivities, setRoleFilteredActivities] = useState<Activity[]>([]);
  const [seenActivitiesCount, setSeenActivitiesCount] = useState(0);

  const [numbersLoading, setNumbersLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [portOutsLoading, setPortOutsLoading] = useState(true);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [dealerPurchasesLoading, setDealerPurchasesLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

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
    
  const getSeenCountKey = useCallback(() => {
    return user ? `seenActivitiesCount_${user.uid}` : null;
  }, [user?.uid]);


  useEffect(() => {
    // This effect runs only when activities are loaded or the user changes.
    // It prevents a race condition on login where the seen count is calculated before activities are present.
    if (activitiesLoading || !user) return; 

    const seenCountKey = getSeenCountKey();
    if (seenCountKey) {
        let storedCount = Number(localStorage.getItem(seenCountKey) || 0);
        // Ensure the stored count is not greater than the actual number of activities
        if (storedCount > activities.length) {
            storedCount = activities.length;
            localStorage.setItem(seenCountKey, String(storedCount));
        }
        setSeenActivitiesCount(storedCount);
    } else {
        setSeenActivitiesCount(0);
    }
  }, [activities.length, activitiesLoading, user, getSeenCountKey]);


  const markActivitiesAsSeen = useCallback(() => {
    const total = activities.length;
    const seenCountKey = getSeenCountKey();
    if (seenCountKey) {
        setSeenActivitiesCount(total);
        localStorage.setItem(seenCountKey, String(total));
    }
  }, [activities.length, getSeenCountKey]);

  const addActivity = useCallback((activity: Omit<Activity, 'id' | 'srNo' | 'timestamp' | 'createdBy'>, showToast = true) => {
    if (!db || !user) return;
    const newActivity = { 
        ...activity, 
        srNo: getNextSrNo(activities),
        timestamp: serverTimestamp(),
        createdBy: user.uid,
    };
    addDoc(collection(db, 'activities'), newActivity)
      .then(() => {
        if (showToast) {
          toast({
            title: activity.action,
            description: activity.description,
          });
        }
      })
      .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: 'activities',
            operation: 'create',
            requestResourceData: newActivity,
          });
          errorEmitter.emit('permission-error', permissionError);
      });
  }, [db, user, activities, toast]);
  

  useEffect(() => {
    if (!db || !user) {
      // If not logged in, reset state and stop loading
      setNumbers([]);
      setSales([]);
      setPortOuts([]);
      setReminders([]);
      setActivities([]);
      setDealerPurchases([]);
      setUsers([]);
      setEmployees([]);
      setVendors([]);
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
      { name: 'users', setter: (data: User[]) => {
          setUsers(data);
          setEmployees(data.map(u => u.displayName).sort())
        }, 
        loader: setUsersLoading 
      },
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

  useEffect(() => {
    if (loading || !user) return;

    if (role === 'admin') {
      setRoleFilteredActivities(activities);
    } else {
      const filtered = activities.filter(
        (activity) => activity.employeeName === user.displayName
      );
      setRoleFilteredActivities(filtered);
    }
  }, [activities, role, user, loading]);

  // Effect to derive vendors list
  useEffect(() => {
    const allSalesVendors = sales.map(s => s.soldTo);
    const uniqueVendors = [...new Set(allSalesVendors)];
    setVendors(uniqueVendors.sort());
  }, [sales]);


  const isMobileNumberDuplicate = (mobile: string, currentId?: string): boolean => {
    if (!mobile) return false;
    const allNumbers: { id?: string, mobile: string }[] = [
      ...numbers,
      ...sales,
      ...portOuts,
      ...dealerPurchases,
    ];
  
    return allNumbers.some(item => 
      item.mobile === mobile && (!currentId || item.id !== currentId)
    );
  };


  useEffect(() => {
    if (!db || numbersLoading) {
      return;
    }
    const checkRtsDates = async () => {
      if (!db) {
        return;
      }

      const batch = writeBatch(db);
      let updated = false;
      
      numbers.forEach(num => {
        if (num.status === 'Non-RTS' && num.rtsDate) {
           const rtsDateObj = num.rtsDate.toDate();
          if (isValid(rtsDateObj) && (isToday(rtsDateObj) || isPast(rtsDateObj))) {
            const docRef = doc(db, 'numbers', num.id);
            batch.update(docRef, {
                status: 'RTS',
                rtsDate: null,
            });
            addActivity({
                employeeName: 'System',
                action: 'Auto-updated to RTS',
                description: `Number ${num.mobile} automatically became RTS.`
            }, false);
            updated = true;
          }
        }
      });

      if (updated) {
        await batch.commit().catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: 'numbers',
                operation: 'update',
                requestResourceData: {info: 'Batch update for RTS status'},
            });
            errorEmitter.emit('permission-error', permissionError);
        });
      }
    };

    // Run once on load, then set an interval
    checkRtsDates();
    const interval = setInterval(checkRtsDates, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [db, numbers, numbersLoading, addActivity]);
  
  useEffect(() => {
    if (!db || numbersLoading) {
      return;
    }
    const checkSafeCustodyDates = async () => {
        if (!db) return;

        const batch = writeBatch(db);
        let updated = false;

        numbers.forEach(num => {
            if (num.numberType === 'COCP' && num.safeCustodyDate && !num.safeCustodyNotificationSent) {
                const custodyDate = num.safeCustodyDate.toDate();
                if (isValid(custodyDate) && (isToday(custodyDate) || isPast(custodyDate))) {
                    const docRef = doc(db, 'numbers', num.id);
                    batch.update(docRef, { safeCustodyNotificationSent: true });
                    addActivity({
                        employeeName: 'System',
                        action: 'Safe Custody Date Arrived',
                        description: `Safe Custody Date for COCP number ${num.mobile} has arrived.`,
                    }, false);
                    updated = true;
                }
            }
        });

        if (updated) {
            await batch.commit().catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: 'numbers',
                    operation: 'update',
                    requestResourceData: { info: 'Batch update for safe custody notifications' },
                });
                errorEmitter.emit('permission-error', permissionError);
            });
        }
    };
    
    checkSafeCustodyDates();
    const interval = setInterval(checkSafeCustodyDates, 60 * 60 * 1000); // Check every hour
    return () => clearInterval(interval);

  }, [db, numbers, numbersLoading, addActivity]);

  useEffect(() => {
    if (!db || remindersLoading || role !== 'admin') {
      return;
    }

    const cleanupOldReminders = async () => {
      const sevenDaysAgo = subDays(new Date(), 7);
      const remindersToDelete: Reminder[] = [];

      reminders.forEach(reminder => {
        if (
          reminder.status === 'Done' &&
          reminder.completionDate &&
          reminder.completionDate.toDate() < sevenDaysAgo
        ) {
          remindersToDelete.push(reminder);
        }
      });

      if (remindersToDelete.length > 0) {
        const batch = writeBatch(db);
        remindersToDelete.forEach(reminder => {
          batch.delete(doc(db, 'reminders', reminder.id));
        });
        
        await batch.commit().catch(e => console.error("Error auto-deleting reminders:", e));
        
        addActivity({
            employeeName: 'System',
            action: 'Auto-deleted reminders',
            description: `Automatically deleted ${remindersToDelete.length} completed reminder(s) older than 7 days.`,
        }, false);
      }
    };
    
    // Run once on load, then set an interval
    cleanupOldReminders();
    const intervalId = setInterval(cleanupOldReminders, 24 * 60 * 60 * 1000); // Check once a day
    
    return () => clearInterval(intervalId);

  }, [db, reminders, remindersLoading, role, addActivity]);


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
            employeeName: user.displayName || user.email || 'User',
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

  const updateUploadStatus = (id: string, uploadStatus: 'Pending' | 'Done') => {
    if (!db || !user) return;
    const numDocRef = doc(db, 'numbers', id);
    const num = numbers.find(n => n.id === id);
    if (!num) return;

    const updateData = { uploadStatus };
    
    updateDoc(numDocRef, updateData).then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
            action: 'Updated Upload Status',
            description: `Set upload status for ${num.mobile} to ${uploadStatus}`
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

  const bulkUpdateUploadStatus = (numberIds: string[], uploadStatus: 'Pending' | 'Done') => {
    if (!db || !user) return;
    const batch = writeBatch(db);
    const updateData = { uploadStatus };
    numberIds.forEach(id => {
      const docRef = doc(db, 'numbers', id);
      batch.update(docRef, updateData);
    });
    batch.commit().then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
            action: 'Bulk Updated Upload Status',
            description: `Updated upload status for ${numberIds.length} number(s) to ${uploadStatus}.`
        });
         toast({
            title: "Update Successful",
            description: `Updated upload status for ${numberIds.length} record(s).`
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'numbers',
            operation: 'update',
            requestResourceData: {info: `Bulk upload status update for ${numberIds.length} numbers`},
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const updateSaleStatuses = (id: string, statuses: { paymentStatus: 'Done' | 'Pending'; upcStatus: 'Generated' | 'Pending'; }) => {
    if (!db || !user) return;
    const saleToUpdate = sales.find(s => s.id === id);
    if (!saleToUpdate) return;
    
    const saleDocRef = doc(db, 'sales', id);
    updateDoc(saleDocRef, statuses).then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
            action: 'Updated Sale Status',
            description: `Updated sale for ${saleToUpdate.mobile}. Payment: ${statuses.paymentStatus}, UPC: ${statuses.upcStatus}.`,
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: saleDocRef.path,
            operation: 'update',
            requestResourceData: statuses,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const bulkUpdateUpcStatus = (saleIds: string[], upcStatus: 'Pending' | 'Generated') => {
    if (!db || !user) return;
    const batch = writeBatch(db);
    const updateData = { upcStatus };
    saleIds.forEach(id => {
      const docRef = doc(db, 'sales', id);
      batch.update(docRef, updateData);
    });
    batch.commit().then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
            action: 'Bulk Updated UPC Status',
            description: `Updated UPC status for ${saleIds.length} sale(s) to ${upcStatus}.`
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'sales',
            operation: 'update',
            requestResourceData: {info: `Bulk UPC status update for ${saleIds.length} sales`},
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const markSaleAsPortedOut = (saleId: string) => {
    if (!db || !user) return;
    const saleToMove = sales.find(s => s.id === saleId);
    if (!saleToMove) {
        toast({
            variant: "destructive",
            title: "Operation Failed",
            description: "Could not find the sale record to move.",
        });
        return;
    }

    if (!saleToMove.originalNumberData) {
         toast({
            variant: "destructive",
            title: "Operation Failed",
            description: "Could not find original number data to archive.",
        });
        return;
    }

    const batch = writeBatch(db);
    
    const sanitizedOriginalData = sanitizeObjectForFirestore(saleToMove.originalNumberData);

    const newPortOutData: Omit<PortOutRecord, 'id'> = {
        srNo: getNextSrNo(portOuts),
        mobile: saleToMove.mobile,
        sum: saleToMove.sum,
        soldTo: saleToMove.soldTo,
        salePrice: saleToMove.salePrice,
        paymentStatus: saleToMove.paymentStatus,
        uploadStatus: saleToMove.uploadStatus,
        saleDate: saleToMove.saleDate,
        upcStatus: saleToMove.upcStatus,
        createdBy: saleToMove.createdBy,
        originalNumberData: sanitizedOriginalData,
        portOutDate: Timestamp.now(),
    };

    batch.set(doc(collection(db, 'portouts')), newPortOutData);
    batch.delete(doc(db, 'sales', saleId));
    
    batch.commit().then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
            action: 'Marked Port Out Done',
            description: `Number ${saleToMove.mobile} has been ported out and moved to history.`,
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: `portouts and sales/${saleId}`,
            operation: 'write',
            requestResourceData: { info: `Batch write for port out of ${saleToMove.mobile}` },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
};

const bulkMarkAsPortedOut = (salesToMove: SaleRecord[]) => {
    if (!db || !user || salesToMove.length === 0) return;

    const eligibleSales = salesToMove.filter(s => s.upcStatus === 'Generated');
    const skippedCount = salesToMove.length - eligibleSales.length;

    if (eligibleSales.length === 0) {
      toast({
        variant: "destructive",
        title: "No Eligible Records",
        description: "None of the selected records have a 'Generated' UPC status.",
      });
      return;
    }

    let currentPortOutSrNo = getNextSrNo(portOuts);
    const batch = writeBatch(db);

    eligibleSales.forEach(sale => {
      const sanitizedOriginalData = sanitizeObjectForFirestore(sale.originalNumberData);
      const newPortOutData: Omit<PortOutRecord, 'id'> = {
        srNo: currentPortOutSrNo++,
        mobile: sale.mobile,
        sum: sale.sum,
        soldTo: sale.soldTo,
        salePrice: sale.salePrice,
        paymentStatus: sale.paymentStatus,
        uploadStatus: sale.uploadStatus,
        saleDate: sale.saleDate,
        upcStatus: sale.upcStatus,
        createdBy: sale.createdBy,
        originalNumberData: sanitizedOriginalData,
        portOutDate: Timestamp.now(),
      };
      batch.set(doc(collection(db, 'portouts')), newPortOutData);
      batch.delete(doc(db, 'sales', sale.id));
    });

    batch.commit().then(() => {
      let description = `${eligibleSales.length} record(s) marked as ported out.`;
      if (skippedCount > 0) {
        description += ` ${skippedCount} record(s) were skipped because their UPC was not generated.`;
      }
      addActivity({
        employeeName: user.displayName || user.email || 'User',
        action: 'Bulk Port Out',
        description: `Bulk ported out ${eligibleSales.length} record(s).`
      });
       toast({
        title: "Bulk Port Out Successful",
        description: description,
      });
    }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: 'sales/portouts',
        operation: 'write',
        requestResourceData: { info: `Bulk port out of ${eligibleSales.length} sales.` },
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const markReminderDone = (id: string, note?: string) => {
    if (!db || !user) return;
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    const reminderDocRef = doc(db, 'reminders', id);

    const updateData: { status: 'Done'; notes?: string; completionDate: Timestamp } = { 
        status: 'Done',
        completionDate: Timestamp.now(),
    };
    if (note) {
      updateData.notes = note;
    }
    
    updateDoc(reminderDocRef, updateData).then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
            action: 'Marked Task Done',
            description: `Completed task: ${reminder.taskName}`
        })
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: reminderDocRef.path,
            operation: 'update',
            requestResourceData: { status: 'Done', note },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const assignNumbersToEmployee = (numberIds: string[], employeeName: string, location: { locationType: 'Store' | 'Employee' | 'Dealer'; currentLocation: string; }) => {
    if (!db || !user) return;
    const batch = writeBatch(db);
    const updateData = {
        assignedTo: employeeName,
        name: employeeName,
        locationType: location.locationType,
        currentLocation: location.currentLocation,
    };
    numberIds.forEach(id => {
      const docRef = doc(db, 'numbers', id);
      batch.update(docRef, updateData);
    });
    batch.commit().then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
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
  
  const checkInNumber = (id: string) => {
    if (!db || !user) return;
    const num = numbers.find(n => n.id === id);
    if (!num) return;
    const numDocRef = doc(db, 'numbers', id);
    updateDoc(numDocRef, { checkInDate: Timestamp.now() }).then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
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

  const sellNumber = (id: string, details: { salePrice: number; soldTo: string; saleDate: Date }) => {
    if (!db || !user) return;
    const soldNumber = numbers.find(n => n.id === id);
    if (!soldNumber) return;

    const { id: numberId, ...originalDataWithoutId } = soldNumber;

    const sanitizedOriginalData = sanitizeObjectForFirestore(originalDataWithoutId);

    const newSale: Omit<SaleRecord, 'id'> = {
      srNo: getNextSrNo(sales),
      mobile: soldNumber.mobile,
      sum: calculateDigitalRoot(soldNumber.mobile),
      salePrice: details.salePrice,
      soldTo: details.soldTo,
      paymentStatus: 'Pending',
      portOutStatus: 'Pending',
      upcStatus: 'Pending',
      uploadStatus: soldNumber.uploadStatus || 'Pending',
      saleDate: Timestamp.fromDate(details.saleDate),
      createdBy: user.uid,
      originalNumberData: sanitizedOriginalData,
    };

    const batch = writeBatch(db);
    batch.set(doc(collection(db, 'sales')), newSale);
    batch.delete(doc(db, 'numbers', id));
    batch.commit().then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
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

  const bulkSellNumbers = (numbersToSell: NumberRecord[], details: { salePrice: number; soldTo: string; saleDate: Date; }) => {
    if (!db || !user) return;
    if (numbersToSell.length === 0) return;

    let currentSaleSrNo = getNextSrNo(sales);
    const batch = writeBatch(db);

    numbersToSell.forEach(soldNumber => {
      const { id: numberId, ...originalDataWithoutId } = soldNumber;
      const sanitizedOriginalData = sanitizeObjectForFirestore(originalDataWithoutId);

      const newSale: Omit<SaleRecord, 'id'> = {
        srNo: currentSaleSrNo++,
        mobile: soldNumber.mobile,
        sum: calculateDigitalRoot(soldNumber.mobile),
        salePrice: details.salePrice,
        soldTo: details.soldTo,
        paymentStatus: 'Pending',
        portOutStatus: 'Pending',
        upcStatus: 'Pending',
        uploadStatus: soldNumber.uploadStatus || 'Pending',
        saleDate: Timestamp.fromDate(details.saleDate),
        createdBy: user.uid,
        originalNumberData: sanitizedOriginalData,
      };
      
      batch.set(doc(collection(db, 'sales')), newSale);
      batch.delete(doc(db, 'numbers', soldNumber.id));
    });

    batch.commit().then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
            action: 'Bulk Sold Numbers',
            description: `Sold ${numbersToSell.length} number(s) to ${details.soldTo}.`
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'sales/numbers',
            operation: 'write',
            requestResourceData: { info: `Bulk sell of ${numbersToSell.length} numbers.` },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const cancelSale = (saleId: string) => {
    if (!db || !user) return;
    const saleToCancel = sales.find(s => s.id === saleId);
    
    if (!saleToCancel) {
         toast({
            variant: "destructive",
            title: "Cancellation Failed",
            description: "Could not find the sale record.",
        });
        return;
    }
    
    if (!saleToCancel.originalNumberData) {
        toast({
            variant: "destructive",
            title: "Cancellation Failed",
            description: "Could not find original number data to restore.",
        });
        return;
    }

    const restoredNumberData = sanitizeObjectForFirestore(saleToCancel.originalNumberData);

    const restoredNumber: Omit<NumberRecord, 'id'> = {
        ...(restoredNumberData as Omit<NumberRecord, 'id'>),
        assignedTo: 'Unassigned',
        name: 'Unassigned',
    };

    const batch = writeBatch(db);
    batch.set(doc(collection(db, 'numbers')), restoredNumber);
    batch.delete(doc(db, 'sales', saleId));
    batch.commit().then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
            action: 'Cancelled Sale',
            description: `Sale of number ${saleToCancel.mobile} was cancelled.`
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'sales/numbers',
            operation: 'write',
            requestResourceData: { info: `Cancel sale for ${saleToCancel.mobile}` },
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
    
    const assignedToUser = user.displayName || user.email || 'User';

    const newNumber: Partial<NumberRecord> = {
        ...data,
        srNo: getNextSrNo(numbers),
        sum: calculateDigitalRoot(data.mobile),
        upcStatus: 'Pending',
        rtsDate: data.status === 'Non-RTS' && data.rtsDate ? Timestamp.fromDate(data.rtsDate) : null,
        safeCustodyDate: data.numberType === 'COCP' && data.safeCustodyDate ? Timestamp.fromDate(data.safeCustodyDate) : null,
        assignedTo: assignedToUser,
        name: assignedToUser,
        checkInDate: null,
        createdBy: user.uid,
        purchaseDate: Timestamp.fromDate(data.purchaseDate),
    };

    if (data.ownershipType !== 'Partnership') {
        newNumber.partnerName = '';
    } else {
        newNumber.partnerName = data.partnerName;
    }
    
    if (data.numberType === 'COCP') {
        newNumber.accountName = data.accountName;
    } else {
        delete (newNumber as any).accountName;
        delete (newNumber as any).safeCustodyDate;
    }

    const numbersCollection = collection(db, 'numbers');
    addDoc(numbersCollection, sanitizeObjectForFirestore(newNumber)).then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
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

  const addMultipleNumbers = async (data: NewNumberData) => {
    if (!db || !user) return;
    
    const mobileNumbers = data.mobile.split(/[\n,]+/).map(n => n.trim()).filter(n => n);
    const assignedToUser = user.displayName || user.email || 'User';

    const validNumbers: string[] = [];
    const skippedNumbers: string[] = [];

    for (const mobile of mobileNumbers) {
      if (!/^\d{10}$/.test(mobile) || isMobileNumberDuplicate(mobile)) {
        skippedNumbers.push(mobile);
        continue;
      }
      validNumbers.push(mobile);
    }
    
    if (validNumbers.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Valid Numbers to Add',
        description: 'All numbers entered were either invalid (not 10 digits) or already exist.',
      });
      return;
    }
    
    let currentSrNo = getNextSrNo(numbers);
    const batch = writeBatch(db);
    const numbersCollection = collection(db, 'numbers');

    validNumbers.forEach(mobile => {
      const newDocRef = doc(numbersCollection);
      const newNumber: Partial<NumberRecord> = {
          ...data,
          mobile,
          srNo: currentSrNo++,
          sum: calculateDigitalRoot(mobile),
          upcStatus: 'Pending',
          rtsDate: data.status === 'Non-RTS' && data.rtsDate ? Timestamp.fromDate(data.rtsDate) : null,
          safeCustodyDate: data.numberType === 'COCP' && data.safeCustodyDate ? Timestamp.fromDate(data.safeCustodyDate) : null,
          assignedTo: assignedToUser,
          name: assignedToUser,
          checkInDate: null,
          createdBy: user.uid,
          purchaseDate: Timestamp.fromDate(data.purchaseDate),
      };

      if (data.ownershipType !== 'Partnership') newNumber.partnerName = '';
      if (data.numberType !== 'COCP') {
        delete (newNumber as any).accountName;
        delete (newNumber as any).safeCustodyDate;
      }
      batch.set(newDocRef, sanitizeObjectForFirestore(newNumber));
    });

    await batch.commit().then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
            action: 'Bulk Added Numbers',
            description: `Added ${validNumbers.length} new number(s).`
        });
        let toastDescription = `Successfully added ${validNumbers.length} number(s).`;
        if (skippedNumbers.length > 0) {
          toastDescription += ` Skipped ${skippedNumbers.length} invalid or duplicate number(s).`;
        }
        toast({
          title: 'Bulk Add Complete',
          description: toastDescription,
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'numbers',
            operation: 'create',
            requestResourceData: { info: `Bulk add of ${validNumbers.length} numbers.` },
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
      upcStatus: 'Pending',
      createdBy: user.uid,
    };
    const dealerPurchasesCollection = collection(db, 'dealerPurchases');
    addDoc(dealerPurchasesCollection, newPurchase).then(() => {
        addActivity({
          employeeName: user.displayName || user.email || 'User',
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

  const updateDealerPurchase = (id: string, statuses: { paymentStatus: 'Done' | 'Pending'; portOutStatus: 'Done' | 'Pending'; upcStatus: 'Generated' | 'Pending' }) => {
    if (!db || !user) return;
    const purchase = dealerPurchases.find(p => p.id === id);
    if (!purchase) return;
    const docRef = doc(db, 'dealerPurchases', id);

    updateDoc(docRef, statuses).then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
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

  const deletePortOuts = (recordsToDelete: PortOutRecord[]) => {
    if (!db || !user) return;

    const pendingPaymentRecords = recordsToDelete.filter(r => r.paymentStatus === 'Pending');
    if (pendingPaymentRecords.length > 0) {
        toast({
            variant: "destructive",
            title: "Deletion Blocked",
            description: `Cannot delete ${pendingPaymentRecords.length} record(s) with "Pending" payment status. Please mark payments as "Done" first.`,
            duration: 5000,
        });
        return;
    }
    
    const idsToDelete = recordsToDelete.map(r => r.id);

    const batch = writeBatch(db);
    idsToDelete.forEach(id => {
        batch.delete(doc(db, 'portouts', id));
    });

    batch.commit().then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
            action: 'Deleted Port Out Records',
            description: `Deleted ${idsToDelete.length} record(s) from port out history.`
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'portouts',
            operation: 'delete',
            requestResourceData: {info: `Batch delete ${idsToDelete.length} records`},
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }

  const deleteDealerPurchases = (recordsToDelete: DealerPurchaseRecord[]) => {
    if (!db || !user) return;

    const recordsThatCanBeDeleted: DealerPurchaseRecord[] = [];
    const recordsThatCannotBeDeleted: DealerPurchaseRecord[] = [];

    recordsToDelete.forEach(record => {
      if (record.paymentStatus === 'Done' && record.portOutStatus === 'Done' && record.upcStatus === 'Generated') {
        recordsThatCanBeDeleted.push(record);
      } else {
        recordsThatCannotBeDeleted.push(record);
      }
    });
    
    if (recordsThatCannotBeDeleted.length > 0) {
      toast({
        variant: "destructive",
        title: "Deletion Blocked",
        description: `${recordsThatCannotBeDeleted.length} record(s) could not be deleted because all statuses are not complete.`,
        duration: 7000,
      });
    }

    if (recordsThatCanBeDeleted.length === 0) {
      return; // No records to delete
    }

    const idsToDelete = recordsThatCanBeDeleted.map(r => r.id);
    const batch = writeBatch(db);
    idsToDelete.forEach(id => {
      batch.delete(doc(db, 'dealerPurchases', id));
    });

    batch.commit().then(() => {
      addActivity({
        employeeName: user.displayName || user.email || 'User',
        action: 'Deleted Dealer Purchases',
        description: `Deleted ${idsToDelete.length} completed record(s) from dealer purchases.`
      });
    }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: 'dealerPurchases',
        operation: 'delete',
        requestResourceData: { info: `Batch delete ${idsToDelete.length} records` },
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const deleteActivities = (activityIds: string[]) => {
    if (!db || !user || role !== 'admin') {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You do not have permission to delete activities.",
      });
      return;
    };
    
    const batch = writeBatch(db);
    activityIds.forEach(id => {
        batch.delete(doc(db, 'activities', id));
    });

    batch.commit().then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
            action: 'Deleted Activities',
            description: `Deleted ${activityIds.length} activity record(s).`
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'activities',
            operation: 'delete',
            requestResourceData: {info: `Batch delete ${activityIds.length} activities`},
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }
  
  const updatePortOutStatus = (id: string, status: { paymentStatus: 'Done' | 'Pending' }) => {
    if (!db || !user) return;
    const portOut = portOuts.find(p => p.id === id);
    if (!portOut) return;
    const docRef = doc(db, 'portouts', id);

    updateDoc(docRef, status).then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
            action: 'Updated Port Out Status',
            description: `Updated payment status for ${portOut.mobile} to ${status.paymentStatus}.`,
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: status,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const bulkUpdatePortOutPaymentStatus = (portOutIds: string[], paymentStatus: 'Pending' | 'Done') => {
    if (!db || !user) return;
    const batch = writeBatch(db);
    const updateData = { paymentStatus };
    portOutIds.forEach(id => {
      const docRef = doc(db, 'portouts', id);
      batch.update(docRef, updateData);
    });
    batch.commit().then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
            action: 'Bulk Updated Port Out Payment Status',
            description: `Updated payment status for ${portOutIds.length} port out record(s) to ${paymentStatus}.`
        });
        toast({
            title: "Update Successful",
            description: `Updated payment status for ${portOutIds.length} record(s).`
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'portouts',
            operation: 'update',
            requestResourceData: {info: `Bulk payment status update for ${portOutIds.length} records`},
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const updateSafeCustodyDate = (numberId: string, newDate: Date) => {
    if (!db || !user) return;
    const num = numbers.find(n => n.id === numberId);
    if (!num) return;

    const numDocRef = doc(db, 'numbers', numberId);
    const updateData = { safeCustodyDate: Timestamp.fromDate(newDate) };
    
    updateDoc(numDocRef, updateData).then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
            action: 'Updated Safe Custody Date',
            description: `Updated Safe Custody Date for ${num.mobile} to ${newDate.toLocaleDateString()}`
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

  const deleteNumbers = (numberIds: string[]) => {
    if (!db || !user || role !== 'admin') {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You do not have permission to delete number records.",
      });
      return;
    }

    const batch = writeBatch(db);
    numberIds.forEach(id => {
      batch.delete(doc(db, 'numbers', id));
    });

    batch.commit().then(() => {
      addActivity({
        employeeName: user.displayName || user.email || 'User',
        action: 'Deleted Numbers',
        description: `Permanently deleted ${numberIds.length} number record(s).`
      });
    }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: 'numbers',
        operation: 'delete',
        requestResourceData: { info: `Batch delete ${numberIds.length} numbers` },
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const deleteUser = (uid: string) => {
    if (!db || !user || role !== 'admin') {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You do not have permission to delete users.",
      });
      return;
    }
    if (uid === user.uid) {
        toast({
            variant: "destructive",
            title: "Action Forbidden",
            description: "You cannot delete your own account.",
        });
        return;
    }
    const docRef = doc(db, 'users', uid);
    // This will trigger the onDelete cloud function to delete the user from Auth
    deleteDoc(docRef).then(() => {
        const deletedUser = users.find(u => u.uid === uid);
        addActivity({
            employeeName: user.displayName || user.email || 'User',
            action: 'Deleted User',
            description: `Deleted the user account for ${deletedUser?.displayName || 'Unknown'}.`
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const updateNumberLocation = (numberIds: string[], location: { locationType: 'Store' | 'Employee' | 'Dealer', currentLocation: string }) => {
    if (!db || !user) return;
    const batch = writeBatch(db);
    numberIds.forEach(id => {
      const docRef = doc(db, 'numbers', id);
      batch.update(docRef, location);
    });
    batch.commit().then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
            action: 'Updated Number Location',
            description: `Updated location for ${numberIds.length} number(s) to ${location.currentLocation}.`
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'numbers',
            operation: 'update',
            requestResourceData: {info: `Batch location update for ${numberIds.length} numbers`},
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const bulkAddNumbers = async (records: any[]): Promise<BulkAddResult> => {
    if (!db || !user) return { validRecords: [], failedRecords: [] };
    
    let currentSrNo = getNextSrNo(numbers);
    const validRecords: any[] = [];
    const failedRecords: { record: any, reason: string }[] = [];
    const assignedToUser = user.displayName || user.email || 'User';

    const existingMobiles = new Set([
        ...numbers.map(n => n.mobile),
        ...sales.map(s => s.mobile),
        ...portOuts.map(p => p.mobile),
        ...dealerPurchases.map(d => d.mobile),
    ]);
    
    const parseDate = (rawDate: any): Date | null => {
        if (rawDate instanceof Date && isValid(rawDate)) {
            return rawDate;
        }
        if (typeof rawDate === 'string') {
            const dateFormats = [
                'dd-MM-yyyy', 'MM-dd-yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy', 'yyyy/MM/dd', 
                "M/d/yy", "M/d/yyyy", "MM/dd/yy",
            ];
            for (const formatStr of dateFormats) {
                const parsed = parse(rawDate, formatStr, new Date());
                if (isValid(parsed)) return parsed;
            }
        }
        return null;
    };


    for (const record of records) {
        const mobile = record.Mobile?.toString().trim();

        if (!mobile || !/^\d{10}$/.test(mobile)) {
            failedRecords.push({ record, reason: 'Invalid or missing mobile number (must be 10 digits).' });
            continue;
        }
        if (existingMobiles.has(mobile)) {
            failedRecords.push({ record, reason: 'Duplicate mobile number.' });
            continue;
        }
        
        const status = record.Status;
        if (!status || !['RTS', 'Non-RTS'].includes(status)) {
            failedRecords.push({ record, reason: 'Status is a required field. Must be "RTS" or "Non-RTS".' });
            continue;
        }
        
        const uploadStatus = ['Pending', 'Done'].includes(record.UploadStatus) ? record.UploadStatus : 'Pending';
        
        const numberType = ['Prepaid', 'Postpaid', 'COCP'].includes(record.NumberType) ? record.NumberType : 'Prepaid';

        const ownershipTypeRaw = record.OwnershipType;
        const ownershipType = ['Individual', 'Partnership'].includes(ownershipTypeRaw) ? ownershipTypeRaw : 'Individual';
        
        const partnerNameRaw = record.PartnerName;
        const partnerName = partnerNameRaw?.trim();

        if (ownershipType === 'Partnership' && !partnerName) {
            failedRecords.push({ record, reason: 'PartnerName is required for Partnership ownership.' });
            continue;
        }

        const safeCustodyDate = parseDate(record.SafeCustodyDate);
        if (numberType === 'COCP' && !safeCustodyDate) {
            failedRecords.push({ record, reason: 'Invalid or missing SafeCustodyDate (required for COCP).' });
            continue;
        }

        const accountName = record.AccountName;
        if (numberType === 'COCP' && !accountName) {
            failedRecords.push({ record, reason: 'Missing AccountName (required for COCP).' });
            continue;
        }

        const rtsDateValue = record.RTSDate;
        let rtsDate: Date | null = null;
        if (status === 'Non-RTS') {
            rtsDate = parseDate(rtsDateValue);
             if (!rtsDate) {
                failedRecords.push({ record, reason: 'Invalid or missing RTSDate (required for Non-RTS status).' });
                continue;
            }
        }
        
        const purchaseDate = parseDate(record.PurchaseDate);
        if (!purchaseDate) {
             failedRecords.push({ record, reason: 'Invalid or missing PurchaseDate.' });
             continue;
        }
        
        const purchasePrice = parseFloat(record.PurchasePrice);
        if (isNaN(purchasePrice)) {
            failedRecords.push({ record, reason: 'Invalid or missing PurchasePrice. Must be a number.' });
            continue;
        }
        
        const salePrice = record.SalePrice ? parseFloat(record.SalePrice) : 0;
        
        const newRecord: any = {
            mobile: mobile,
            name: assignedToUser,
            assignedTo: assignedToUser,
            numberType: numberType,
            status: status,
            uploadStatus: uploadStatus,
            rtsDate: rtsDate,
            purchaseFrom: record.PurchaseFrom || 'N/A',
            purchasePrice: purchasePrice,
            salePrice: isNaN(salePrice) ? 0 : salePrice,
            purchaseDate: purchaseDate,
            safeCustodyDate: safeCustodyDate,
            currentLocation: record.CurrentLocation || 'N/A',
            locationType: ['Store', 'Employee', 'Dealer'].includes(record.LocationType) ? record.LocationType : 'Store',
            notes: record.Notes || '',
            ownershipType: ownershipType,
            partnerName: partnerName || '',
        };

        if (numberType === 'COCP') {
            newRecord.accountName = accountName;
        }

        validRecords.push(newRecord);
        existingMobiles.add(mobile);
    }

    if (validRecords.length > 0) {
      const batch = writeBatch(db);
      const numbersCollection = collection(db, 'numbers');
      
      validRecords.forEach(record => {
        const newDocRef = doc(numbersCollection);

        const newNumber: Partial<NumberRecord> = {
            ...record,
            srNo: currentSrNo++,
            sum: calculateDigitalRoot(record.mobile),
            upcStatus: 'Pending',
            checkInDate: null,
            createdBy: user.uid,
            purchaseDate: Timestamp.fromDate(record.purchaseDate),
            rtsDate: record.rtsDate ? Timestamp.fromDate(record.rtsDate) : null,
            safeCustodyDate: record.safeCustodyDate ? Timestamp.fromDate(record.safeCustodyDate) : null,
        };

        if (newNumber.numberType !== 'COCP') {
          delete (newNumber as any).accountName;
          delete (newNumber as any).safeCustodyDate;
        }
        if (newNumber.ownershipType !== 'Partnership') {
          delete (newNumber as any).partnerName;
        }
        
        batch.set(newDocRef, sanitizeObjectForFirestore(newNumber));
      });

      await batch.commit().catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'numbers',
            operation: 'create',
            requestResourceData: {info: `Bulk add of ${validRecords.length} records.`},
        });
        errorEmitter.emit('permission-error', permissionError);
        validRecords.forEach(vr => failedRecords.push({ record: vr, reason: "Firestore permission denied."}));
        return { validRecords: [], failedRecords };
      });
    }
    
    return { validRecords, failedRecords };
  };

  const addReminder = (data: NewReminderData) => {
    if (!db || !user) return;

    const newReminder: Omit<Reminder, 'id'> = {
      ...data,
      srNo: getNextSrNo(reminders),
      status: 'Pending',
      dueDate: Timestamp.fromDate(data.dueDate),
      createdBy: user.uid,
    };
    
    const remindersCollection = collection(db, 'reminders');
    addDoc(remindersCollection, newReminder).then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
            action: 'Added Reminder',
            description: `Assigned task "${data.taskName}" to ${data.assignedTo}`
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'reminders',
            operation: 'create',
            requestResourceData: newReminder,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const deleteReminder = (id: string) => {
    if (!db || !user || role !== 'admin') return;
    const reminderToDelete = reminders.find(r => r.id === id);
    if (!reminderToDelete) return;
    const docRef = doc(db, 'reminders', id);
    deleteDoc(docRef).then(() => {
        addActivity({
            employeeName: user.displayName || user.email || 'User',
            action: 'Deleted Reminder',
            description: `Deleted task: ${reminderToDelete.taskName}`
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
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
    activities: roleFilteredActivities,
    users,
    employees,
    vendors,
    dealerPurchases,
    seenActivitiesCount,
    markActivitiesAsSeen,
    isMobileNumberDuplicate,
    updateNumberStatus,
    updateUploadStatus,
    bulkUpdateUploadStatus,
    updateSaleStatuses,
    bulkUpdateUpcStatus,
    markSaleAsPortedOut,
    bulkMarkAsPortedOut,
    markReminderDone,
    addActivity,
    assignNumbersToEmployee,
    checkInNumber,
    sellNumber,
    bulkSellNumbers,
    cancelSale,
    addNumber,
    addMultipleNumbers,
    addDealerPurchase,
    updateDealerPurchase,
    deletePortOuts,
    bulkAddNumbers,
    addReminder,
    deleteReminder,
    deleteDealerPurchases,
    updatePortOutStatus,
    bulkUpdatePortOutPaymentStatus,
    deleteActivities,
    updateSafeCustodyDate,
    deleteNumbers,
    deleteUser,
    updateNumberLocation,
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

    