"use client";

import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";
import { Pagination } from "@/components/pagination";
import { TableSpinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/auth-context";

const ITEMS_PER_PAGE = 15;

export default function ActivitiesPage() {
  const { activities, loading } = useApp();
  const { role } = useAuth();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  if (role !== 'admin') {
    // Using router.push as redirect can cause issues in client components
    useEffect(() => {
      router.push('/dashboard');
    }, [router]);
    return null;
  }
  
  const sortedActivities = [...activities].sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());

  const totalPages = Math.ceil(sortedActivities.length / ITEMS_PER_PAGE);
  const paginatedActivities = sortedActivities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <PageHeader
        title="Employee Activity Log"
        description="A log of all actions performed by employees in the system."
      />
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {loading ? (
              <TableSpinner colSpan={4} />
            ) : paginatedActivities.length > 0 ? (
                paginatedActivities.map((activity) => (
                <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.employeeName}</TableCell>
                    <TableCell>{activity.action}</TableCell>
                    <TableCell>{activity.description}</TableCell>
                    <TableCell>{format(activity.timestamp.toDate(), 'PPpp')}</TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No activities found.
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
        totalItems={sortedActivities.length}
      />
    </>
  );
}
