
"use client";

import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState } from 'react';
import { Pagination } from '@/components/pagination';
import { TableSpinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditSaleStatusModal } from '@/components/edit-sale-status-modal';
import { SaleRecord } from '@/lib/data';

const ITEMS_PER_PAGE = 10;

export default function SalesPage() {
  const { sales, loading } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);

  const totalPages = Math.ceil(sales.length / ITEMS_PER_PAGE);
  const paginatedSales = [...sales]
    .sort((a, b) => b.saleDate.toDate().getTime() - a.saleDate.toDate().getTime())
    .slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleEditClick = (sale: SaleRecord) => {
    setSelectedSale(sale);
    setIsEditModalOpen(true);
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
              <TableHead>Sum</TableHead>
              <TableHead>Sold To</TableHead>
              <TableHead>Sale Price</TableHead>
              <TableHead>Sale Date</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>UPC Status</TableHead>
              <TableHead>Portout Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableSpinner colSpan={10} />
            ) : paginatedSales.length > 0 ? (
                paginatedSales.map((sale) => (
                <TableRow key={sale.srNo}>
                    <TableCell>{sale.srNo}</TableCell>
                    <TableCell className="font-medium">{sale.mobile}</TableCell>
                    <TableCell>{sale.sum}</TableCell>
                    <TableCell>{sale.soldTo}</TableCell>
                    <TableCell>₹{sale.salePrice.toLocaleString()}</TableCell>
                    <TableCell>{format(sale.saleDate.toDate(), 'PPP')}</TableCell>
                    <TableCell>
                         <Badge variant={sale.paymentStatus === 'Done' ? 'secondary' : 'outline'}>
                            {sale.paymentStatus}
                        </Badge>
                    </TableCell>
                    <TableCell>
                         <Badge variant={sale.upcStatus === 'Generated' ? 'secondary' : 'outline'}>
                            {sale.upcStatus}
                        </Badge>
                    </TableCell>
                     <TableCell>
                         <Badge variant={sale.portOutStatus === 'Done' ? 'secondary' : 'outline'}>
                            {sale.portOutStatus}
                        </Badge>
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
                                <DropdownMenuItem onClick={() => handleEditClick(sale)}>
                                    Edit Status
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
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
      {selectedSale && (
        <EditSaleStatusModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            sale={selectedSale}
        />
      )}
    </>
  );
}
