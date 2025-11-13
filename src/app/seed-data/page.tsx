'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { useAuth } from '@/context/auth-context';
import {
  collection,
  writeBatch,
  getDocs,
  Timestamp,
  query,
  doc,
  where,
} from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { NumberRecord } from '@/lib/data';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { calculateDigitalRoot } from '@/lib/utils';

const getNextSrNo = async (
  db: any,
  collectionName: string
): Promise<number> => {
  const collRef = collection(db, collectionName);
  const q = query(collRef);
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return 1;
  }
  let maxSrNo = 0;
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.srNo > maxSrNo) {
      maxSrNo = data.srNo;
    }
  });
  return maxSrNo + 1;
};

const sampleNumbers: Omit<NumberRecord, 'id' | 'srNo' | 'createdBy' | 'sum'>[] = [
  {
    mobile: '9876543210',
    status: 'RTS',
    numberType: 'Prepaid',
    purchaseFrom: 'Vendor A',
    purchasePrice: 100,
    salePrice: 150,
    rtsDate: null,
    location: 'Mumbai Store',
    name: 'John Doe',
    mobileAlt: '9876543211',
    upcStatus: 'Pending',
    currentLocation: 'Mumbai Store',
    locationType: 'Store',
    assignedTo: 'Unassigned',
    purchaseDate: Timestamp.fromDate(new Date('2023-10-01')),
    notes: 'Initial stock',
    activationStatus: 'Done',
    uploadStatus: 'Done',
    checkInDate: null,
    safeCustodyDate: null,
  },
  {
    mobile: '8765432109',
    status: 'Non-RTS',
    numberType: 'Postpaid',
    purchaseFrom: 'Vendor B',
    purchasePrice: 250,
    salePrice: 400,
    rtsDate: Timestamp.fromDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)), // 5 days from now
    location: 'Delhi Store',
    name: 'Jane Smith',
    mobileAlt: '',
    upcStatus: 'Generated',
    currentLocation: 'Employee - Shubham',
    locationType: 'Employee',
    assignedTo: 'Shubham',
    purchaseDate: Timestamp.fromDate(new Date('2023-11-15')),
    notes: 'Premium number',
    activationStatus: 'Pending',
    uploadStatus: 'Pending',
    checkInDate: Timestamp.now(),
    safeCustodyDate: null,
  },
   {
    mobile: '7654321098',
    status: 'RTS',
    numberType: 'COCP',
    purchaseFrom: 'Direct',
    purchasePrice: 0,
    salePrice: 0,
    rtsDate: null,
    location: 'Customer Premise',
    name: 'ACME Corp',
    mobileAlt: '',
    upcStatus: 'Pending',
    currentLocation: 'Customer Premise',
    locationType: 'Customer',
    assignedTo: 'ACME Corp',
    purchaseDate: Timestamp.fromDate(new Date('2023-09-01')),
    notes: 'Corporate account.',
    activationStatus: 'Done',
    uploadStatus: 'Done',
    checkInDate: null,
    safeCustodyDate: Timestamp.now(),
  },
];


export default function SeedDataPage() {
  const db = useFirestore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { numbers, sales, portOuts, dealerPurchases } = useApp();

  const isMobileNumberDuplicate = (mobile: string): boolean => {
    const allMobiles = [
      ...numbers.map(n => n.mobile),
      ...sales.map(s => s.mobile),
      ...portOuts.map(p => p.mobile),
      ...dealerPurchases.map(d => d.mobile),
    ];
    return allMobiles.includes(mobile);
  };

  const handleSeedNumbers = async () => {
    if (!db || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to seed data.',
      });
      return;
    }
    setLoading(true);

    try {
      const batch = writeBatch(db);
      const numbersCol = collection(db, 'numbers');
      let nextSrNo = await getNextSrNo(db, 'numbers');

      let addedCount = 0;
      for (const numData of sampleNumbers) {
        if (isMobileNumberDuplicate(numData.mobile)) {
          console.warn(`Skipping duplicate mobile number: ${numData.mobile}`);
          continue;
        }

        const docRef = doc(numbersCol);
        const newRecord: Omit<NumberRecord, 'id'> = {
          ...numData,
          srNo: nextSrNo,
          sum: calculateDigitalRoot(numData.mobile),
          createdBy: user.uid,
        };
        batch.set(docRef, newRecord);
        nextSrNo++;
        addedCount++;
      }

      if (addedCount > 0) {
        await batch.commit();
        toast({
          title: 'Success',
          description: `${addedCount} sample numbers have been added to the database.`,
        });
      } else {
         toast({
          variant: 'destructive',
          title: 'Seeding Skipped',
          description: 'All sample numbers already exist in the database.',
        });
      }

    } catch (error) {
      console.error('Error seeding data:', error);
      toast({
        variant: 'destructive',
        title: 'Seeding Failed',
        description:
          'Could not add sample data. Check console for more details.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Seed Database"
        description="Add temporary sample data to your collections for testing."
      />
      <div className="space-y-6">
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>For Development Only</AlertTitle>
          <AlertDescription>
            This page allows you to populate your Firestore database with
            sample data. Use with caution.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Seed Numbers Collection</CardTitle>
            <CardDescription>
              Adds {sampleNumbers.length} sample records to the 'numbers'
              collection. This will demonstrate various statuses, types, and
              assignments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSeedNumbers} disabled={loading}>
              {loading ? 'Seeding...' : 'Seed Numbers'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
