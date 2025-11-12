"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserCheck, 
  UserX, 
  UserMinus, 
  DollarSign, 
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  GraduationCap,
  Briefcase
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface DashboardStats {
  students: {
    total: number;
    presentToday: number;
    absentToday: number;
    unmarkedToday: number;
    irregular: number;
    regular: number;
  };
  fees: {
    fullyPaid: number;
    unpaid: number;
    partial: number;
  };
  staff: {
    total: number;
    presentToday: number;
    absentToday: number;
    unmarkedToday: number;
  };
  revenue: {
    today: number;
    monthly: number;
  };
  todayFeeReceipts: Array<{
    studentName: string;
    admissionNumber: string;
    amount: number;
    paymentDate: string;
  }>;
  academicYear: {
    id: number;
    yearName: string;
    startDate: string;
    endDate: string;
  } | null;
}

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [yearlyRevenue, setYearlyRevenue] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchYearlyRevenue();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard-stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchYearlyRevenue = async () => {
    try {
      const res = await fetch('/api/dashboard-stats/yearly-revenue');
      const data = await res.json();
      setYearlyRevenue(data.yearlyRevenue || 0);
    } catch (error) {
      console.error('Failed to fetch yearly revenue:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return <div>Failed to load dashboard stats</div>;
  }

  const studentAttendanceData = [
    { name: 'Present', value: stats.students.presentToday, color: '#10B981' },
    { name: 'Absent', value: stats.students.absentToday, color: '#EF4444' },
    { name: 'Unmarked', value: stats.students.unmarkedToday, color: '#F59E0B' },
  ];

  const feeStatusData = [
    { name: 'Fully Paid', value: stats.fees.fullyPaid, color: '#10B981' },
    { name: 'Unpaid', value: stats.fees.unpaid, color: '#EF4444' },
    { name: 'Partial', value: stats.fees.partial, color: '#F59E0B' },
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-primary">Organization Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            {stats.academicYear?.yearName || 'Academic Year'} • {new Date().toLocaleDateString('en-IN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-4 py-2 text-lg">
            <Calendar className="w-4 h-4 mr-2" />
            Today
          </Badge>
        </div>
      </div>

      {/* Students Overview */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-purple-600" />
          Students Overview
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="gradient-card-1 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Students</CardTitle>
              <Users className="h-5 w-5 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.students.total}</div>
              <p className="text-xs text-white/80 mt-1">Enrolled in system</p>
            </CardContent>
          </Card>

          <Card className="bg-green-500 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Present Today</CardTitle>
              <UserCheck className="h-5 w-5 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.students.presentToday}</div>
              <p className="text-xs text-white/80 mt-1">
                {stats.students.total > 0 
                  ? `${((stats.students.presentToday / stats.students.total) * 100).toFixed(1)}% attendance`
                  : '0% attendance'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-red-500 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Absent Today</CardTitle>
              <UserX className="h-5 w-5 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.students.absentToday}</div>
              <p className="text-xs text-white/80 mt-1">Requires attention</p>
            </CardContent>
          </Card>

          <Card className="bg-orange-500 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Unmarked Today</CardTitle>
              <UserMinus className="h-5 w-5 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.students.unmarkedToday}</div>
              <p className="text-xs text-white/80 mt-1">Pending attendance</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attendance & Regularity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Student Regularity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Regular Students</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{stats.students.regular}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium">Irregular Students</span>
                </div>
                <span className="text-2xl font-bold text-red-600">{stats.students.irregular}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Today's Attendance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={studentAttendanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {studentAttendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Fee Status */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          Fee Collection Status
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-green-50 border-green-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-green-700 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Fully Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{stats.fees.fullyPaid}</div>
              <p className="text-sm text-green-600 mt-1">Students</p>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Unpaid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600">{stats.fees.unpaid}</div>
              <p className="text-sm text-red-600 mt-1">Students</p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-orange-700 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Partial Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-600">{stats.fees.partial}</div>
              <p className="text-sm text-orange-600 mt-1">Students</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Staff & Revenue */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Staff Attendance Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Staff</span>
                <span className="text-2xl font-bold">{stats.staff.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-600">Present</span>
                <span className="text-2xl font-bold text-green-600">{stats.staff.presentToday}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-red-600">Absent</span>
                <span className="text-2xl font-bold text-red-600">{stats.staff.absentToday}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-orange-600">Unmarked</span>
                <span className="text-2xl font-bold text-orange-600">{stats.staff.unmarkedToday}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card-3 text-white border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Revenue Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/80">Today's Revenue</p>
                <p className="text-3xl font-bold text-white">₹{stats.revenue.today.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-white/80">Monthly Revenue</p>
                <p className="text-3xl font-bold text-white">₹{stats.revenue.monthly.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-white/80">Yearly Revenue ({new Date().getFullYear()})</p>
                <p className="text-3xl font-bold text-white">₹{yearlyRevenue.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Fee Receipts */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Today's Fee Receipts
          </CardTitle>
          <CardDescription>Students who paid fees today</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.todayFeeReceipts.length > 0 ? (
            <div className="space-y-2">
              {stats.todayFeeReceipts.map((receipt, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="font-semibold text-green-900">{receipt.studentName}</p>
                    <p className="text-sm text-green-600">{receipt.admissionNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">₹{receipt.amount.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-green-600">{new Date(receipt.paymentDate).toLocaleTimeString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No fee payments received today</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}