
"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/app-context';
import type { NumberRecord } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserPlus, ArrowUpDown, DollarSign, PlusCircle, FileInput } from 'lucide-react';
import { format } from 'date-fns';
import { RtsStatusModal } from '@/components/rts-status-modal';
import { Pagination } from '@/components/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { AssignNumbersModal } from '@/components/assign-numbers-modal';
import { SellNumberModal } from '@/components/sell-number-modal';

type SortableColumn = keyof NumberRecord;

export default function AllNumbersPage() {
  const { numbers, role } = useApp();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedNumber, setSelectedNumber] = useState<NumberRecord | null>(null);
  const [isRtsModalOpen, setIsRtsModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortableColumn; direction: 'ascending' | 'descending' } | null>({ key: 'id', direction: 'ascending'});

  const sortedAndFilteredNumbers = useMemo(() => {
    let sortableItems = [...numbers]
      .filter(num => 
        (statusFilter === 'all' || num.status === statusFilter) &&
        (typeFilter === 'all' || num.numberType === typeFilter)
      )
      .filter(num => 
        num.mobile.toLowerCase().includes(searchTerm.toLowerCase()) ||
        num.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        num.location.toLowerCase().includes(searchTerm.toLowerCase())
      );

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue);
        } else if (aValue instanceof Date && bValue instanceof Date) {
            comparison = aValue.getTime() - bValue.getTime();
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
  }, [numbers, searchTerm, statusFilter, typeFilter, sortConfig]);

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
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };


  const handleMarkRTS = (number: NumberRecord) => {
    setSelectedNumber(number);
    setIsRtsModalOpen(true);
  };

  const handleSellNumber = (number: NumberRecord) => {
    setSelectedNumber(number);
    setIsSellModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleRowClick = (id: number) => {
    router.push(`/numbers/${id}`);
  };

  const handleSelectRow = (id: number) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedRows(paginatedNumbers.map(n => n.id));
    } else {
      setSelectedRows([]);
    }
  };

  const isAllOnPageSelected = paginatedNumbers.length > 0 && paginatedNumbers.every(n => selectedRows.includes(n.id));
  const isSomeOnPageSelected = selectedRows.length > 0 && !isAllOnPageSelected;

  const handleOpenAssignModal = () => {
    setIsAssignModalOpen(true);
  }
  
  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedRows([]);
  }

  const selectedNumberRecords = numbers.filter(n => selectedRows.includes(n.id));

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
        title="All Numbers (Master Inventory)"
        description="Search, filter, and manage all numbers in the system."
      >
        <div className="flex items-center gap-2">
            <Button onClick={() => router.push('/numbers/new')}>
                <PlusCircle className="mr-2 h-4 w-4"/>
                New Number
            </Button>
             <Button variant="outline" onClick={() => router.push('/import-export')}>
                <FileInput className="mr-2 h-4 w-4"/>
                Import / Export
            </Button>
        </div>
      </PageHeader>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Input 
              placeholder="Search by mobile, name, location..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100, 250, 500, 1000].map(val => (
                   <SelectItem key={val} value={String(val)}>{val} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           {role === 'admin' && selectedRows.length > 0 && (
             <Button onClick={handleOpenAssignModal}>
               <UserPlus className="mr-2 h-4 w-4" />
               Assign Selected ({selectedRows.length})
             </Button>
           )}
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-12">
                  {role === 'admin' && (
                    <Checkbox
                      checked={isAllOnPageSelected}
                      onCheckedChange={(checked) => handleSelectAll(checked)}
                      aria-label="Select all"
                    />
                  )}
                </TableHead>
                <TableHead>Sr.No</TableHead>
                <SortableHeader column="mobile" label="Mobile" />
                <SortableHeader column="numberType" label="Number Type" />
                <SortableHeader column="assignedTo" label="Assigned To" />
                <SortableHeader column="status" label="Status" />
                <SortableHeader column="purchaseFrom" label="Purchase From" />
                <SortableHeader column="location" label="Location" />
                <SortableHeader column="rtsDate" label="RTS Date" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedNumbers.map((num, index) => (
                <TableRow 
                    key={num.id} 
                    data-state={selectedRows.includes(num.id) && "selected"}
                >
                  <TableCell>
                    {role === 'admin' && (
                      <Checkbox
                        checked={selectedRows.includes(num.id)}
                        onCheckedChange={() => handleSelectRow(num.id)}
                        aria-label="Select row"
                      />
                    )}
                  </TableCell>
                  <TableCell onClick={() => handleRowClick(num.id)} className="cursor-pointer">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </TableCell>
                  <TableCell className="font-medium cursor-pointer" onClick={() => handleRowClick(num.id)}>{num.mobile}</TableCell>
                  <TableCell onClick={() => handleRowClick(num.id)} className="cursor-pointer">{num.numberType}</TableCell>
                  <TableCell onClick={() => handleRowClick(num.id)} className="cursor-pointer">{num.assignedTo}</TableCell>
                  <TableCell onClick={() => handleRowClick(num.id)} className="cursor-pointer">
                    <Badge variant={num.status === 'RTS' ? 'default' : 'destructive'} className={num.status === 'RTS' ? `bg-green-500/20 text-green-700 hover:bg-green-500/30` : `bg-red-500/20 text-red-700 hover:bg-red-500/30`}>{num.status}</Badge>
                  </TableCell>
                  <TableCell onClick={() => handleRowClick(num.id)} className="cursor-pointer">{num.purchaseFrom}</TableCell>
                  <TableCell onClick={() => handleRowClick(num.id)} className="cursor-pointer">{num.location}</TableCell>
                  <TableCell onClick={() => handleRowClick(num.id)} className="cursor-pointer">{num.rtsDate ? format(new Date(num.rtsDate), 'PPP') : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                   {(role === 'admin' || role === 'employee') && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/numbers/${num.id}`); }}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMarkRTS(num); }}>Update RTS Status</DropdownMenuItem>
                         <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-green-600 focus:text-green-700" onClick={(e) => { e.stopPropagation(); handleSellNumber(num); }}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Mark as Sold
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                   )}
                  </TableCell>
                </TableRow>
              ))}
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
        <SellNumberModal
          isOpen={isSellModalOpen}
          onClose={() => setIsSellModalOpen(false)}
          number={selectedNumber}
        />
      )}
      {role === 'admin' && (
        <AssignNumbersModal
            isOpen={isAssignModalOpen}
            onClose={closeAssignModal}
            selectedNumbers={selectedNumberRecords}
        />
      )}
    </>
  );
}
 

    