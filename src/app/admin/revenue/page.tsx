"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, TrendingUp, Calendar, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function RevenuePage() {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    todayReceipts: [],
    monthlyReceipts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      
      // Fetch payments for today
      const todayPaymentsRes = await fetch(`/api/fee-payments?startDate=${today}&endDate=${today}&limit=100`);
      const todayPayments = await todayPaymentsRes.json();
      
      // Fetch payments for this month
      const monthPaymentsRes = await fetch(`/api/fee-payments?startDate=${firstDayOfMonth}&limit=1000`);
      const monthPayments = await monthPaymentsRes.json();
      
      // Fetch payments for this year
      const yearPaymentsRes = await fetch(`/api/fee-payments?startDate=${firstDayOfYear}&limit=10000`);
      const yearPayments = await yearPaymentsRes.json();
      
      // Calculate today's revenue
      const todayRevenue = todayPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
      
      // Calculate monthly revenue
      const monthlyRevenue = monthPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
      
      // Calculate yearly revenue
      const yearlyRevenue = yearPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
      
      // Fetch student names for receipts
      const todayReceiptsWithNames = await Promise.all(
        todayPayments.map(async (payment: any) => {
          const invoiceRes = await fetch(`/api/fee-invoices?id=${payment.invoiceId}`);
          const invoice = await invoiceRes.json();
          
          const studentRes = await fetch(`/api/students?id=${invoice.studentId}`);
          const student = await studentRes.json();
          
          const userRes = await fetch(`/api/users?id=${student.userId}`);
          const user = await userRes.json();
          
          return {
            ...payment,
            studentName: user.fullName,
            invoiceNumber: invoice.invoiceNumber,
          };
        })
      );
      
      setStats({
        todayRevenue,
        monthlyRevenue,
        yearlyRevenue,
        todayReceipts: todayReceiptsWithNames,
        monthlyReceipts: monthPayments,
      });
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Revenue Tracking</h1>
          <p className="text-muted-foreground">Monitor fee collections and revenue</p>
        </div>

        {/* Revenue Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.todayRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.todayReceipts.length} payment(s) received today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total revenue this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yearly Revenue ({new Date().getFullYear()})</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.yearlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total revenue this year
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Receipts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Receipts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : stats.todayReceipts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No payments received today</p>
            ) : (
              <div className="space-y-4">
                {stats.todayReceipts.map((receipt: any) => (
                  <div key={receipt.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{receipt.studentName}</p>
                        <p className="text-sm text-muted-foreground">Invoice: {receipt.invoiceNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">₹{receipt.amount.toLocaleString()}</p>
                      <Badge variant={receipt.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                        {receipt.paymentMethod}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <span className="font-medium">Total Payments This Month</span>
                <span className="text-2xl font-bold">{stats.monthlyReceipts.length}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <span className="font-medium">Total Amount Collected</span>
                <span className="text-2xl font-bold">₹{stats.monthlyRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <span className="font-medium">Average Payment Amount</span>
                <span className="text-2xl font-bold">
                  ₹{stats.monthlyReceipts.length > 0 ? Math.round(stats.monthlyRevenue / stats.monthlyReceipts.length).toLocaleString() : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}