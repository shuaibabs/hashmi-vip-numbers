
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserPlus, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { RtsStatusModal } from '@/components/rts-status-modal';
import { Pagination } from '@/components/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { AssignNumbersModal } from '@/components/assign-numbers-modal';

const ITEMS_PER_PAGE = 10;

type SortableColumn = keyof NumberRecord;

export default function AllNumbersPage() {
  const { numbers, role } = useApp();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedNumber, setSelectedNumber] = useState<NumberRecord | null>(null);
  const [isRtsModalOpen, setIsRtsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortableColumn; direction: 'ascending' | 'descending' } | null>({ key: 'id', direction: 'ascending'});

  const sortedAndFilteredNumbers = useMemo(() => {
    let sortableItems = [...numbers]
      .filter(num => 
        (statusFilter === 'all' || num.status === statusFilter)
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
  }, [numbers, searchTerm, statusFilter, sortConfig]);

  const totalPages = Math.ceil(sortedAndFilteredNumbers.length / ITEMS_PER_PAGE);
  const paginatedNumbers = sortedAndFilteredNumbers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
      />
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
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
                <SortableHeader column="assignedTo" label="Assigned To" />
                <SortableHeader column="status" label="Status" />
                <SortableHeader column="purchaseFrom" label="Purchase From" />
                <SortableHeader column="location" label="Location" />
                <SortableHeader column="rtsDate" label="RTS Date" />
                <SortableHeader column="upcStatus" label="UPC Status" />
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
                    {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </TableCell>
                  <TableCell className="font-medium cursor-pointer" onClick={() => handleRowClick(num.id)}>{num.mobile}</TableCell>
                  <TableCell onClick={() => handleRowClick(num.id)} className="cursor-pointer">{num.assignedTo}</TableCell>
                  <TableCell onClick={() => handleRowClick(num.id)} className="cursor-pointer">
                    <Badge variant={num.status === 'RTS' ? 'default' : 'destructive'} className={num.status === 'RTS' ? `bg-green-500/20 text-green-700 hover:bg-green-500/30` : `bg-red-500/20 text-red-700 hover:bg-red-500/30`}>{num.status}</Badge>
                  </TableCell>
                  <TableCell onClick={() => handleRowClick(num.id)} className="cursor-pointer">{num.purchaseFrom}</TableCell>
                  <TableCell onClick={() => handleRowClick(num.id)} className="cursor-pointer">{num.location}</TableCell>
                  <TableCell onClick={() => handleRowClick(num.id)} className="cursor-pointer">{num.rtsDate ? format(new Date(num.rtsDate), 'PPP') : 'N/A'}</TableCell>
                  <TableCell onClick={() => handleRowClick(num.id)} className="cursor-pointer">
                    <Badge variant={num.upcStatus === 'Generated' ? 'secondary' : 'outline'}>{num.upcStatus}</Badge>
                  </TableCell>
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
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/numbers/${num.id}`); }}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMarkRTS(num); }}>Mark RTS</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                   )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} itemsPerPage={ITEMS_PER_PAGE} totalItems={sortedAndFilteredNumbers.length} />

      </div>
      {selectedNumber && (
        <RtsStatusModal
          isOpen={isRtsModalOpen}
          onClose={() => setIsRtsModalOpen(false)}
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
 

    