
"use client";

import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';
import { Pagination } from '@/components/pagination';
import { TableSpinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash, ArrowUpDown, MoreHorizontal, Download } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/context/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PortOutRecord } from '@/lib/data';
import { Timestamp } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditPortOutStatusModal } from '@/components/edit-port-out-status-modal';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';


const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 250, 500, 1000];
type SortableColumn = keyof PortOutRecord;

export default function PortOutPage() {
  const { portOuts, loading, deletePortOuts, addActivity } = useApp();
  const { role } = useAuth();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortableColumn; direction: 'ascending' | 'descending' } | null>({ key: 'portOutDate', direction: 'descending' });
  const [selectedPortOut, setSelectedPortOut] = useState<PortOutRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);


  const sortedPortOuts = useMemo(() => {
    let sortableItems = [...portOuts];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof PortOutRecord];
        const bValue = b[sortConfig.key as keyof PortOutRecord];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue);
        } else if (aValue instanceof Timestamp && bValue instanceof Timestamp) {
            comparison = aValue.toMillis() - bValue.toMillis();
        } else {
             if (aValue < bValue) {
                comparison = -1;
            }
            if (aValue > bValue) {
                comparison = 1;
            }
        }
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [portOuts, sortConfig]);

  const totalPages = Math.ceil(sortedPortOuts.length / itemsPerPage);
  const paginatedPortOuts = sortedPortOuts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAllOnPage = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedRows(paginatedPortOuts.map(p => p.id));
    } else {
       setSelectedRows(prev => prev.filter(id => !paginatedPortOuts.some(p => p.id === id)));
    }
  };
  
  const handleDeleteSelected = () => {
    const selectedPortOutRecords = portOuts.filter(p => selectedRows.includes(p.id));
    deletePortOuts(selectedPortOutRecords);
    setSelectedRows([]);
  }
  
  const handleEditClick = (portOut: PortOutRecord) => {
    setSelectedPortOut(portOut);
    setIsEditModalOpen(true);
  };

  const exportToCsv = (dataToExport: PortOutRecord[], fileName: string) => {
    const formattedData = dataToExport.map(p => ({
        "Sr.No": p.srNo,
        "Mobile": p.mobile,
        "Sum": p.sum,
        "Sold To": p.soldTo,
        "Sale Price": p.salePrice,
        "Sale Date": format(p.saleDate.toDate(), 'yyyy-MM-dd'),
        "Payment Status": p.paymentStatus,
        "UPC Status": p.upcStatus,
        "Upload Status": p.uploadStatus,
        "Port Out Date": format(p.portOutDate.toDate(), 'yyyy-MM-dd'),
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

  const handleExportSelected = () => {
    const selectedData = portOuts.filter(p => selectedRows.includes(p.id));
    if (selectedData.length === 0) {
      toast({
        variant: "destructive",
        title: "No records selected",
        description: "Please select at least one port out record to export.",
      });
      return;
    }
    exportToCsv(selectedData, 'port_out_history_export.csv');
    addActivity({
        employeeName: 'Admin',
        action: 'Exported Data',
        description: `Exported ${selectedData.length} selected port out record(s) to CSV.`
    });
    toast({
        title: "Export Successful",
        description: `${selectedData.length} selected port out records have been exported to CSV.`,
    });
    setSelectedRows([]);
  }


  const isAllOnPageSelected = paginatedPortOuts.length > 0 && paginatedPortOuts.every(p => selectedRows.includes(p.id));
  const isSomeOnPageSelected = selectedRows.length > 0 && !isAllOnPageSelected;

  const requestSort = (key: SortableColumn) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };
  
  const getSortIcon = (columnKey: SortableColumn) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  const SortableHeader = ({ column, label }: { column: SortableColumn, label: string }) => (
    <TableHead>
        <Button variant="ghost" onClick={() => requestSort(column)} className="px-0 hover:bg-transparent">
            {label}
            {getSortIcon(column)}
        </Button>
    </TableHead>
  );


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
                  This action cannot be undone. This will permanently delete {selectedRows.length} record(s) from the port out history. Only records with a "Done" payment status will be deleted.
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
       <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
             <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map(val => (
                   <SelectItem key={val} value={String(val)}>{val} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRows.length > 0 && (
                <Button variant="outline" onClick={handleExportSelected} disabled={loading || selectedRows.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Selected ({selectedRows.length})
                </Button>
            )}
          </div>
        </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                {role === 'admin' && (
                  <Checkbox
                    checked={isAllOnPageSelected || (isSomeOnPageSelected && 'indeterminate')}
                    onCheckedChange={(checked) => handleSelectAllOnPage(checked)}
                    aria-label="Select all on page"
                  />
                )}
              </TableHead>
              <SortableHeader column="srNo" label="Sr.No" />
              <SortableHeader column="mobile" label="Mobile" />
              <SortableHeader column="sum" label="Sum" />
              <SortableHeader column="soldTo" label="Sold To" />
              <SortableHeader column="salePrice" label="Sale Price" />
              <SortableHeader column="saleDate" label="Sale Date" />
              <SortableHeader column="paymentStatus" label="Payment Status" />
              <SortableHeader column="upcStatus" label="UPC Status" />
              <SortableHeader column="uploadStatus" label="Upload Status" />
              <SortableHeader column="portOutDate" label="Port Out Date" />
               <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableSpinner colSpan={12} />
            ) : paginatedPortOuts.length > 0 ? (
                paginatedPortOuts.map((record) => (
                <TableRow key={record.srNo} data-state={selectedRows.includes(record.id) && "selected"}>
                    <TableCell>
                      {role === 'admin' && (
                        <Checkbox
                          checked={selectedRows.includes(record.id)}
                          onCheckedChange={() => handleSelectRow(record.id)}
                          aria-label="Select row"
                        />
                      )}
                    </TableCell>
                    <TableCell>{record.srNo}</TableCell>
                    <TableCell className="font-medium">{record.mobile}</TableCell>
                    <TableCell>{record.sum}</TableCell>
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
                     <TableCell>
                         <Badge variant={record.uploadStatus === 'Done' ? 'secondary' : 'outline'}>
                            {record.uploadStatus}
                        </Badge>
                    </TableCell>
                     <TableCell>{format(record.portOutDate.toDate(), 'PPP')}</TableCell>
                     <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(record)}>
                                    Edit Status
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center">
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
        itemsPerPage={itemsPerPage}
        totalItems={portOuts.length}
      />
      {selectedPortOut && (
        <EditPortOutStatusModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            portOut={selectedPortOut}
        />
      )}
    </>
  );
}

    