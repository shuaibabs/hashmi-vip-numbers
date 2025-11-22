
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
import { ArrowUpDown, Download, MoreHorizontal } from 'lucide-react';
import { NumberRecord } from '@/lib/data';
import { Timestamp } from 'firebase/firestore';
import { Checkbox } from '@/components/ui/checkbox';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditCocpDateModal } from '@/components/edit-cocp-date-modal';


const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 250, 500, 1000];
type SortableColumn = keyof NumberRecord;

export default function CocpPage() {
  const { numbers, loading, addActivity } = useApp();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: SortableColumn; direction: 'ascending' | 'descending' } | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<NumberRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const exportToCsv = (dataToExport: NumberRecord[], fileName: string) => {
     const formattedData = dataToExport.map(n => ({
        "Sr.No": n.srNo,
        "Mobile": n.mobile,
        "Sum": n.sum,
        "RTS Date": n.rtsDate ? format(n.rtsDate.toDate(), 'yyyy-MM-dd') : 'N/A',
        "Safe Custody Date": n.safeCustodyDate ? format(n.safeCustodyDate.toDate(), 'yyyy-MM-dd') : 'N/A',
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
    const selectedData = cocpNumbers.filter(n => selectedRows.includes(n.id));
    if (selectedData.length === 0) {
      toast({
        variant: "destructive",
        title: "No COCP numbers selected",
        description: "Please select at least one number to export.",
      });
      return;
    }
    exportToCsv(selectedData, 'cocp_numbers_export.csv');
     addActivity({
        employeeName: 'Admin',
        action: 'Exported Data',
        description: `Exported ${selectedData.length} selected COCP number(s) to CSV.`
    });
    toast({
        title: "Export Successful",
        description: `${selectedData.length} selected COCP numbers have been exported to CSV.`,
    });
    setSelectedRows([]);
  }

  const handleEditClick = (number: NumberRecord) => {
    setSelectedNumber(number);
    setIsEditModalOpen(true);
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
                   <Checkbox
                        checked={isAllOnPageSelected}
                        onCheckedChange={handleSelectAllOnPage}
                        aria-label="Select all on this page"
                    />
                </TableHead>
              <SortableHeader column="srNo" label="Sr.No" />
              <SortableHeader column="mobile" label="Number" />
              <SortableHeader column="sum" label="Sum" />
              <SortableHeader column="rtsDate" label="RTS Date" />
              <SortableHeader column="safeCustodyDate" label="Safe Custody Date" />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableSpinner colSpan={7} />
            ) : paginatedNumbers.length > 0 ? (
                paginatedNumbers.map((num) => (
                <TableRow key={num.srNo} data-state={selectedRows.includes(num.id) && "selected"}>
                   <TableCell>
                       <Checkbox
                            checked={selectedRows.includes(num.id)}
                            onCheckedChange={() => handleSelectRow(num.id)}
                            aria-label="Select row"
                        />
                    </TableCell>
                    <TableCell>{num.srNo}</TableCell>
                    <TableCell className="font-medium">{num.mobile}</TableCell>
                    <TableCell>{num.sum}</TableCell>
                    <TableCell>{num.rtsDate ? format(num.rtsDate.toDate(), 'PPP') : 'N/A'}</TableCell>
                    <TableCell>{num.safeCustodyDate ? format(num.safeCustodyDate.toDate(), 'PPP') : 'N/A'}</TableCell>
                     <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(num)}>
                            Edit Date
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
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
      {selectedNumber && (
        <EditCocpDateModal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
            number={selectedNumber}
        />
      )}
    </>
  );
}
