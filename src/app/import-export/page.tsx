"use client";

import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileInput, FileOutput, Terminal } from 'lucide-react';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function ImportExportPage() {
  const { numbers, addActivity } = useApp();
  const { toast } = useToast();

  const handleExport = () => {
    const dataToExport = numbers.map(n => ({
        "Sr.No": n.id,
        "Mobile": n.mobile,
        "Status": n.status,
        "Purchase From": n.purchaseFrom,
        "Purchase Price": n.purchasePrice,
        "Sale Price": n.salePrice,
        "RTS Date": n.rtsDate ? format(new Date(n.rtsDate), 'yyyy-MM-dd') : '',
        "Location": n.location,
        "UPC Status": n.upcStatus,
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'numberflow_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addActivity({
        employeeName: 'Admin', // Or current user
        action: 'Exported Data',
        description: 'Exported All Numbers list to CSV.'
    });

    toast({
        title: "Export Successful",
        description: "Your data has been exported to CSV.",
    });
  };
  
  const handleImportClick = () => {
    document.getElementById('import-file-input')?.click();
  };
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "Import Simulated",
        description: `${file.name} would be processed. This is a dummy action.`,
      });
      addActivity({
        employeeName: 'Admin',
        action: 'Imported Data',
        description: `Simulated import of ${file.name}.`
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Manage Numbers via Excel"
        description="Bulk import and export your number inventory."
      />
      <div className="space-y-6">
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Simulation Mode</AlertTitle>
          <AlertDescription>
            Excel import/export operations are simulated with local dummy data only. No server-side processing will occur.
          </AlertDescription>
        </Alert>

        <div className="flex gap-4">
          <Button onClick={handleImportClick}>
            <FileInput className="mr-2 h-4 w-4" />
            Import Excel
          </Button>
          <input type="file" id="import-file-input" className="hidden" accept=".csv" onChange={handleFileImport} />

          <Button variant="outline" onClick={handleExport}>
            <FileOutput className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Data Preview</h3>
          <p className="text-sm text-muted-foreground mb-4">A preview of the first 10 records that will be exported.</p>
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sr.No</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Purchase</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>RTS Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>UPC Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {numbers.slice(0, 10).map((num, index) => (
                <TableRow key={num.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{num.mobile}</TableCell>
                  <TableCell>
                    <Badge variant={num.status === 'RTS' ? 'default' : 'destructive'} className={num.status === 'RTS' ? `bg-green-500/20 text-green-700` : `bg-red-500/20 text-red-700`}>{num.status}</Badge>
                  </TableCell>
                  <TableCell>{num.purchaseFrom}</TableCell>
                  <TableCell>₹{num.purchasePrice}</TableCell>
                  <TableCell>{num.rtsDate ? format(new Date(num.rtsDate), 'PPP') : 'N/A'}</TableCell>
                  <TableCell>{num.location}</TableCell>
                  <TableCell><Badge variant={num.upcStatus === 'Generated' ? 'secondary' : 'outline'}>{num.upcStatus}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
