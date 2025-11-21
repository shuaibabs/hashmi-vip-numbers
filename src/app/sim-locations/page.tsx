
"use client";

import { useState, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { format } from 'date-fns';
import { TableSpinner } from '@/components/ui/spinner';

const ITEMS_PER_PAGE = 10;

export default function SimLocationsPage() {
  const { numbers, checkInNumber, loading } = useApp();
  const [locationFilter, setLocationFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredNumbers = useMemo(() => {
    return numbers.filter(num => locationFilter === 'all' || num.locationType === locationFilter);
  }, [numbers, locationFilter]);

  const totalPages = Math.ceil(filteredNumbers.length / ITEMS_PER_PAGE);
  const paginatedNumbers = filteredNumbers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };


  return (
    <>
      <PageHeader
        title="SIM Location Tracking"
        description="Track the current location and assignment of all SIMs."
      >
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by location type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="Store">Store</SelectItem>
            <SelectItem value="Employee">Employee</SelectItem>
            <SelectItem value="Dealer">Dealer</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sr.No</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Current Location</TableHead>
              <TableHead>Location Type</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Last Checked In</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableSpinner colSpan={7} />
            ) : paginatedNumbers.length > 0 ? (
                paginatedNumbers.map((num, index) => (
                <TableRow key={num.id}>
                    <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                    <TableCell className="font-medium">{num.mobile}</TableCell>
                    <TableCell>{num.currentLocation}</TableCell>
                    <TableCell>{num.locationType}</TableCell>
                    <TableCell>{num.assignedTo}</TableCell>
                    <TableCell>{num.checkInDate ? format(num.checkInDate.toDate(), 'PPP p') : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => checkInNumber(num.id)}>
                        <LogIn className="mr-2 h-4 w-4" />
                        Check In
                    </Button>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        No locations found for this filter.
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
        itemsPerPage={ITEMS_PER_PAGE}
        totalItems={filteredNumbers.length}
      />
    </>
  );
}
