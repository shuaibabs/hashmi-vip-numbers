
"use client";

import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState } from 'react';
import { Pagination } from '@/components/pagination';
import { TableSpinner } from '@/components/ui/spinner';

const ITEMS_PER_PAGE = 10;

export default function PortOutPage() {
  const { portOuts, loading } = useApp();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(portOuts.length / ITEMS_PER_PAGE);
  const paginatedPortOuts = [...portOuts]
    .sort((a, b) => new Date(b.portOutDate).getTime() - new Date(a.portOutDate).getTime())
    .slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <PageHeader
        title="Port Out History"
        description="A log of all numbers that have been successfully ported out."
      />
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sr.No</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Sold To</TableHead>
              <TableHead>Sale Price</TableHead>
              <TableHead>Sale Date</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>UPC Status</TableHead>
              <TableHead>Port Out Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableSpinner colSpan={8} />
            ) : paginatedPortOuts.length > 0 ? (
                paginatedPortOuts.map((record, index) => (
                <TableRow key={record.id}>
                    <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                    <TableCell className="font-medium">{record.mobile}</TableCell>
                    <TableCell>{record.soldTo}</TableCell>
                    <TableCell>₹{record.salePrice.toLocaleString()}</TableCell>
                    <TableCell>{format(new Date(record.saleDate), 'PPP')}</TableCell>
                    <TableCell>
                         <Badge variant={record.paymentStatus === 'Done' ? 'secondary' : 'outline'}>
                            {record.paymentStatus}
                        </Badge>
                    </TableCell>
                    <TableCell>
                         <Badge variant={record.upcStatus === 'Generated' ? 'secondary' : 'outline'}>
                            {record.upcStatus}
                        </Badge>
                    </TableCell>
                     <TableCell>{format(new Date(record.portOutDate), 'PPP')}</TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                        No port out records found.
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
        totalItems={portOuts.length}
      />
    </>
  );
}

