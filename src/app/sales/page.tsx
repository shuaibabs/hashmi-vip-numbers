"use client";

import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { useState } from 'react';
import { Pagination } from '@/components/pagination';
import { TableSpinner } from '@/components/ui/spinner';

const ITEMS_PER_PAGE = 10;

export default function SalesPage() {
  const { sales, toggleSalePaymentStatus, loading } = useApp();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(sales.length / ITEMS_PER_PAGE);
  const paginatedSales = [...sales]
    .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
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
        title="Sales"
        description="View and manage all sales records."
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableSpinner colSpan={6} />
            ) : paginatedSales.length > 0 ? (
                paginatedSales.map((sale, index) => (
                <TableRow key={sale.id}>
                    <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                    <TableCell className="font-medium">{sale.mobile}</TableCell>
                    <TableCell>{sale.soldTo}</TableCell>
                    <TableCell>₹{sale.salePrice.toLocaleString()}</TableCell>
                    <TableCell>{format(new Date(sale.saleDate), 'PPP')}</TableCell>
                    <TableCell>
                    <div className="flex items-center gap-2">
                        <Switch
                        id={`payment-status-${sale.id}`}
                        checked={sale.paymentStatus === 'Done'}
                        onCheckedChange={() => toggleSalePaymentStatus(sale.id)}
                        aria-label="Toggle payment status"
                        />
                        <Badge variant={sale.paymentStatus === 'Done' ? 'secondary' : 'outline'}>
                        {sale.paymentStatus}
                        </Badge>
                    </div>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No sales records found.
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
        totalItems={sales.length}
      />
    </>
  );
}
