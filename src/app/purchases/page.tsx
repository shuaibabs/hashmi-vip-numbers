"use client";

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { NewPurchaseModal } from '@/components/new-purchase-modal';
import { Pagination } from '@/components/pagination';

const ITEMS_PER_PAGE = 10;

export default function PurchasesPage() {
  const { purchases } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(purchases.length / ITEMS_PER_PAGE);
  const paginatedPurchases = [...purchases]
    .sort((a,b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
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
        title="Purchases"
        description="View and manage all purchase records."
      >
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Purchase
        </Button>
      </PageHeader>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sr.No</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Purchased From</TableHead>
              <TableHead>Purchase Price</TableHead>
              <TableHead>Purchase Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPurchases.map((purchase, index) => (
              <TableRow key={purchase.id}>
                <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                <TableCell className="font-medium">{purchase.mobile}</TableCell>
                <TableCell>{purchase.purchasedFrom}</TableCell>
                <TableCell>₹{purchase.purchasePrice.toLocaleString()}</TableCell>
                <TableCell>{format(new Date(purchase.purchaseDate), 'PPP')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={ITEMS_PER_PAGE}
        totalItems={purchases.length}
      />

      <NewPurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
