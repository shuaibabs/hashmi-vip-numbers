
"use client";

import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useState } from 'react';
import { Pagination } from '@/components/pagination';
import { TableSpinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/context/auth-context';

const ITEMS_PER_PAGE = 10;

export default function PortOutPage() {
  const { portOuts, loading, deletePortOuts } = useApp();
  const { role } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const totalPages = Math.ceil(portOuts.length / ITEMS_PER_PAGE);
  const paginatedPortOuts = [...portOuts]
    .sort((a, b) => a.portOutDate.toDate().getTime() - b.portOutDate.toDate().getTime())
    .slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedRows(paginatedPortOuts.map(p => p.id));
    } else {
      setSelectedRows([]);
    }
  };
  
  const handleDeleteSelected = () => {
    deletePortOuts(selectedRows);
    setSelectedRows([]);
  }

  const isAllOnPageSelected = paginatedPortOuts.length > 0 && paginatedPortOuts.every(p => selectedRows.includes(p.id));
  const isSomeOnPageSelected = selectedRows.length > 0 && !isAllOnPageSelected;

  return (
    <>
      <PageHeader
        title="Port Out History"
        description="A log of all numbers that have been successfully ported out."
      >
        {selectedRows.length > 0 && role === 'admin' && (
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete Selected ({selectedRows.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete {selectedRows.length} record(s) from the port out history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSelected}>
                  Yes, delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </PageHeader>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                {role === 'admin' && (
                  <Checkbox
                    checked={isAllOnPageSelected || isSomeOnPageSelected}
                    onCheckedChange={(checked) => handleSelectAll(checked)}
                    aria-label="Select all"
                  />
                )}
              </TableHead>
              <TableHead>Sr.No</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Sold To</TableHead>
              <TableHead>Sale Price</TableHead>
              <TableHead>Sale Date</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>UPC Status</TableHead>
              <TableHead>Port Out Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableSpinner colSpan={9} />
            ) : paginatedPortOuts.length > 0 ? (
                paginatedPortOuts.map((record, index) => (
                <TableRow key={record.id} data-state={selectedRows.includes(record.id) && "selected"}>
                    <TableCell>
                      {role === 'admin' && (
                        <Checkbox
                          checked={selectedRows.includes(record.id)}
                          onCheckedChange={() => handleSelectRow(record.id)}
                          aria-label="Select row"
                        />
                      )}
                    </TableCell>
                    <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                    <TableCell className="font-medium">{record.mobile}</TableCell>
                    <TableCell>{record.soldTo}</TableCell>
                    <TableCell>₹{record.salePrice.toLocaleString()}</TableCell>
                    <TableCell>{format(record.saleDate.toDate(), 'PPP')}</TableCell>
                    <TableCell>
                         <Badge variant={record.paymentStatus === 'Done' ? 'secondary' : 'outline'}>
                            {record.paymentStatus}
                        </Badge>
                    </TableCell>
                    <TableCell>
                         <Badge variant={record.upcStatus === 'Generated' ? 'secondary' : 'outline'}>
                            {record.upcStatus}
                        </Badge>
                    </TableCell>
                     <TableCell>{format(record.portOutDate.toDate(), 'PPP')}</TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                        No port out records found.
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
        totalItems={portOuts.length}
      />
    </>
  );
}
