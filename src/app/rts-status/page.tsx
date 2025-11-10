"use client";

import { useState, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Pagination } from '@/components/pagination';
import type { NumberRecord } from '@/lib/data';

const ITEMS_PER_PAGE = 10;

function NumbersTable({ numbers, status }: { numbers: NumberRecord[], status: 'RTS' | 'Non-RTS' }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(numbers.length / ITEMS_PER_PAGE);
  const paginatedNumbers = numbers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sr.No</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Purchase From</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>{status === 'RTS' ? 'RTS Date' : 'Purchase Date'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedNumbers.map((num, index) => (
              <TableRow key={num.id}>
                <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                <TableCell className="font-medium">{num.mobile}</TableCell>
                <TableCell>{num.purchaseFrom}</TableCell>
                <TableCell>{num.location}</TableCell>
                <TableCell>
                  {status === 'RTS' 
                    ? num.rtsDate ? format(new Date(num.rtsDate), 'PPP') : 'N/A'
                    : num.purchaseDate ? format(new Date(num.purchaseDate), 'PPP') : 'N/A'
                  }
                </TableCell>
              </TableRow>
            ))}
             {paginatedNumbers.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No numbers found.
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
        totalItems={numbers.length}
      />
    </div>
  );
}

export default function RtsStatusPage() {
  const { numbers } = useApp();

  const rtsNumbers = useMemo(() => numbers.filter(n => n.status === 'RTS'), [numbers]);
  const nonRtsNumbers = useMemo(() => numbers.filter(n => n.status === 'Non-RTS'), [numbers]);

  return (
    <>
      <PageHeader
        title="RTS / Non-RTS Lists"
        description="View lists of numbers based on their RTS status."
      />
      <Tabs defaultValue="rts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rts">
            RTS Numbers <Badge className="ml-2">{rtsNumbers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="non-rts">
            Non-RTS Numbers <Badge variant="destructive" className="ml-2">{nonRtsNumbers.length}</Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="rts">
          <NumbersTable numbers={rtsNumbers} status="RTS" />
        </TabsContent>
        <TabsContent value="non-rts">
          <NumbersTable numbers={nonRtsNumbers} status="Non-RTS" />
        </TabsContent>
      </Tabs>
    </>
  );
}
