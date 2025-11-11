"use client";

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Pagination } from '@/components/pagination';
import { Power } from 'lucide-react';
import { NumberRecord } from '@/lib/data';
import { ActivationModal } from '@/components/activation-modal';
import { TableSpinner } from '@/components/ui/spinner';

const ITEMS_PER_PAGE = 15;

export default function ActivationPage() {
  const { numbers, loading } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNumber, setSelectedNumber] = useState<NumberRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pendingActivationNumbers = numbers.filter(n => n.activationStatus !== 'Done');

  const totalPages = Math.ceil(pendingActivationNumbers.length / ITEMS_PER_PAGE);
  const paginatedNumbers = pendingActivationNumbers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleActivateClick = (number: NumberRecord) => {
    setSelectedNumber(number);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: 'Done' | 'Pending' | 'Fail') => {
    switch (status) {
      case 'Done':
        return <Badge variant="default" className="bg-green-500/20 text-green-700">{status}</Badge>;
      case 'Pending':
        return <Badge variant="outline">{status}</Badge>;
      case 'Fail':
        return <Badge variant="destructive">{status}</Badge>;
    }
  };

  return (
    <>
      <PageHeader
        title="SIM Activation"
        description="Activate new SIM numbers and track their status."
      />
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SIM Number</TableHead>
              <TableHead>Activation Status</TableHead>
              <TableHead>Upload Status</TableHead>
              <TableHead>Scheduled RTS Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableSpinner colSpan={5} />
            ) : paginatedNumbers.length > 0 ? (
                paginatedNumbers.map((num) => (
                <TableRow key={num.id}>
                    <TableCell className="font-medium">{num.mobile}</TableCell>
                    <TableCell>{getStatusBadge(num.activationStatus)}</TableCell>
                    <TableCell>{getStatusBadge(num.uploadStatus)}</TableCell>
                    <TableCell>{num.rtsDate ? format(new Date(num.rtsDate), 'PPP') : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                    {num.activationStatus !== 'Done' && (
                        <Button size="sm" onClick={() => handleActivateClick(num)}>
                        <Power className="mr-2 h-4 w-4" />
                        Activate
                        </Button>
                    )}
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No numbers pending activation.
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
        totalItems={pendingActivationNumbers.length}
      />
      {selectedNumber && (
        <ActivationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          number={selectedNumber}
        />
      )}
    </>
  );
}
