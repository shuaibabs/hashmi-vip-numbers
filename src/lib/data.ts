
import { addDays, subDays } from "date-fns";

export type NumberRecord = {
  id: number;
  mobile: string;
  status: 'RTS' | 'Non-RTS';
  numberType: 'Prepaid' | 'Postpaid' | 'COCP';
  purchaseFrom: string;
  purchasePrice: number;
  salePrice: number | string;
  rtsDate: string | Date | null;
  location: string;
  name: string;
  mobileAlt: string;
  upcStatus: 'Generated' | 'Pending';
  currentLocation: string;
  locationType: 'Store' | 'Employee' | 'Customer';
  assignedTo: string; // Can be 'Unassigned', or employee name like 'Naeem'
  purchaseDate: string | Date;
  notes?: string;
  activationStatus: 'Done' | 'Pending' | 'Fail';
  uploadStatus: 'Done' | 'Pending' | 'Fail';
  checkInDate: Date | null;
  safeCustodyDate: Date | null;
};

export type NewNumberData = Omit<NumberRecord, 'id' | 'status' | 'rtsDate' | 'activationStatus' | 'uploadStatus' | 'checkInDate' | 'safeCustodyDate'>;


export type SaleRecord = {
  id: number;
  mobile: string;
  soldTo: string;
  salePrice: number;
  paymentStatus: 'Pending' | 'Done';
  saleDate: string | Date;
  upcStatus: 'Generated' | 'Pending';
  portOutStatus: 'Pending' | 'Done';
};

export type PurchaseRecord = {
  id: number;
  mobile: string;
  purchasedFrom: string;
  purchasePrice: number;
  purchaseDate: string | Date;
};

export type Reminder = {
  id: number;
  taskName: string;
  assignedTo: string;
  status: 'ACT Done' | 'Upload Pending';
  dueDate: string | Date;
};

export type Activity = {
  id: number;
  employeeName: string;
  action: string;
  description: string;
  timestamp: Date;
};

export type DealerPurchaseRecord = {
  id: number;
  mobile: string;
  price: number;
  paymentStatus: 'Pending' | 'Done';
  portOutStatus: 'Pending' | 'Done';
}

export type NewDealerPurchaseData = Omit<DealerPurchaseRecord, 'id' | 'paymentStatus' | 'portOutStatus'>;

const now = new Date();

export const DUMMY_EMPLOYEES = ['Naeem', 'Ramesh', 'Suresh'];

const numberTypes: ('Prepaid' | 'Postpaid' | 'COCP')[] = ['Prepaid', 'Postpaid', 'COCP'];

export const DUMMY_NUMBERS: NumberRecord[] = Array.from({ length: 30 }, (_, i) => {
  const isRTS = i % 3 !== 0;
  const assignedEmployee = DUMMY_EMPLOYEES[i % DUMMY_EMPLOYEES.length];
  
  return {
    id: i + 1,
    mobile: `98765432${String(10 + i).padStart(2, '0')}`,
    status: isRTS ? 'RTS' : 'Non-RTS',
    numberType: numberTypes[i % numberTypes.length],
    purchaseFrom: `Vendor ${String.fromCharCode(65 + (i % 4))}`,
    purchasePrice: 120 + i * 5,
    salePrice: isRTS ? 200 + i * 5 : '',
    rtsDate: isRTS ? null : addDays(now, i - 10),
    location: i % 2 === 0 ? 'Store - Mumbai' : `Employee - ${assignedEmployee}`,
    name: assignedEmployee,
    mobileAlt: `91234567${String(89 + i).padStart(2, '0')}`,
    upcStatus: i % 4 === 0 ? 'Pending' : 'Generated',
    currentLocation: i % 2 === 0 ? 'Store - Mumbai' : `Employee - ${assignedEmployee}`,
    assignedTo: i > 20 ? 'Unassigned' : assignedEmployee,
    purchaseDate: subDays(now, i * 3 + 5),
    notes: 'Initial record',
    activationStatus: isRTS ? 'Done' : 'Pending',
    uploadStatus: i % 5 === 0 ? 'Pending' : 'Done',
    checkInDate: i % 7 === 0 ? null : subDays(now, i % 7),
    safeCustodyDate: numberTypes[i % numberTypes.length] === 'COCP' ? subDays(now, i * 2) : null,
  };
});

export const DUMMY_SALES: SaleRecord[] = DUMMY_NUMBERS.filter(n => n.status === 'RTS' && n.id % 2 === 0).map((n, i) => ({
  id: i + 1,
  mobile: n.mobile,
  soldTo: `Website ${String.fromCharCode(65 + (i % 3))}`,
  salePrice: n.salePrice as number,
  paymentStatus: i % 2 === 0 ? 'Done' : 'Pending',
  saleDate: subDays(now, i),
  upcStatus: n.upcStatus,
  portOutStatus: i % 3 === 0 ? 'Done' : 'Pending',
}));

export const DUMMY_DEALER_PURCHASES: DealerPurchaseRecord[] = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    mobile: `88888888${String(10 + i).padStart(2, '0')}`,
    price: 50 + i * 10,
    paymentStatus: i % 2 === 0 ? 'Done' : 'Pending',
    portOutStatus: i % 3 === 0 ? 'Done' : 'Pending',
}));


export const DUMMY_PURCHASES: PurchaseRecord[] = DUMMY_NUMBERS.map((n, i) => ({
  id: i + 1,
  mobile: n.mobile,
  purchasedFrom: n.purchaseFrom,
  purchasePrice: n.purchasePrice,
  purchaseDate: n.purchaseDate,
}));

export const DUMMY_REMINDERS: Reminder[] = [
  { id: 1, taskName: 'Upload new inventory batch', assignedTo: 'Ramesh', status: 'Upload Pending', dueDate: addDays(now, 2) },
  { id: 2, taskName: 'Follow up on payment for 9876543210', assignedTo: 'Naeem', status: 'ACT Done', dueDate: subDays(now, 1) },
  { id: 3, taskName: 'Reconcile sales for Website A', assignedTo: 'Suresh', status: 'Upload Pending', dueDate: addDays(now, 5) },
  { id: 4, taskName: 'Activate pending Non-RTS numbers', assignedTo: 'Ramesh', status: 'Upload Pending', dueDate: addDays(now, 1) },
  { id: 5, taskName: 'Check SIM location for batch #34', assignedTo: 'Naeem', status: 'ACT Done', dueDate: subDays(now, 3) },
];

export const DUMMY_ACTIVITIES: Activity[] = [
  { id: 1, employeeName: 'Naeem', action: 'Updated RTS Status', description: 'Marked 9876543211 as RTS', timestamp: subDays(now, 0) },
  { id: 2, employeeName: 'Ramesh', action: 'Imported Excel', description: 'Imported 50 new numbers', timestamp: subDays(now, 1) },
  { id: 3, employeeName: 'Suresh', action: 'Marked Upload Done', description: 'Completed task: Reconcile sales', timestamp: subDays(now, 1) },
  { id: 4, employeeName: 'Naeem', action: 'Added Note', description: 'Added note to 9876543215', timestamp: subDays(now, 2) },
  { id: 5, employeeName: 'Ramesh', action: 'Sale Recorded', description: 'Sold 9876543210 for 200', timestamp: subDays(now, 3) },
  { id: 6, employeeName: 'Admin', action: 'Exported Excel', description: 'Exported All Numbers list', timestamp: subDays(now, 4) },
];
