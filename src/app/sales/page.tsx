
"use client";

import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';
import { Pagination } from '@/components/pagination';
import { TableSpinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ArrowUpDown, Trash, LogOut, Download, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { EditSaleStatusModal } from '@/components/edit-sale-status-modal';
import { SaleRecord } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timestamp } from 'firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkEditUpcModal } from '@/components/bulk-edit-upc-modal';
import { useAuth } from '@/context/auth-context';
import Papa from 'papaparse';
import { Input } from '@/components/ui/input';


const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 250, 500, 1000];
type SortableColumn = keyof SaleRecord;


export default function SalesPage() {
  const { sales, loading, cancelSale, markSaleAsPortedOut, addActivity, bulkMarkAsPortedOut } = useApp();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkUpcModalOpen, setIsBulkUpcModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [saleToCancel, setSaleToCancel] = useState<SaleRecord | null>(null);
  const [saleToPortOut, setSaleToPortOut] = useState<SaleRecord | null>(null);
  const [isBulkPortOutDialogOpen, setIsBulkPortOutDialogOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortableColumn; direction: 'ascending' | 'descending' } | null>({ key: 'saleDate', direction: 'descending'});
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const roleFilteredSales = useMemo(() => {
    if (role === 'admin') {
      return sales;
    }
    return sales.filter(sale => sale.originalNumberData?.assignedTo === user?.displayName);
  }, [sales, role, user?.displayName]);

  const sortedSales = useMemo(() => {
    let sortableItems = [...roleFilteredSales].filter(sale => 
        sale.mobile.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof SaleRecord];
        const bValue = b[sortConfig.key as keyof SaleRecord];

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
  }, [roleFilteredSales, sortConfig, searchTerm]);

  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const paginatedSales = sortedSales.slice(
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

  const handleEditClick = (sale: SaleRecord) => {
    setSelectedSale(sale);
    setIsEditModalOpen(true);
  };
  
  const handleCancelClick = (sale: SaleRecord) => {
    setSaleToCancel(sale);
  };

  const handlePortOutClick = (sale: SaleRecord) => {
    if (sale.upcStatus !== 'Generated') {
      toast({
        variant: "destructive",
        title: "Port Out Blocked",
        description: "The UPC status must be 'Generated' before you can mark this sale as ported out.",
      });
      return;
    }
    setSaleToPortOut(sale);
  };
  
  const handleConfirmCancel = () => {
    if (saleToCancel) {
      cancelSale(saleToCancel.id);
      setSaleToCancel(null);
    }
  };

  const handleConfirmPortOut = () => {
    if (saleToPortOut) {
      markSaleAsPortedOut(saleToPortOut.id);
      setSaleToPortOut(null);
    }
  }

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAllOnPage = (checked: boolean | 'indeterminate') => {
    const pageIds = paginatedSales.map(s => s.id);
    if (checked) {
      setSelectedRows(prev => [...new Set([...prev, ...pageIds])]);
    } else {
      setSelectedRows(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const isAllOnPageSelected = paginatedSales.length > 0 && paginatedSales.every(s => selectedRows.includes(s.id));

  const exportToCsv = (dataToExport: SaleRecord[], fileName: string) => {
    const formattedData = dataToExport.map(s => ({
      "Sr.No": s.srNo,
      "Mobile": s.mobile,
      "Sum": s.sum,
      "Sold To": s.soldTo,
      "Sale Price": s.salePrice,
      "Sale Date": format(s.saleDate.toDate(), 'yyyy-MM-dd'),
      "Payment Status": s.paymentStatus,
      "UPC Status": s.upcStatus,
      "Upload Status": s.uploadStatus,
      "Portout Status": s.portOutStatus,
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
    const selectedData = sales.filter(s => selectedRows.includes(s.id));
    if (selectedData.length === 0) {
      toast({
        variant: "destructive",
        title: "No sales selected",
        description: "Please select at least one sale to export.",
      });
      return;
    }
    exportToCsv(selectedData, 'sales_export.csv');
    addActivity({
        employeeName: user?.displayName || 'User',
        action: 'Exported Data',
        description: `Exported ${selectedData.length} selected sale(s) to CSV.`
    });
    toast({
        title: "Export Successful",
        description: `${selectedData.length} selected sales have been exported to CSV.`,
    });
    setSelectedRows([]);
  }

  const closeBulkUpcModal = () => {
    setIsBulkUpcModalOpen(false);
    setSelectedRows([]);
  };

  const handleConfirmBulkPortOut = () => {
    const eligibleSales = sales.filter(s => selectedRows.includes(s.id) && s.upcStatus === 'Generated');
    bulkMarkAsPortedOut(eligibleSales);
    setIsBulkPortOutDialogOpen(false);
    setSelectedRows([]);
  };

  const selectedSaleRecords = sales.filter(s => selectedRows.includes(s.id));
  const eligibleForPortOutCount = selectedSaleRecords.filter(s => s.upcStatus === 'Generated').length;


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

  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-yellow-300 dark:bg-yellow-700 rounded-sm">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <>
      <PageHeader
        title="Sales"
        description="View and manage all sales records."
      />
       <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
             <Input 
              placeholder="Search by mobile number..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-full sm:max-w-sm"
            />
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
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" onClick={handleExportSelected} disabled={loading || selectedRows.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Export ({selectedRows.length})
                    </Button>
                     <Button variant="outline" onClick={() => setIsBulkUpcModalOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit UPC ({selectedRows.length})
                    </Button>
                     <Button variant="outline" onClick={() => setIsBulkPortOutDialogOpen(true)}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Port Out ({selectedRows.length})
                    </Button>
                </div>
            )}
          </div>
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
              <SortableHeader column="srNo" label="Sr.No" />
              <SortableHeader column="mobile" label="Mobile" />
              <SortableHeader column="sum" label="Sum" />
              <SortableHeader column="soldTo" label="Sold To" />
              <SortableHeader column="salePrice" label="Sale Price" />
              <SortableHeader column="saleDate" label="Sale Date" />
              <SortableHeader column="paymentStatus" label="Payment Status" />
              <SortableHeader column="upcStatus" label="UPC Status" />
              <SortableHeader column="uploadStatus" label="Upload Status" />
              <SortableHeader column="portOutStatus" label="Portout Status" />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableSpinner colSpan={12} />
            ) : paginatedSales.length > 0 ? (
                paginatedSales.map((sale) => (
                <TableRow key={sale.srNo} data-state={selectedRows.includes(sale.id) && "selected"}>
                    <TableCell>
                        <Checkbox
                            checked={selectedRows.includes(sale.id)}
                            onCheckedChange={() => handleSelectRow(sale.id)}
                            aria-label="Select row"
                        />
                    </TableCell>
                    <TableCell>{sale.srNo}</TableCell>
                    <TableCell className="font-medium">{highlightMatch(sale.mobile, searchTerm)}</TableCell>
                    <TableCell>{sale.sum}</TableCell>
                    <TableCell>{sale.soldTo}</TableCell>
                    <TableCell>₹{sale.salePrice.toLocaleString()}</TableCell>
                    <TableCell>{format(sale.saleDate.toDate(), 'PPP')}</TableCell>
                    <TableCell>
                         <Badge variant={sale.paymentStatus === 'Done' ? 'secondary' : 'outline'}>
                            {sale.paymentStatus}
                        </Badge>
                    </TableCell>
                    <TableCell>
                         <Badge variant={sale.upcStatus === 'Generated' ? 'secondary' : 'outline'}>
                            {sale.upcStatus}
                        </Badge>
                    </TableCell>
                     <TableCell>
                         <Badge variant={sale.uploadStatus === 'Done' ? 'secondary' : 'outline'}>
                            {sale.uploadStatus}
                        </Badge>
                    </TableCell>
                     <TableCell>
                         <Badge variant={sale.portOutStatus === 'Done' ? 'secondary' : 'outline'}>
                            {sale.portOutStatus}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(sale)}>
                                    Edit Status
                                </DropdownMenuItem>
                                {sale.portOutStatus !== 'Done' && (
                                  <DropdownMenuItem onClick={() => handlePortOutClick(sale)}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Mark as Ported Out
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleCancelClick(sale)}
                                  className="text-destructive focus:text-destructive"
                                >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Cancel Sale
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center">
                        {searchTerm ? `No sales records found for "${searchTerm}".` : "No sales records found."}
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
        totalItems={sortedSales.length}
      />
      {selectedSale && (
        <EditSaleStatusModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            sale={selectedSale}
        />
      )}
      <BulkEditUpcModal
        isOpen={isBulkUpcModalOpen}
        onClose={closeBulkUpcModal}
        selectedSales={selectedSaleRecords}
      />
      <AlertDialog open={!!saleToCancel} onOpenChange={() => setSaleToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the sale of <span className="font-semibold">{saleToCancel?.mobile}</span>. The record will be deleted from Sales and the number will be returned to the master inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSaleToCancel(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} className="bg-destructive hover:bg-destructive/90">
              Yes, cancel sale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!saleToPortOut} onOpenChange={() => setSaleToPortOut(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Ported Out?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the sale of <span className="font-semibold">{saleToPortOut?.mobile}</span> to the Port Out history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSaleToPortOut(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPortOut}>
              Yes, mark as ported out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isBulkPortOutDialogOpen} onOpenChange={setIsBulkPortOutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Mark as Ported Out</AlertDialogTitle>
            <AlertDialogDescription>
              You have selected {selectedRows.length} record(s). Out of these, {eligibleForPortOutCount} have a 'Generated' UPC status and can be ported out.
              <br/><br/>
              This action will move all eligible records to the Port Out history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsBulkPortOutDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBulkPortOut} disabled={eligibleForPortOutCount === 0}>
              Port Out {eligibleForPortOutCount} Record(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
