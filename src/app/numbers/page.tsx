

"use client";

import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/app-context';
import type { NumberRecord } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserPlus, ArrowUpDown, DollarSign, PlusCircle, FileInput, Trash, MapPin, Edit, UploadCloud, ArrowUp, ArrowDown, Bookmark } from 'lucide-react';
import { format } from 'date-fns';
import { RtsStatusModal } from '@/components/rts-status-modal';
import { Pagination } from '@/components/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { AssignNumbersModal } from '@/components/assign-numbers-modal';
import { SellNumberModal } from '@/components/sell-number-modal';
import { TableSpinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/auth-context';
import { Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { EditUploadStatusModal } from '@/components/edit-upload-status-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { BulkSellNumberModal } from '@/components/bulk-sell-modal';
import { useNavigation } from '@/context/navigation-context';
import { usePathname } from 'next/navigation';
import { EditLocationModal } from '@/components/edit-location-modal';
import { BulkEditUploadStatusModal } from '@/components/bulk-edit-upload-status-modal';
import { BulkDeleteNumbersModal } from '@/components/bulk-delete-numbers-modal';
import { cn } from '@/lib/utils';

type SortableColumn = keyof NumberRecord | 'id';

export default function AllNumbersPage() {
  const { numbers, loading, isMobileNumberDuplicate, deleteNumbers, markAsPreBooked, recentlyAutoRtsIds } = useApp();
  const { role } = useAuth();
  const { navigate } = useNavigation();
  const pathname = usePathname();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedNumber, setSelectedNumber] = useState<NumberRecord | null>(null);
  const [isRtsModalOpen, setIsRtsModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isBulkSellModalOpen, setIsBulkSellModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortableColumn; direction: 'ascending' | 'descending' } | null>({ key: 'srNo', direction: 'ascending'});
  const [isPreBookConfirmationOpen, setIsPreBookConfirmationOpen] = useState(false);

  const sortedAndFilteredNumbers = useMemo(() => {
    let sortableItems = [...numbers]
      .filter(num => 
        (statusFilter === 'all' || num.status === statusFilter) &&
        (typeFilter === 'all' || num.numberType === typeFilter)
      )
      .filter(num => 
        num.mobile.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
    // Prioritize recently auto-RTS'd numbers
    sortableItems.sort((a, b) => {
        const aIsRecent = recentlyAutoRtsIds.includes(a.id);
        const bIsRecent = recentlyAutoRtsIds.includes(b.id);
        if (aIsRecent && !bIsRecent) return -1;
        if (!aIsRecent && bIsRecent) return 1;
        return 0;
    });

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        // Keep recent RTS at top regardless of other sorting
        const aIsRecent = recentlyAutoRtsIds.includes(a.id);
        const bIsRecent = recentlyAutoRtsIds.includes(b.id);
        if (aIsRecent && !bIsRecent) return -1;
        if (!aIsRecent && bIsRecent) return 1;
        
        const aValue = a[sortConfig.key as keyof NumberRecord];
        const bValue = b[sortConfig.key as keyof NumberRecord];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue);
        } else if (aValue instanceof Date && bValue instanceof Date) {
            comparison = aValue.getTime() - bValue.getTime();
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
  }, [numbers, searchTerm, statusFilter, typeFilter, sortConfig, recentlyAutoRtsIds]);

  const totalPages = Math.ceil(sortedAndFilteredNumbers.length / itemsPerPage);
  const paginatedNumbers = sortedAndFilteredNumbers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };


  const handleMarkRTS = (number: NumberRecord) => {
    setSelectedNumber(number);
    setIsRtsModalOpen(true);
  };
  
  const handleEditUpload = (number: NumberRecord) => {
    setSelectedNumber(number);
    setIsUploadModalOpen(true);
  };

  const handleSellNumber = (number: NumberRecord) => {
    setSelectedNumber(number);
    setIsSellModalOpen(true);
  };
  
  const handleEditLocation = (number: NumberRecord) => {
    setSelectedRows([number.id]);
    setIsLocationModalOpen(true);
  }

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
    const pageIds = paginatedNumbers.map(n => n.id);
    if (checked) {
      setSelectedRows(prev => [...new Set([...prev, ...pageIds])]);
    } else {
      setSelectedRows(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const isAllOnPageSelected = paginatedNumbers.length > 0 && paginatedNumbers.every(n => selectedRows.includes(n.id));

  const handleOpenAssignModal = () => {
    setIsAssignModalOpen(true);
  }
  
  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedRows([]);
  }

  const handleOpenBulkSellModal = () => {
    setIsBulkSellModalOpen(true);
  };

  const closeBulkSellModal = () => {
    setIsBulkSellModalOpen(false);
    setSelectedRows([]);
  };

  const closeBulkUploadModal = () => {
    setIsBulkUploadModalOpen(false);
    setSelectedRows([]);
  }

  const closeLocationModal = () => {
    setIsLocationModalOpen(false);
    setSelectedRows([]);
  }
  
  const handleDeleteSelected = () => {
    deleteNumbers(selectedRows);
    setSelectedRows([]);
  };

  const selectedNumberRecords = numbers.filter(n => selectedRows.includes(n.id));

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

  const handleAddFromSearch = () => {
    const trimmedSearch = searchTerm.trim();
    if (!/^\d{10}$/.test(trimmedSearch)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Number',
        description: 'Mobile number must be exactly 10 digits.',
      });
      return;
    }
    if (isMobileNumberDuplicate(trimmedSearch)) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Number',
        description: 'This mobile number already exists in the system.',
      });
      return;
    }
    navigate(`/numbers/new?mobile=${trimmedSearch}`, pathname);
  };

  const handlePreBook = (number: NumberRecord) => {
    setSelectedRows([number.id]);
    setIsPreBookConfirmationOpen(true);
  }

  const handleConfirmPreBook = () => {
    markAsPreBooked(selectedRows);
    setIsPreBookConfirmationOpen(false);
    setSelectedRows([]);
  }

  return (
    <>
      <PageHeader
        title="All Numbers (Master Inventory)"
        description="Search, filter, and manage all numbers in the system."
      >
        <div className="flex flex-col sm:flex-row items-center gap-2">
            <Button onClick={() => navigate('/numbers/new', pathname)} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4"/>
                New Number
            </Button>
             <Button variant="outline" onClick={() => navigate('/import-export', pathname)} className="w-full sm:w-auto">
                <FileInput className="mr-2 h-4 w-4"/>
                Import / Export
            </Button>
            {role === 'admin' && (
              <Button variant="destructive" onClick={() => setIsBulkDeleteModalOpen(true)} className="w-full sm:w-auto">
                  <Trash className="mr-2 h-4 w-4"/>
                  Bulk Delete
              </Button>
            )}
        </div>
      </PageHeader>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap w-full">
            <Input 
              placeholder="Search by mobile number..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-full sm:max-w-sm"
            />
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="RTS">RTS</SelectItem>
                <SelectItem value="Non-RTS">Non-RTS</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value) => {
              setTypeFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Prepaid">Prepaid</SelectItem>
                <SelectItem value="Postpaid">Postpaid</SelectItem>
                <SelectItem value="COCP">COCP</SelectItem>
              </SelectContent>
            </Select>
             <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100, 250, 500, 1000].map(val => (
                   <SelectItem key={val} value={String(val)}>{val} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {selectedRows.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
              {role === 'admin' && (
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                          <Trash className="mr-2 h-4 w-4" />
                          Delete ({selectedRows.length})
                      </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete {selectedRows.length} number record(s).
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
              {role === 'admin' && (
                  <Button onClick={handleOpenAssignModal}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign ({selectedRows.length})
                  </Button>
              )}
              <Button onClick={() => setIsBulkUploadModalOpen(true)} variant="outline">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Edit Upload Status ({selectedRows.length})
              </Button>
              <Button onClick={() => setIsPreBookConfirmationOpen(true)} variant="outline">
                  <Bookmark className="mr-2 h-4 w-4" />
                  Pre-Book ({selectedRows.length})
              </Button>
              <Button onClick={handleOpenBulkSellModal} className="bg-green-600 hover:bg-green-700 text-white">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Sell ({selectedRows.length})
              </Button>
          </div>
        )}
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
                <SortableHeader column="numberType" label="Number Type" />
                <SortableHeader column="ownershipType" label="Ownership Type" />
                <SortableHeader column="partnerName" label="Partner Name" />
                <SortableHeader column="uploadStatus" label="Upload Status" />
                <SortableHeader column="assignedTo" label="Assigned To" />
                <SortableHeader column="locationType" label="Location Type" />
                <SortableHeader column="currentLocation" label="Current Location" />
                <SortableHeader column="status" label="Status" />
                <SortableHeader column="purchaseFrom" label="Purchase From" />
                <SortableHeader column="rtsDate" label="RTS Date" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                  <TableSpinner colSpan={15} />
              ) : paginatedNumbers.length > 0 ? (
                  paginatedNumbers.map((num) => (
                    <TableRow 
                        key={num.srNo}
                        data-state={selectedRows.includes(num.id) && "selected"}
                        className={cn(recentlyAutoRtsIds.includes(num.id) && "bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-100/80 dark:hover:bg-amber-900/40 data-[state=selected]:bg-amber-200 dark:data-[state=selected]:bg-amber-900/50")}
                    >
                    <TableCell>
                        {num.id && (
                        <Checkbox
                            checked={selectedRows.includes(num.id)}
                            onCheckedChange={() => handleSelectRow(num.id)}
                            aria-label="Select row"
                        />
                        )}
                    </TableCell>
                    <TableCell>
                        {num.srNo}
                    </TableCell>
                    <TableCell className="font-medium">{highlightMatch(num.mobile, searchTerm)}</TableCell>
                    <TableCell>{num.sum}</TableCell>
                    <TableCell>{num.numberType}</TableCell>
                    <TableCell>{num.ownershipType}</TableCell>
                    <TableCell>{num.partnerName || 'N/A'}</TableCell>
                    <TableCell>
                        <Badge variant={num.uploadStatus === 'Done' ? 'secondary' : 'outline'}>
                            {num.uploadStatus}
                        </Badge>
                    </TableCell>
                    <TableCell>{num.assignedTo}</TableCell>
                    <TableCell>{num.locationType}</TableCell>
                    <TableCell>{num.currentLocation}</TableCell>
                    <TableCell>
                        <Badge variant={num.status === 'RTS' ? 'default' : 'destructive'} className={num.status === 'RTS' ? `bg-green-500/20 text-green-700 hover:bg-green-500/30` : `bg-red-500/20 text-red-700 hover:bg-red-500/30`}>{num.status}</Badge>
                    </TableCell>
                    <TableCell>{num.purchaseFrom}</TableCell>
                    <TableCell>{num.rtsDate ? format(num.rtsDate.toDate(), 'PPP') : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                    {(role === 'admin' || role === 'employee') && (
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/numbers/${num.id}`, pathname)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkRTS(num)}>Update RTS Status</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUpload(num)}>Edit Upload Status</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditLocation(num)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Location
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => handlePreBook(num)}>
                              <Bookmark className="mr-2 h-4 w-4" />
                              Pre-Book Number
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-green-600 focus:text-green-700" onClick={() => handleSellNumber(num)}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Mark as Sold
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={15} className="h-24 text-center">
                        {searchTerm && `No number found for "${searchTerm}".`}
                        {!searchTerm && "No numbers found for the current filters."}
                        {searchTerm && (
                           <Button 
                             variant="link"
                             onClick={handleAddFromSearch}
                           >
                             Add this number
                           </Button>
                        )}
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} itemsPerPage={itemsPerPage} totalItems={sortedAndFilteredNumbers.length} />

      </div>
      {selectedNumber && (
        <RtsStatusModal
          isOpen={isRtsModalOpen}
          onClose={() => setIsRtsModalOpen(false)}
          number={selectedNumber}
        />
      )}
      {selectedNumber && (
        <EditUploadStatusModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          number={selectedNumber}
        />
      )}
       {selectedNumber && (
        <SellNumberModal
          isOpen={isSellModalOpen}
          onClose={() => setIsSellModalOpen(false)}
          number={selectedNumber}
        />
      )}
      <BulkSellNumberModal
        isOpen={isBulkSellModalOpen}
        onClose={closeBulkSellModal}
        selectedNumbers={selectedNumberRecords}
      />
       <BulkEditUploadStatusModal
        isOpen={isBulkUploadModalOpen}
        onClose={closeBulkUploadModal}
        selectedNumbers={selectedNumberRecords}
      />
      <EditLocationModal 
        isOpen={isLocationModalOpen}
        onClose={closeLocationModal}
        selectedNumbers={selectedNumberRecords}
      />
      <BulkDeleteNumbersModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
      />
      {role === 'admin' && (
        <AssignNumbersModal
            isOpen={isAssignModalOpen}
            onClose={closeAssignModal}
            selectedNumbers={selectedNumberRecords}
        />
      )}
      <AlertDialog open={isPreBookConfirmationOpen} onOpenChange={setIsPreBookConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will move {selectedRows.length} number(s) to the Pre-Booking list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPreBook}>
              Yes, Pre-Book
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
