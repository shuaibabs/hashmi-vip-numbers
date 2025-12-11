
"use client";

import { useState, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Pagination } from '@/components/pagination';
import { TableSpinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SaleRecord } from '@/lib/data';
import { format } from 'date-fns';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 250, 500, 1000];

export default function ManageSalesPage() {
  const { sales, loading, addActivity } = useApp();
  const { role, user } = useAuth();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [soldToFilter, setSoldToFilter] = useState('all');

  const roleFilteredSales = useMemo(() => {
    if (role === 'admin') {
      return sales;
    }
    return sales.filter(sale => sale.originalNumberData?.assignedTo === user?.displayName);
  }, [sales, role, user?.displayName]);

  const soldToOptions = useMemo(() => {
    const allVendors = roleFilteredSales.map(s => s.soldTo);
    return ['all', ...Array.from(new Set(allVendors))];
  }, [roleFilteredSales]);

  const filteredSales = useMemo(() => {
    return roleFilteredSales.filter(sale => 
      soldToFilter === 'all' || sale.soldTo === soldToFilter
    );
  }, [roleFilteredSales, soldToFilter]);

  const { totalPurchaseAmount, totalSaleAmount } = useMemo(() => {
    return filteredSales.reduce((acc, sale) => {
      acc.totalPurchaseAmount += sale.originalNumberData?.purchasePrice || 0;
      acc.totalSaleAmount += sale.salePrice || 0;
      return acc;
    }, { totalPurchaseAmount: 0, totalSaleAmount: 0 });
  }, [filteredSales]);
  
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleSoldToFilterChange = (value: string) => {
    setSoldToFilter(value);
    setCurrentPage(1);
  };

  const exportToCsv = () => {
    if (filteredSales.length === 0) {
        toast({
            variant: "destructive",
            title: "No data to export",
            description: "There are no sales records matching the current filter."
        });
        return;
    }

    const formattedData = filteredSales.map(s => ({
      "Sr.No": s.srNo,
      "Mobile": s.mobile,
      "Sum": s.sum,
      "Purchase From": s.originalNumberData?.purchaseFrom || 'N/A',
      "Purchase Price": s.originalNumberData?.purchasePrice || 0,
      "Purchase Date": s.originalNumberData?.purchaseDate ? format(s.originalNumberData.purchaseDate.toDate(), 'PPP') : 'N/A',
      "Sold To": s.soldTo,
      "Sale Price": s.salePrice,
      "Sale Date": format(s.saleDate.toDate(), 'PPP'),
    }));
    
    // Add summary row
    const summary = {
        "Sr.No": "TOTAL",
        "Mobile": "",
        "Sum": "",
        "Purchase From": "",
        "Purchase Price": totalPurchaseAmount,
        "Purchase Date": "",
        "Sold To": "",
        "Sale Price": totalSaleAmount,
        "Sale Date": "",
    };
    
    const csv = Papa.unparse([...formattedData, summary]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${soldToFilter}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addActivity({
        employeeName: user?.displayName || 'User',
        action: 'Exported Sales Report',
        description: `Exported ${filteredSales.length} sales records for filter: ${soldToFilter}.`
    });

    toast({
        title: "Export Successful",
        description: `Sales report for "${soldToFilter}" has been downloaded.`,
    });
  };

  return (
    <>
      <PageHeader
        title="Manage Sales"
        description="Review, filter, and export sales records with calculated totals."
      >
        <Button onClick={exportToCsv} disabled={loading}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
        </Button>
      </PageHeader>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{filteredSales.length}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Purchase Amount</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{totalPurchaseAmount.toLocaleString()}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sale Amount</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{totalSaleAmount.toLocaleString()}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Profit / Loss</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${(totalSaleAmount - totalPurchaseAmount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{(totalSaleAmount - totalPurchaseAmount).toLocaleString()}
                    </div>
                </CardContent>
            </Card>
        </div>
      
       <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Select value={soldToFilter} onValueChange={handleSoldToFilterChange}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Filter by Sold To" />
              </SelectTrigger>
              <SelectContent>
                {soldToOptions.map(vendor => (
                  <SelectItem key={vendor} value={vendor}>
                    {vendor === 'all' ? 'All Vendors' : vendor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
             <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map(val => (
                   <SelectItem key={val} value={String(val)}>{val} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sr.No</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Sum</TableHead>
              <TableHead>Purchase From</TableHead>
              <TableHead>Purchase Price</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>Sold To</TableHead>
              <TableHead>Sale Price</TableHead>
              <TableHead>Sale Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableSpinner colSpan={9} />
            ) : paginatedSales.length > 0 ? (
                paginatedSales.map((sale) => (
                <TableRow key={sale.srNo}>
                    <TableCell>{sale.srNo}</TableCell>
                    <TableCell className="font-medium">{sale.mobile}</TableCell>
                    <TableCell>{sale.sum}</TableCell>
                    <TableCell>{sale.originalNumberData?.purchaseFrom || 'N/A'}</TableCell>
                    <TableCell>₹{sale.originalNumberData?.purchasePrice.toLocaleString() || 'N/A'}</TableCell>
                    <TableCell>{sale.originalNumberData?.purchaseDate ? format(sale.originalNumberData.purchaseDate.toDate(), 'PPP') : 'N/A'}</TableCell>
                    <TableCell>{sale.soldTo}</TableCell>
                    <TableCell>₹{sale.salePrice.toLocaleString()}</TableCell>
                    <TableCell>{format(sale.saleDate.toDate(), 'PPP')}</TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                        No sales records found for this filter.
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
        itemsPerPage={itemsPerPage}
        totalItems={filteredSales.length}
      />
    </>
  );
}
