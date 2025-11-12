import { addDays, subDays } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

// Base User profile stored in Firestore
export type User = {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'employee';
};

// Raw record from Firestore
export type NumberRecord = {
  id: string; // Firestore document ID
  mobile: string;
  status: 'RTS' | 'Non-RTS';
  numberType: 'Prepaid' | 'Postpaid' | 'COCP';
  purchaseFrom: string;
  purchasePrice: number;
  salePrice: number | string;
  rtsDate: Timestamp | null;
  location: string;
  name: string;
  mobileAlt: string;
  upcStatus: 'Generated' | 'Pending';
  currentLocation: string;
  locationType: 'Store' | 'Employee' | 'Customer';
  assignedTo: string; // Can be 'Unassigned', or employee name like 'Naeem'
  purchaseDate: Timestamp;
  notes?: string;
  activationStatus: 'Done' | 'Pending' | 'Fail';
  uploadStatus: 'Done' | 'Pending' | 'Fail';
  checkInDate: Timestamp | null;
  safeCustodyDate: Timestamp | null;
  createdBy: string; // UID of user who created it
};

// Type for creating a new number, omitting Firestore-generated fields
export type NewNumberData = Omit<
  NumberRecord,
  'id' | 'createdBy' | 'rtsDate' | 'checkInDate' | 'safeCustodyDate' | 'status' | 'activationStatus' | 'uploadStatus'
>;

export type SaleRecord = {
  id: string; // Firestore document ID
  mobile: string;
  soldTo: string;
  salePrice: number;
  paymentStatus: 'Pending' | 'Done';
  saleDate: Timestamp;
  upcStatus: 'Generated' | 'Pending';
  portOutStatus: 'Pending' | 'Done';
  createdBy: string;
};

export type PortOutRecord = Omit<SaleRecord, 'portOutStatus'> & { portOutDate: Timestamp };

export type Reminder = {
  id: string; // Firestore document ID
  taskName: string;
  assignedTo: string;
  status: 'ACT Done' | 'Upload Pending';
  dueDate: Timestamp;
  createdBy: string;
};

export type Activity = {
  id: string; // Firestore document ID
  employeeName: string;
  action: string;
  description: string;
  timestamp: Timestamp;
  createdBy: string;
};

export type DealerPurchaseRecord = {
  id: string; // Firestore document ID
  mobile: string;
  price: number;
  paymentStatus: 'Pending' | 'Done';
  portOutStatus: 'Pending' | 'Done';
  createdBy: string;
};

export type NewDealerPurchaseData = Omit<DealerPurchaseRecord, 'id' | 'createdBy' | 'paymentStatus' | 'portOutStatus'>;

// --- DUMMY DATA FOR SEEDING ---

const now = new Date();
export const DUMMY_EMPLOYEES = ['Naeem', 'Ramesh', 'Suresh'];
const numberTypes: ('Prepaid' | 'Postpaid' | 'COCP')[] = ['Prepaid', 'Postpaid', 'COCP'];

// This is now a function that returns the data, ready for Firestore.
// Note that dates are converted to Firestore Timestamps.
export const getDummyNumbers = (creatorUid: string): Omit<NumberRecord, 'id'>[] =>
  Array.from({ length: 30 }, (_, i) => {
    const isRTS = i % 3 !== 0;
    const assignedEmployee = DUMMY_EMPLOYEES[i % DUMMY_EMPLOYEES.length];

    return {
      mobile: `98765432${String(10 + i).padStart(2, '0')}`,
      status: isRTS ? 'RTS' : 'Non-RTS',
      numberType: numberTypes[i % numberTypes.length],
      purchaseFrom: `Vendor ${String.fromCharCode(65 + (i % 4))}`,
      purchasePrice: 120 + i * 5,
      salePrice: isRTS ? 200 + i * 5 : '',
      rtsDate: isRTS ? null : Timestamp.fromDate(addDays(now, i - 10)),
      location: i % 2 === 0 ? 'Store - Mumbai' : `Employee - ${assignedEmployee}`,
      name: assignedEmployee,
      mobileAlt: `91234567${String(89 + i).padStart(2, '0')}`,
      upcStatus: i % 4 === 0 ? 'Pending' : 'Generated',
      currentLocation: i % 2 === 0 ? 'Store - Mumbai' : `Employee - ${assignedEmployee}`,
      assignedTo: i > 20 ? 'Unassigned' : assignedEmployee,
      purchaseDate: Timestamp.fromDate(subDays(now, i * 3 + 5)),
      notes: 'Initial record',
      activationStatus: isRTS ? 'Done' : 'Pending',
      uploadStatus: i % 5 === 0 ? 'Pending' : 'Done',
      checkInDate: i % 7 === 0 ? null : Timestamp.fromDate(subDays(now, i % 7)),
      safeCustodyDate: numberTypes[i % numberTypes.length] === 'COCP' ? Timestamp.fromDate(subDays(now, i * 2)) : null,
      createdBy: creatorUid,
    };
  });

export const getDummyReminders = (creatorUid: string): Omit<Reminder, 'id'>[] => [
  { taskName: 'Upload new inventory batch', assignedTo: 'Ramesh', status: 'Upload Pending', dueDate: Timestamp.fromDate(addDays(now, 2)), createdBy: creatorUid },
  { taskName: 'Follow up on payment for 9876543210', assignedTo: 'Naeem', status: 'ACT Done', dueDate: Timestamp.fromDate(subDays(now, 1)), createdBy: creatorUid },
  { taskName: 'Reconcile sales for Website A', assignedTo: 'Suresh', status: 'Upload Pending', dueDate: Timestamp.fromDate(addDays(now, 5)), createdBy: creatorUid },
  { taskName: 'Activate pending Non-RTS numbers', assignedTo: 'Ramesh', status: 'Upload Pending', dueDate: Timestamp.fromDate(addDays(now, 1)), createdBy: creatorUid },
  { taskName: 'Check SIM location for batch #34', assignedTo: 'Naeem', status: 'ACT Done', dueDate: Timestamp.fromDate(subDays(now, 3)), createdBy: creatorUid },
];

export const getDummyDealerPurchases = (creatorUid: string): Omit<DealerPurchaseRecord, 'id'>[] =>
  Array.from({ length: 5 }, (_, i) => ({
    mobile: `88888888${String(10 + i).padStart(2, '0')}`,
    price: 50 + i * 10,
    paymentStatus: i % 2 === 0 ? 'Done' : 'Pending',
    portOutStatus: i % 3 === 0 ? 'Done' : 'Pending',
    createdBy: creatorUid,
  }));
