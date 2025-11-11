
"use client";

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { Pagination } from '@/components/pagination';
import { AddDealerPurchaseModal } from '@/components/add-dealer-purchase-modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditDealerPurchaseModal } from '@/components/edit-dealer-purchase-modal';
import { DealerPurchaseRecord } from '@/lib/data';
import { TableSpinner } from '@/components/ui/spinner';

const ITEMS_PER_PAGE = 10;

export default function DealerPurchasesPage() {
  const { dealerPurchases, loading } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<DealerPurchaseRecord | null>(null);

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
  
  const handleEditClick = (purchase: DealerPurchaseRecord) => {
    setSelectedPurchase(purchase);
    setIsEditModalOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Purchase from Other Dealers"
        description="A list of numbers purchased from other dealers."
      >
        <Button onClick={() => setIsAddModalOpen(true)}>
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableSpinner colSpan={6} />
            ) : paginatedPurchases.length > 0 ? (
                paginatedPurchases.map((purchase, index) => (
                <TableRow key={purchase.id}>
                    <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                    <TableCell className="font-medium">{purchase.mobile}</TableCell>
                    <TableCell>₹{purchase.price.toLocaleString()}</TableCell>
                    <TableCell>
                        <Badge variant={purchase.paymentStatus === 'Done' ? 'secondary' : 'outline'}>
                        {purchase.paymentStatus}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={purchase.portOutStatus === 'Done' ? 'secondary' : 'outline'}>
                        {purchase.portOutStatus}
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
                            <DropdownMenuItem onClick={() => handleEditClick(purchase)}>
                            Edit Status
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
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
      <AddDealerPurchaseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      {selectedPurchase && (
        <EditDealerPurchaseModal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
            purchase={selectedPurchase}
        />
      )}
    </>
  );
}
