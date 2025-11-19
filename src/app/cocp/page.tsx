
"use client";

import { useState, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { format } from 'date-fns';
import { TableSpinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { NumberRecord } from '@/lib/data';
import { Timestamp } from 'firebase/firestore';


const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 250, 500, 1000];
type SortableColumn = keyof NumberRecord;

export default function CocpPage() {
  const { numbers, loading } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [sortConfig, setSortConfig] = useState<{ key: SortableColumn; direction: 'ascending' | 'descending' } | null>(null);

  const cocpNumbers = useMemo(() => {
    return numbers.filter(num => num.numberType === 'COCP');
  }, [numbers]);

  const sortedNumbers = useMemo(() => {
    let sortableItems = [...cocpNumbers];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof NumberRecord];
        const bValue = b[sortConfig.key as keyof NumberRecord];

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
  }, [cocpNumbers, sortConfig]);

  const totalPages = Math.ceil(sortedNumbers.length / itemsPerPage);
  const paginatedNumbers = sortedNumbers.slice(
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
        title="COCP Numbers"
        description="List of all COCP (Customer Owned Customer Premise) numbers."
      />
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
              <SortableHeader column="rtsDate" label="RTS Date" />
              <SortableHeader column="safeCustodyDate" label="Safe Custody Date" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableSpinner colSpan={5} />
            ) : paginatedNumbers.length > 0 ? (
                paginatedNumbers.map((num) => (
                <TableRow key={num.srNo}>
                    <TableCell>{num.srNo}</TableCell>
                    <TableCell className="font-medium">{num.mobile}</TableCell>
                    <TableCell>{num.sum}</TableCell>
                    <TableCell>{num.rtsDate ? format(num.rtsDate.toDate(), 'PPP') : 'N/A'}</TableCell>
                    <TableCell>{num.safeCustodyDate ? format(num.safeCustodyDate.toDate(), 'PPP') : 'N/A'}</TableCell>
                </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No COCP numbers found.
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
        totalItems={cocpNumbers.length}
      />
    </>
  );
}
