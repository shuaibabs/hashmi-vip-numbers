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
  srNo: number;
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
  assignedTo: string; // Can be 'Unassigned', or employee name
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
  'id' | 'srNo' | 'createdBy' | 'rtsDate' | 'checkInDate' | 'safeCustodyDate' | 'status' | 'activationStatus' | 'uploadStatus' | 'purchaseDate'
> & { purchaseDate: Date };

export type SaleRecord = {
  id: string; // Firestore document ID
  srNo: number;
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
  srNo: number;
  taskName: string;
  assignedTo: string;
  status: 'ACT Done' | 'Upload Pending';
  dueDate: Timestamp;
  createdBy: string;
};

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
  price: number;
  paymentStatus: 'Pending' | 'Done';
  portOutStatus: 'Pending' | 'Done';
  createdBy: string;
};

export type NewDealerPurchaseData = Omit<DealerPurchaseRecord, 'id' | 'srNo' | 'createdBy' | 'paymentStatus' | 'portOutStatus'>;
