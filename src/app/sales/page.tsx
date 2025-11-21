
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
import { MoreHorizontal, ArrowUpDown, Trash } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { EditSaleStatusModal } from '@/components/edit-sale-status-modal';
import { SaleRecord } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timestamp } from 'firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 250, 500, 1000];
type SortableColumn = keyof SaleRecord;


export default function SalesPage() {
  const { sales, loading, cancelSale } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [saleToCancel, setSaleToCancel] = useState<SaleRecord | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableColumn; direction: 'ascending' | 'descending' } | null>({ key: 'saleDate', direction: 'descending'});

  const sortedSales = useMemo(() => {
    let sortableItems = [...sales];
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
  }, [sales, sortConfig]);

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
  
  const handleConfirmCancel = () => {
    if (saleToCancel) {
      cancelSale(saleToCancel.id);
      setSaleToCancel(null);
    }
  };


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
        title="Sales"
        description="View and manage all sales records."
      />
       <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
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
          </div>
        </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader column="srNo" label="Sr.No" />
              <SortableHeader column="mobile" label="Mobile" />
              <SortableHeader column="sum" label="Sum" />
              <SortableHeader column="soldTo" label="Sold To" />
              <SortableHeader column="salePrice" label="Sale Price" />
              <SortableHeader column="saleDate" label="Sale Date" />
              <SortableHeader column="paymentStatus" label="Payment Status" />
              <SortableHeader column="upcStatus" label="UPC Status" />
              <SortableHeader column="portOutStatus" label="Portout Status" />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableSpinner colSpan={10} />
            ) : paginatedSales.length > 0 ? (
                paginatedSales.map((sale) => (
                <TableRow key={sale.srNo}>
                    <TableCell>{sale.srNo}</TableCell>
                    <TableCell className="font-medium">{sale.mobile}</TableCell>
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
                    <TableCell colSpan={10} className="h-24 text-center">
                        No sales records found.
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
        totalItems={sales.length}
      />
      {selectedSale && (
        <EditSaleStatusModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            sale={selectedSale}
        />
      )}
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
    </>
  );
}
