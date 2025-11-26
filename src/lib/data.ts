
import { Timestamp } from 'firebase/firestore';

// Base User profile stored in Firestore
export type User = {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'employee';
  id: string; // Firestore document ID is the same as uid
};

// Raw record from Firestore
export type NumberRecord = {
  id: string; // Firestore document ID
  srNo: number;
  mobile: string;
  sum: number;
  status: 'RTS' | 'Non-RTS';
  uploadStatus: 'Pending' | 'Done';
  numberType: 'Prepaid' | 'Postpaid' | 'COCP';
  purchaseFrom: string;
  purchasePrice: number;
  salePrice: number | string;
  rtsDate: Timestamp | null;
  name: string;
  upcStatus: 'Generated' | 'Pending';
  currentLocation: string;
  locationType: 'Store' | 'Employee' | 'Dealer';
  assignedTo: string; // Can be 'Unassigned', or employee name
  purchaseDate: Timestamp;
  notes?: string;
  checkInDate: Timestamp | null;
  safeCustodyDate: Timestamp | null;
  safeCustodyNotificationSent?: boolean;
  createdBy: string; // UID of user who created it
  accountName?: string;
  ownershipType: 'Individual' | 'Partnership';
  partnerName?: string;
};

// Type for creating a new number, omitting Firestore-generated fields
export type NewNumberData = Omit<
  NumberRecord,
  'id' | 'srNo' | 'createdBy' | 'checkInDate' | 'purchaseDate' | 'sum' | 'upcStatus' | 'safeCustodyDate' | 'safeCustodyNotificationSent'
> & { purchaseDate: Date; rtsDate?: Date, safeCustodyDate?: Date };


export type SaleRecord = {
  id: string; // Firestore document ID
  srNo: number;
  mobile: string;
  sum: number;
  soldTo: string;
  salePrice: number;
  paymentStatus: 'Pending' | 'Done';
  saleDate: Timestamp;
  upcStatus: 'Generated' | 'Pending';
  portOutStatus: 'Pending' | 'Done';
  uploadStatus: 'Pending' | 'Done';
  createdBy: string;
  originalNumberData: Omit<NumberRecord, 'id'>;
};

export type PortOutRecord = Omit<SaleRecord, 'portOutStatus'> & { portOutDate: Timestamp };

export type Reminder = {
  id: string; // Firestore document ID
  srNo: number;
  taskName: string;
  assignedTo: string;
  status: 'Done' | 'Pending';
  dueDate: Timestamp;
  createdBy: string;
  notes?: string;
};

export type NewReminderData = Omit<Reminder, 'id' | 'srNo' | 'createdBy' | 'status' | 'dueDate' | 'notes'> & { dueDate: Date };


export type Activity = {
  id: string; // Firestore document ID
  srNo: number;
  employeeName: string;
  action: string;
  description: string;
  timestamp: Timestamp;
  createdBy: string;
};

export type DealerPurchaseRecord = {
  id: string; // Firestore document ID
  srNo: number;
  mobile: string;
  sum: number;
  dealerName: string;
  price: number;
  paymentStatus: 'Pending' | 'Done';
  portOutStatus: 'Pending' | 'Done';
  upcStatus: 'Pending' | 'Generated';
  createdBy: string;
};

export type NewDealerPurchaseData = Omit<DealerPurchaseRecord, 'id' | 'srNo' | 'createdBy' | 'paymentStatus' | 'portOutStatus' | 'sum' | 'upcStatus'>;

    
