
"use client";

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PlusCircle } from 'lucide-react';
import { Pagination } from '@/components/pagination';
import { AddDealerPurchaseModal } from '@/components/add-dealer-purchase-modal';

const ITEMS_PER_PAGE = 10;

export default function DealerPurchasesPage() {
  const { dealerPurchases, toggleDealerPaymentStatus, toggleDealerPortOutStatus } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalPages = Math.ceil(dealerPurchases.length / ITEMS_PER_PAGE);
  const paginatedPurchases = [...dealerPurchases]
    .sort((a, b) => b.id - a.id)
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
        title="Purchase from Other Dealers"
        description="A list of numbers purchased from other dealers."
      >
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4"/>
          Add New Number
        </Button>
      </PageHeader>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sr.No</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Port Out Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPurchases.map((purchase, index) => (
              <TableRow key={purchase.id}>
                <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                <TableCell className="font-medium">{purchase.mobile}</TableCell>
                <TableCell>₹{purchase.price.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`payment-status-${purchase.id}`}
                      checked={purchase.paymentStatus === 'Done'}
                      onCheckedChange={() => toggleDealerPaymentStatus(purchase.id)}
                      aria-label="Toggle payment status"
                    />
                    <Badge variant={purchase.paymentStatus === 'Done' ? 'secondary' : 'outline'}>
                      {purchase.paymentStatus}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`port-out-status-${purchase.id}`}
                      checked={purchase.portOutStatus === 'Done'}
                      onCheckedChange={() => toggleDealerPortOutStatus(purchase.id)}
                      aria-label="Toggle port out status"
                    />
                     <Badge variant={purchase.portOutStatus === 'Done' ? 'secondary' : 'outline'}>
                      {purchase.portOutStatus}
                    </Badge>
                  </div>
                </TableCell>
              </TableRow>
            ))}
             {paginatedPurchases.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No dealer purchases found.
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
        totalItems={dealerPurchases.length}
      />
      <AddDealerPurchaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
