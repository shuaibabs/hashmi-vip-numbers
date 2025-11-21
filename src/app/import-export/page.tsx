

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
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Spinner, TableSpinner } from '@/components/ui/spinner';
import { NumberRecord } from '@/lib/data';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination } from '@/components/pagination';

type FailedRecord = {
  record: any;
  reason: string;
};

const ITEMS_PER_PAGE = 10;

export default function ImportExportPage() {
  const { numbers, addActivity, bulkAddNumbers, loading } = useApp();
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number, failed: number} | null>(null);
  const [failedRecords, setFailedRecords] = useState<FailedRecord[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(numbers.length / ITEMS_PER_PAGE);
  const paginatedNumbers = numbers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const exportToCsv = (dataToExport: NumberRecord[], fileName: string) => {
     const formattedData = dataToExport.map(n => ({
        "Sr.No": n.srNo,
        "Mobile": n.mobile,
        "Status": n.status,
        "Purchase From": n.purchaseFrom,
        "Purchase Price": n.purchasePrice,
        "Sale Price": n.salePrice,
        "RTS Date": n.rtsDate ? format(n.rtsDate.toDate(), 'yyyy-MM-dd') : '',
        "UPC Status": n.upcStatus,
        "Assigned To": n.assignedTo,
        "Name": n.name,
        "Number Type": n.numberType,
        "Purchase Date": n.purchaseDate ? format(n.purchaseDate.toDate(), 'yyyy-MM-dd') : '',
    }));

    const csv = Papa.unparse(formattedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleExportAll = () => {
    exportToCsv(numbers, 'numberflow_all_export.csv');
    addActivity({
        employeeName: 'Admin', // Or current user
        action: 'Exported Data',
        description: 'Exported All Numbers list to CSV.'
    });
    toast({
        title: "Export Successful",
        description: "All numbers have been exported to CSV.",
    });
  };

  const handleExportSelected = () => {
    const selectedData = numbers.filter(n => selectedRows.includes(n.id));
    if (selectedData.length === 0) {
      toast({
        variant: "destructive",
        title: "No numbers selected",
        description: "Please select at least one number to export.",
      });
      return;
    }
    exportToCsv(selectedData, 'numberflow_selected_export.csv');
     addActivity({
        employeeName: 'Admin',
        action: 'Exported Data',
        description: `Exported ${selectedData.length} selected number(s) to CSV.`
    });
    toast({
        title: "Export Successful",
        description: `${selectedData.length} selected numbers have been exported to CSV.`,
    });
    setSelectedRows([]);
  }
  
  const handleImportClick = () => {
    document.getElementById('import-file-input')?.click();
  };

  const processImportedData = async (data: any[], fileName: string) => {
    const { validRecords, failedRecords: newFailedRecords } = await bulkAddNumbers(data as any[]);
    
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
        description: `Attempted to import ${data.length} records from ${fileName}.`
    });
  }
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);
    setFailedRecords([]);

    const reader = new FileReader();
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension !== 'csv') {
      setIsImporting(false);
      toast({
        variant: 'destructive',
        title: 'Unsupported File Type',
        description: 'Please upload a .csv file.',
      });
      event.target.value = ''; // Reset file input
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        processImportedData(results.data, file.name);
      },
      error: (error: any) => {
        setIsImporting(false);
        toast({
          variant: 'destructive',
          title: 'CSV Parse Error',
          description: error.message,
        });
      },
    });

    // Reset file input
    event.target.value = '';
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

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAllOnPage = (checked: boolean | 'indeterminate') => {
    const pageIds = paginatedNumbers.map(n => n.id);
    if (checked) {
      setSelectedRows(prev => [...new Set([...prev, ...pageIds])]);
    } else {
      setSelectedRows(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const isAllOnPageSelected = paginatedNumbers.length > 0 && paginatedNumbers.every(n => selectedRows.includes(n.id));

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <PageHeader
        title="Manage Numbers via Excel"
        description="Bulk import and export your number inventory."
      />
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileInput className="w-5 h-5 text-primary" /> Import from File</CardTitle>
                <CardDescription>Upload a CSV file to add multiple numbers to the master inventory.</CardDescription>
             </CardHeader>
             <CardContent>
                <Button onClick={handleImportClick} disabled={isImporting}>
                  {isImporting ? <Spinner className="mr-2 h-4 w-4" /> : <FileInput className="mr-2 h-4 w-4" />}
                  {isImporting ? 'Importing...' : 'Import from CSV'}
                </Button>
                <input type="file" id="import-file-input" className="hidden" accept=".csv" onChange={handleFileImport} />
                 <p className="text-xs text-muted-foreground mt-2">Required headers: Mobile, Name, NumberType, PurchaseFrom, PurchasePrice, PurchaseDate, CurrentLocation, LocationType, Status. RTSDate is required if Status is 'Non-RTS'. Optional: SalePrice, Notes.</p>
             </CardContent>
           </Card>
           <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileOutput className="w-5 h-5 text-primary" /> Export to CSV</CardTitle>
                <CardDescription>Download a CSV file of your master number inventory.</CardDescription>
             </CardHeader>
             <CardContent className="flex flex-wrap gap-2">
                 <Button variant="outline" onClick={handleExportAll} disabled={loading}>
                    <FileOutput className="mr-2 h-4 w-4" />
                    Export All
                </Button>
                 <Button variant="default" onClick={handleExportSelected} disabled={loading || selectedRows.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Selected ({selectedRows.length})
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
                     <Button variant="link" size="sm" className="pl-1 h-auto py-0" onClick={handleExportFailed}>
                        <Download className="mr-1 h-3 w-3" />
                        Download failed records report.
                    </Button>
                   )}
                </AlertDescription>
            </Alert>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-2">Select Numbers to Export</h3>
          <p className="text-sm text-muted-foreground mb-4">Select records from the table below to export them to a CSV file.</p>
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                   <Checkbox
                        checked={isAllOnPageSelected}
                        onCheckedChange={handleSelectAllOnPage}
                        aria-label="Select all on this page"
                    />
                </TableHead>
                <TableHead>Sr.No</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Purchase</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>RTS Date</TableHead>
                <TableHead>UPC Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSpinner colSpan={8} />
              ) : paginatedNumbers.length > 0 ? (
                paginatedNumbers.map((num) => (
                  <TableRow key={num.id} data-state={selectedRows.includes(num.id) && "selected"}>
                    <TableCell>
                       <Checkbox
                            checked={selectedRows.includes(num.id)}
                            onCheckedChange={() => handleSelectRow(num.id)}
                            aria-label="Select row"
                        />
                    </TableCell>
                    <TableCell>{num.srNo}</TableCell>
                    <TableCell className="font-medium">{num.mobile}</TableCell>
                    <TableCell>
                      <Badge variant={num.status === 'RTS' ? 'default' : 'destructive'} className={num.status === 'RTS' ? `bg-green-500/20 text-green-700` : `bg-red-500/20 text-red-700`}>{num.status}</Badge>
                    </TableCell>
                    <TableCell>{num.purchaseFrom}</TableCell>
                    <TableCell>₹{num.purchasePrice}</TableCell>
                    <TableCell>{num.rtsDate ? format(num.rtsDate.toDate(), 'PPP') : 'N/A'}</TableCell>
                    <TableCell><Badge variant={num.upcStatus === 'Generated' ? 'secondary' : 'outline'}>{num.upcStatus}</Badge></TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                        No numbers found.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
         <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={numbers.length}
          />
      </div>
    </>
  );
}
