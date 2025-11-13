
"use client";

import { useState, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { format } from 'date-fns';
import { TableSpinner } from '@/components/ui/spinner';

const ITEMS_PER_PAGE = 15;

export default function CocpPage() {
  const { numbers, loading } = useApp();
  const [currentPage, setCurrentPage] = useState(1);

  const cocpNumbers = useMemo(() => {
    return numbers.filter(num => num.numberType === 'COCP');
  }, [numbers]);

  const totalPages = Math.ceil(cocpNumbers.length / ITEMS_PER_PAGE);
  const paginatedNumbers = cocpNumbers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <PageHeader
        title="COCP Numbers"
        description="List of all COCP (Customer Owned Customer Premise) numbers."
      />
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sr.No</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Sum</TableHead>
              <TableHead>RTS Date</TableHead>
              <TableHead>Safe Custody Date</TableHead>
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
        itemsPerPage={ITEMS_PER_PAGE}
        totalItems={cocpNumbers.length}
      />
    </>
  );
}
