
"use client";

import { useState, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Pagination } from '@/components/pagination';
import { AddDealerPurchaseModal } from '@/components/add-dealer-purchase-modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditDealerPurchaseModal } from '@/components/edit-dealer-purchase-modal';
import { DealerPurchaseRecord } from '@/lib/data';
import { TableSpinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 250, 500, 1000];
type SortableColumn = keyof DealerPurchaseRecord;

export default function DealerPurchasesPage() {
  const { dealerPurchases, loading } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<DealerPurchaseRecord | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableColumn; direction: 'ascending' | 'descending' } | null>({ key: 'srNo', direction: 'descending' });

  const sortedPurchases = useMemo(() => {
    let sortableItems = [...dealerPurchases];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof DealerPurchaseRecord];
        const bValue = b[sortConfig.key as keyof DealerPurchaseRecord];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        let comparison = 0;
        if (aValue < bValue) {
            comparison = -1;
        }
        if (aValue > bValue) {
            comparison = 1;
        }
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [dealerPurchases, sortConfig]);


  const totalPages = Math.ceil(sortedPurchases.length / itemsPerPage);
  const paginatedPurchases = sortedPurchases.slice(
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
  
  const handleEditClick = (purchase: DealerPurchaseRecord) => {
    setSelectedPurchase(purchase);
    setIsEditModalOpen(true);
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
        title="Purchase from Other Dealers"
        description="A list of numbers purchased from other dealers."
      >
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4"/>
          Add New Number
        </Button>
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
          </div>
        </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader column="srNo" label="Sr.No" />
              <SortableHeader column="mobile" label="Number" />
              <SortableHeader column="sum" label="Sum" />
              <SortableHeader column="price" label="Price" />
              <SortableHeader column="paymentStatus" label="Payment Status" />
              <SortableHeader column="portOutStatus" label="Port Out Status" />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableSpinner colSpan={7} />
            ) : paginatedPurchases.length > 0 ? (
                paginatedPurchases.map((purchase) => (
                <TableRow key={purchase.srNo}>
                    <TableCell>{purchase.srNo}</TableCell>
                    <TableCell className="font-medium">{purchase.mobile}</TableCell>
                    <TableCell>{purchase.sum}</TableCell>
                    <TableCell>₹{purchase.price.toLocaleString()}</TableCell>
                    <TableCell>
                        <Badge variant={purchase.paymentStatus === 'Done' ? 'secondary' : 'outline'}>
                        {purchase.paymentStatus}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={purchase.portOutStatus === 'Done' ? 'secondary' : 'outline'}>
                        {purchase.portOutStatus}
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
                            <DropdownMenuItem onClick={() => handleEditClick(purchase)}>
                            Edit Status
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        No dealer purchases found.
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
        totalItems={dealerPurchases.length}
      />
      <AddDealerPurchaseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      {selectedPurchase && (
        <EditDealerPurchaseModal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
            purchase={selectedPurchase}
        />
      )}
    </>
  );
}
