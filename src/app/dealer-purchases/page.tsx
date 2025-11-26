

"use client";

import { useState, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, ArrowUpDown, Trash, Download } from 'lucide-react';
import { Pagination } from '@/components/pagination';
import { AddDealerPurchaseModal } from '@/components/add-dealer-purchase-modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditDealerPurchaseModal } from '@/components/edit-dealer-purchase-modal';
import { DealerPurchaseRecord } from '@/lib/data';
import { TableSpinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/auth-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';


const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 250, 500, 1000];
type SortableColumn = keyof DealerPurchaseRecord;

export default function DealerPurchasesPage() {
  const { dealerPurchases, loading, deleteDealerPurchases, addActivity } = useApp();
  const { role, user } = useAuth();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<DealerPurchaseRecord | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableColumn; direction: 'ascending' | 'descending' } | null>({ key: 'srNo', direction: 'descending' });
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const sortedPurchases = useMemo(() => {
    let sortableItems = [...dealerPurchases];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof DealerPurchaseRecord];
        const bValue = b[sortConfig.key as keyof DealerPurchaseRecord];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
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

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAllOnPage = (checked: boolean | 'indeterminate') => {
    const pageIds = paginatedPurchases.map(p => p.id);
    if (checked) {
      setSelectedRows(prev => [...new Set([...prev, ...pageIds])]);
    } else {
      setSelectedRows(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleDeleteSelected = () => {
    const selectedPurchases = dealerPurchases.filter(p => selectedRows.includes(p.id));
    deleteDealerPurchases(selectedPurchases);
    setSelectedRows([]);
  };

  const exportToCsv = (dataToExport: DealerPurchaseRecord[], fileName: string) => {
    const formattedData = dataToExport.map(p => ({
      "Sr.No": p.srNo,
      "Mobile": p.mobile,
      "Dealer Name": p.dealerName,
      "Sum": p.sum,
      "Price": p.price,
      "Payment Status": p.paymentStatus,
      "Port Out Status": p.portOutStatus,
      "UPC Status": p.upcStatus,
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
    const selectedData = dealerPurchases.filter(p => selectedRows.includes(p.id));
    if (selectedData.length === 0) {
      toast({
        variant: "destructive",
        title: "No records selected",
        description: "Please select at least one record to export.",
      });
      return;
    }
    exportToCsv(selectedData, 'dealer_purchases_export.csv');
    addActivity({
        employeeName: user?.displayName || 'User',
        action: 'Exported Data',
        description: `Exported ${selectedData.length} selected dealer purchase(s) to CSV.`
    });
    toast({
        title: "Export Successful",
        description: `${selectedData.length} selected dealer purchases have been exported to CSV.`,
    });
    setSelectedRows([]);
  }

  const isAllOnPageSelected = paginatedPurchases.length > 0 && paginatedPurchases.every(p => selectedRows.includes(p.id));

  
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
        <div className="flex flex-col sm:flex-row items-center gap-2">
            <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4"/>
                Add New Number
            </Button>
        </div>
      </PageHeader>
       <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
             <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map(val => (
                   <SelectItem key={val} value={String(val)}>{val} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRows.length > 0 && (
                <div className="flex items-center gap-2">
                    {role === 'admin' && (
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
                                This action cannot be undone. Only records where Payment Status is 'Done', Port Out Status is 'Done', AND UPC Status is 'Generated' will be permanently deleted.
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
                    <Button variant="outline" onClick={handleExportSelected}>
                        <Download className="mr-2 h-4 w-4" />
                        Export Selected ({selectedRows.length})
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
                   {role === 'admin' && (
                    <Checkbox
                        checked={isAllOnPageSelected}
                        onCheckedChange={handleSelectAllOnPage}
                        aria-label="Select all on this page"
                    />
                  )}
                </TableHead>
              <SortableHeader column="srNo" label="Sr.No" />
              <SortableHeader column="mobile" label="Number" />
              <SortableHeader column="dealerName" label="Dealer Name" />
              <SortableHeader column="sum" label="Sum" />
              <SortableHeader column="price" label="Price" />
              <SortableHeader column="paymentStatus" label="Payment Status" />
              <SortableHeader column="portOutStatus" label="Port Out Status" />
              <SortableHeader column="upcStatus" label="UPC Status" />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableSpinner colSpan={10} />
            ) : paginatedPurchases.length > 0 ? (
                paginatedPurchases.map((purchase) => (
                <TableRow key={purchase.srNo} data-state={selectedRows.includes(purchase.id) && "selected"}>
                    <TableCell>
                       {role === 'admin' && (
                        <Checkbox
                            checked={selectedRows.includes(purchase.id)}
                            onCheckedChange={() => handleSelectRow(purchase.id)}
                            aria-label="Select row"
                        />
                       )}
                    </TableCell>
                    <TableCell>{purchase.srNo}</TableCell>
                    <TableCell className="font-medium">{purchase.mobile}</TableCell>
                    <TableCell>{purchase.dealerName}</TableCell>
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
                    <TableCell>
                        <Badge variant={purchase.upcStatus === 'Generated' ? 'secondary' : 'outline'}>
                        {purchase.upcStatus}
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
                    <TableCell colSpan={10} className="h-24 text-center">
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
