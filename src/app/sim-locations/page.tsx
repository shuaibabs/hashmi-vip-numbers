"use client";

import { useState, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/pagination';

const ITEMS_PER_PAGE = 10;

export default function SimLocationsPage() {
  const { numbers } = useApp();
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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by location type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="Store">Store</SelectItem>
            <SelectItem value="Employee">Employee</SelectItem>
            <SelectItem value="Customer">Customer</SelectItem>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedNumbers.map((num, index) => (
              <TableRow key={num.id}>
                <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                <TableCell className="font-medium">{num.mobile}</TableCell>
                <TableCell>{num.currentLocation}</TableCell>
                <TableCell>{num.locationType}</TableCell>
                <TableCell>{num.assignedTo}</TableCell>
              </TableRow>
            ))}
            {paginatedNumbers.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
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
