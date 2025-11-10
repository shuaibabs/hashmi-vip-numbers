"use client";

import { useState, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import type { NumberRecord } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { RtsStatusModal } from '@/components/rts-status-modal';
import { Pagination } from '@/components/pagination';

const ITEMS_PER_PAGE = 10;

export default function AllNumbersPage() {
  const { numbers } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedNumber, setSelectedNumber] = useState<NumberRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredNumbers = useMemo(() => {
    return numbers
      .filter(num => 
        (statusFilter === 'all' || num.status === statusFilter)
      )
      .filter(num => 
        num.mobile.toLowerCase().includes(searchTerm.toLowerCase()) ||
        num.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        num.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [numbers, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredNumbers.length / ITEMS_PER_PAGE);
  const paginatedNumbers = filteredNumbers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );


  const handleMarkRTS = (number: NumberRecord) => {
    setSelectedNumber(number);
    setIsModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <PageHeader
        title="All Numbers (Master Inventory)"
        description="Search, filter, and manage all numbers in the system."
      />
      <div className="space-y-4">
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
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sr.No</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Purchase From</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>RTS Date</TableHead>
                <TableHead>UPC Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedNumbers.map((num, index) => (
                <TableRow key={num.id}>
                  <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                  <TableCell className="font-medium">{num.mobile}</TableCell>
                  <TableCell>
                    <Badge variant={num.status === 'RTS' ? 'default' : 'destructive'} className={num.status === 'RTS' ? `bg-green-500/20 text-green-700 hover:bg-green-500/30` : `bg-red-500/20 text-red-700 hover:bg-red-500/30`}>{num.status}</Badge>
                  </TableCell>
                  <TableCell>{num.purchaseFrom}</TableCell>
                  <TableCell>{num.location}</TableCell>
                  <TableCell>{num.rtsDate ? format(new Date(num.rtsDate), 'PPP') : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={num.upcStatus === 'Generated' ? 'secondary' : 'outline'}>{num.upcStatus}</Badge>
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
                        <DropdownMenuItem>View</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMarkRTS(num)}>Mark RTS</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} itemsPerPage={ITEMS_PER_PAGE} totalItems={filteredNumbers.length} />

      </div>
      {selectedNumber && (
        <RtsStatusModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          number={selectedNumber}
        />
      )}
    </>
  );
}
