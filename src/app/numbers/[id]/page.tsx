'use client';

import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NumberRecord } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export default function NumberDetailsPage() {
  const { id } = useParams();
  const { numbers, loading } = useApp();
  const router = useRouter();

  const numberId = Array.isArray(id) ? id[0] : id;

  const number: NumberRecord | undefined = numbers.find(n => n.id === numberId);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!number) {
    return (
      <>
        <PageHeader title="Number Not Found" description="The requested number record could not be found." />
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Number Details"
        description={`Viewing full details for ${number.mobile}`}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{number.mobile}</CardTitle>
              <CardDescription>Assigned to {number.assignedTo}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant="outline">{number.numberType}</Badge>
                <Badge variant={number.status === 'RTS' ? 'default' : 'destructive'} className={number.status === 'RTS' ? `bg-green-500/20 text-green-700` : `bg-red-500/20 text-red-700`}>
                {number.status}
                </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
            <DetailItem label="Assigned Name" value={number.name} />
            <DetailItem label="Alternate Mobile" value={number.mobileAlt || 'N/A'} />
          </div>

          <Separator />
          
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
            <h4 className="text-lg font-semibold col-span-full">Purchase Information</h4>
            <DetailItem label="Purchased From" value={number.purchaseFrom} />
            <DetailItem label="Purchase Price" value={`₹${number.purchasePrice.toLocaleString()}`} />
            <DetailItem label="Purchase Date" value={number.purchaseDate ? format(number.purchaseDate.toDate(), 'PPP') : 'N/A'} />
            <DetailItem label="Sale Price" value={number.salePrice ? `₹${Number(number.salePrice).toLocaleString()}` : 'Not for sale'} />
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
            <h4 className="text-lg font-semibold col-span-full">Status & Location</h4>
             <DetailItem label="Scheduled RTS Date" value={number.rtsDate ? format(number.rtsDate.toDate(), 'PPP') : 'N/A'} />
            <DetailItem label="UPC Status" value={<Badge variant={number.upcStatus === 'Generated' ? 'secondary' : 'outline'}>{number.upcStatus}</Badge>} />
            <DetailItem label="Current Location" value={number.currentLocation} />
            <DetailItem label="Location Type" value={number.locationType} />
            <DetailItem label="Store Location" value={number.location} />
          </div>
          
          {number.notes && (
            <>
              <Separator />
              <div>
                <h4 className="text-lg font-semibold">Notes</h4>
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{number.notes}</p>
              </div>
            </>
          )}

        </CardContent>
      </Card>
    </>
  );
}
