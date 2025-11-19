
"use client";

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileInput, FileOutput, Terminal, Download } from 'lucide-react';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Spinner, TableSpinner } from '@/components/ui/spinner';
import { NewNumberData } from '@/lib/data';

type FailedRecord = {
  record: any;
  reason: string;
};

export default function ImportExportPage() {
  const { numbers, addActivity, bulkAddNumbers, loading } = useApp();
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number, failed: number} | null>(null);
  const [failedRecords, setFailedRecords] = useState<FailedRecord[]>([]);

  const handleExport = () => {
    const dataToExport = numbers.map(n => ({
        "Sr.No": n.srNo,
        "Mobile": n.mobile,
        "Status": n.status,
        "Purchase From": n.purchaseFrom,
        "Purchase Price": n.purchasePrice,
        "Sale Price": n.salePrice,
        "RTS Date": n.rtsDate ? format(n.rtsDate.toDate(), 'yyyy-MM-dd') : '',
        "Location": n.location,
        "UPC Status": n.upcStatus,
        "Assigned To": n.assignedTo,
        "Name": n.name,
        "Number Type": n.numberType,
        "Purchase Date": n.purchaseDate ? format(n.purchaseDate.toDate(), 'yyyy-MM-dd') : '',
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
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);
    setFailedRecords([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const { validRecords, failedRecords: newFailedRecords } = await bulkAddNumbers(results.data as any[]);
        
        setImportResult({ success: validRecords.length, failed: newFailedRecords.length });
        setFailedRecords(newFailedRecords);
        setIsImporting(false);

        toast({
          title: "Import Complete",
          description: `${validRecords.length} records imported successfully. ${newFailedRecords.length} records failed.`,
        });

        addActivity({
            employeeName: 'Admin',
            action: 'Imported Data',
            description: `Attempted to import ${results.data.length} records from ${file.name}.`
        });

        // Reset file input
        event.target.value = '';
      },
      error: (error) => {
        setIsImporting(false);
        toast({
            variant: "destructive",
            title: "Import Error",
            description: error.message,
        });
      }
    });
  };

  const handleExportFailed = () => {
     if (failedRecords.length === 0) return;

     const dataToExport = failedRecords.map(item => ({
        ...item.record,
        ReasonForFailure: item.reason,
     }));

     const csv = Papa.unparse(dataToExport);
     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
     const link = document.createElement('a');
     const url = URL.createObjectURL(blob);
     link.setAttribute('href', url);
     link.setAttribute('download', 'failed_import_report.csv');
     link.style.visibility = 'hidden';
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);

     toast({
        title: "Failed Report Exported",
        description: "The list of failed records has been downloaded.",
     });
  }

  return (
    <>
      <PageHeader
        title="Manage Numbers via Excel"
        description="Bulk import and export your number inventory."
      />
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
           <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileInput className="w-5 h-5 text-primary" /> Import from CSV</CardTitle>
                <CardDescription>Upload a CSV file to add multiple numbers to the master inventory.</CardDescription>
             </CardHeader>
             <CardContent>
                <Button onClick={handleImportClick} disabled={isImporting}>
                  {isImporting ? <Spinner className="mr-2 h-4 w-4" /> : <FileInput className="mr-2 h-4 w-4" />}
                  {isImporting ? 'Importing...' : 'Import from CSV'}
                </Button>
                <input type="file" id="import-file-input" className="hidden" accept=".csv" onChange={handleFileImport} />
                 <p className="text-xs text-muted-foreground mt-2">Required headers: Mobile, Name, NumberType, PurchaseFrom, PurchasePrice, PurchaseDate, Location, CurrentLocation, LocationType, AssignedTo, UPCStatus.</p>
             </CardContent>
           </Card>
           <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileOutput className="w-5 h-5 text-primary" /> Export to CSV</CardTitle>
                <CardDescription>Download a CSV file of your entire master number inventory.</CardDescription>
             </CardHeader>
             <CardContent>
                 <Button variant="outline" onClick={handleExport} disabled={loading}>
                    <FileOutput className="mr-2 h-4 w-4" />
                    Export All Numbers
                </Button>
             </CardContent>
           </Card>
        </div>

        {importResult && (
            <Alert variant={importResult.failed > 0 ? "destructive" : "default"} className={importResult.failed === 0 ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" : ""}>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Import Result</AlertTitle>
                <AlertDescription>
                   Successfully imported {importResult.success} records. Failed to import {importResult.failed} records.
                   {failedRecords.length > 0 && (
                     <Button variant="link" size="sm" className="pl-1" onClick={handleExportFailed}>
                        <Download className="mr-1 h-3 w-3" />
                        Download failed records report.
                    </Button>
                   )}
                </AlertDescription>
            </Alert>
        )}

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
              {loading ? (
                <TableSpinner colSpan={8} />
              ) : (
                numbers.slice(0, 10).map((num) => (
                  <TableRow key={num.srNo}>
                    <TableCell>{num.srNo}</TableCell>
                    <TableCell className="font-medium">{num.mobile}</TableCell>
                    <TableCell>
                      <Badge variant={num.status === 'RTS' ? 'default' : 'destructive'} className={num.status === 'RTS' ? `bg-green-500/20 text-green-700` : `bg-red-500/20 text-red-700`}>{num.status}</Badge>
                    </TableCell>
                    <TableCell>{num.purchaseFrom}</TableCell>
                    <TableCell>₹{num.purchasePrice}</TableCell>
                    <TableCell>{num.rtsDate ? format(num.rtsDate.toDate(), 'PPP') : 'N/A'}</TableCell>
                    <TableCell>{num.location}</TableCell>
                    <TableCell><Badge variant={num.upcStatus === 'Generated' ? 'secondary' : 'outline'}>{num.upcStatus}</Badge></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
