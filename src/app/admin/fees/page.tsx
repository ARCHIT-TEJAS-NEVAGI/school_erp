"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Download, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function AdminFeesPage() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    totalCollected: 0,
    totalPending: 0,
    totalOverdue: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFeesData();
  }, []);

  const fetchFeesData = async () => {
    try {
      const response = await fetch('/api/fee-invoices?limit=100');
      const data = await response.json();
      
      const collected = data
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + inv.paidAmount, 0);
      
      const pending = data
        .filter((inv: any) => inv.status === 'pending' || inv.status === 'partial')
        .reduce((sum: number, inv: any) => sum + inv.dueAmount, 0);
      
      const overdue = data
        .filter((inv: any) => inv.status === 'overdue')
        .reduce((sum: number, inv: any) => sum + inv.dueAmount, 0);

      setInvoices(data);
      setStats({
        totalCollected: collected,
        totalPending: pending,
        totalOverdue: overdue,
      });
    } catch (error) {
      console.error('Error fetching fees data:', error);
    }
  };

  const feeData = [
    { name: 'Collected', value: stats.totalCollected, color: '#10b981' },
    { name: 'Pending', value: stats.totalPending, color: '#f59e0b' },
    { name: 'Overdue', value: stats.totalOverdue, color: '#ef4444' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'partial': return 'secondary';
      case 'pending': return 'outline';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  const filteredInvoices = invoices.filter((inv: any) =>
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Fee Management</h1>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate Invoice
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{stats.totalCollected.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This academic year</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">₹{stats.totalPending.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Yet to be collected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₹{stats.totalOverdue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Past due date</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Fee Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Collection Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={feeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `₹${entry.value.toLocaleString()}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {feeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Total Invoices</p>
                    <p className="text-sm text-muted-foreground">Generated this year</p>
                  </div>
                  <p className="text-2xl font-bold">{invoices.length}</p>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Paid Invoices</p>
                    <p className="text-sm text-muted-foreground">Fully settled</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {invoices.filter((inv: any) => inv.status === 'paid').length}
                  </p>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Overdue Invoices</p>
                    <p className="text-sm text-muted-foreground">Needs attention</p>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {invoices.filter((inv: any) => inv.status === 'overdue').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fee Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid Amount</TableHead>
                    <TableHead>Due Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.slice(0, 10).map((invoice: any) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.studentId}</TableCell>
                        <TableCell>₹{invoice.totalAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-green-600">₹{invoice.paidAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-red-600">₹{invoice.dueAmount.toLocaleString()}</TableCell>
                        <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
