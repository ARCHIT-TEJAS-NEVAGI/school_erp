"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, Clock, IndianRupee, TrendingUp, AlertTriangle, Calendar, MessageSquare, UserPlus, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds to show new payments
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch comprehensive dashboard stats
      const statsRes = await fetch('/api/dashboard-stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch pending leave requests
      const leaveRes = await fetch('/api/teacher-leave-requests?status=pending&limit=5');
      const leaveData = await leaveRes.json();
      setLeaveRequests(leaveData);

      // Fetch recent fee payment notifications
      const notifRes = await fetch('/api/notifications?type=fee&limit=10');
      const notifData = await notifRes.json();
      setNotifications(Array.isArray(notifData) ? notifData : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading || !stats) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const feeChartData = [
    { name: 'Paid', value: stats.fees?.fullyPaid || 0, color: '#22c55e' },
    { name: 'Partial', value: stats.fees?.partial || 0, color: '#f59e0b' },
    { name: 'Pending', value: stats.fees?.unpaid || 0, color: '#ef4444' },
  ];

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header with Register Student Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Organization Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              {stats.academicYear?.yearName || 'Academic Year'} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Button 
            onClick={() => router.push('/admin/register-student')}
            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-lg h-12 px-6 animate-bounce-soft"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Register New Student
          </Button>
        </div>

        {/* Student Stats */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-primary">📚 Student Statistics</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:scale-105"
              onClick={() => router.push('/admin/students')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-purple-50 to-blue-50">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent className="bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="text-3xl font-bold text-purple-600">{stats.students?.total || 0}</div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:scale-105"
              onClick={() => router.push('/admin/attendance?filter=present')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-50">
                <CardTitle className="text-sm font-medium">Present Today</CardTitle>
                <UserCheck className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent className="bg-green-50">
                <div className="text-3xl font-bold text-green-600">{stats.students?.presentToday || 0}</div>
                <p className="text-xs text-green-600 font-medium">
                  {stats.students?.total > 0 ? Math.round(((stats.students?.presentToday || 0) / stats.students.total) * 100) : 0}% attendance
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:scale-105"
              onClick={() => router.push('/admin/attendance?filter=absent')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-red-50">
                <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
                <UserX className="h-5 w-5 text-red-600" />
              </CardHeader>
              <CardContent className="bg-red-50">
                <div className="text-3xl font-bold text-red-600">{stats.students?.absentToday || 0}</div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:scale-105"
              onClick={() => router.push('/admin/attendance?filter=unmarked')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-orange-50">
                <CardTitle className="text-sm font-medium">Unmarked Today</CardTitle>
                <Clock className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent className="bg-orange-50">
                <div className="text-3xl font-bold text-orange-600">{stats.students?.unmarkedToday || 0}</div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:scale-105"
              onClick={() => router.push('/admin/students?filter=irregular')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-yellow-50">
                <CardTitle className="text-sm font-medium">Irregular Students</CardTitle>
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </CardHeader>
              <CardContent className="bg-yellow-50">
                <div className="text-3xl font-bold text-yellow-600">{stats.students?.irregular || 0}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Fee Statistics */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-primary">💰 Fee Statistics</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:scale-105 bg-gradient-to-br from-green-500 to-teal-500 text-white"
              onClick={() => router.push('/admin/fees?filter=paid')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Fully Paid</CardTitle>
                <IndianRupee className="h-5 w-5 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.fees?.fullyPaid || 0}</div>
                <p className="text-xs text-white/90">students</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:scale-105 bg-gradient-to-br from-orange-500 to-amber-500 text-white"
              onClick={() => router.push('/admin/fees?filter=partial')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Partial Payment</CardTitle>
                <IndianRupee className="h-5 w-5 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.fees?.partial || 0}</div>
                <p className="text-xs text-white/90">students</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:scale-105 bg-gradient-to-br from-red-500 to-pink-500 text-white"
              onClick={() => router.push('/admin/fees?filter=pending')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Not Paid</CardTitle>
                <IndianRupee className="h-5 w-5 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.fees?.unpaid || 0}</div>
                <p className="text-xs text-white/90">students</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:scale-105 bg-gradient-to-br from-blue-500 to-purple-500 text-white"
              onClick={() => router.push('/admin/revenue')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Today's Revenue</CardTitle>
                <TrendingUp className="h-5 w-5 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{(stats.revenue?.today || 0).toLocaleString()}</div>
                <p className="text-xs text-white/90">
                  Monthly: ₹{(stats.revenue?.monthly || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Staff Statistics */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-primary">👨‍🏫 Staff Statistics</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:scale-105"
              onClick={() => router.push('/admin/staff-attendance')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-50">
                <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                <Users className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent className="bg-blue-50">
                <div className="text-3xl font-bold text-blue-600">{stats.staff?.total || 0}</div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:scale-105"
              onClick={() => router.push('/admin/staff-attendance?filter=present')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-50">
                <CardTitle className="text-sm font-medium">Present Today</CardTitle>
                <UserCheck className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent className="bg-green-50">
                <div className="text-3xl font-bold text-green-600">{stats.staff?.presentToday || 0}</div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:scale-105"
              onClick={() => router.push('/admin/staff-attendance?filter=absent')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-red-50">
                <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
                <UserX className="h-5 w-5 text-red-600" />
              </CardHeader>
              <CardContent className="bg-red-50">
                <div className="text-3xl font-bold text-red-600">{stats.staff?.absentToday || 0}</div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:scale-105"
              onClick={() => router.push('/admin/staff-attendance?filter=unmarked')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-orange-50">
                <CardTitle className="text-sm font-medium">Unmarked Today</CardTitle>
                <Clock className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent className="bg-orange-50">
                <div className="text-3xl font-bold text-orange-600">{stats.staff?.unmarkedToday || 0}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts and Notifications */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card 
            className="cursor-pointer hover:shadow-2xl transition-all duration-300 border-2"
            onClick={() => router.push('/admin/fees')}
          >
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
              <CardTitle className="text-xl">💵 Fee Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={feeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {feeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Fee Payment Notifications */}
          <Card className="hover:shadow-2xl transition-all duration-300 border-2">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="flex items-center justify-between text-xl">
                <span className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  💸 Fee Payment Notifications
                </span>
                {unreadNotifications > 0 && (
                  <Badge className="animate-pulse-gentle bg-red-500">{unreadNotifications} New</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {notifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">✅ No payment notifications</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {notifications.map((notification: any) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border-2 rounded-lg transition-all ${
                        notification.isRead 
                          ? 'bg-gray-50 hover:shadow-sm' 
                          : 'bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-md border-green-200'
                      }`}
                      onClick={() => !notification.isRead && markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-lg flex items-center gap-2">
                            {notification.isRead ? '📧' : '🆕'} {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2 font-medium">
                            🕒 {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <Badge variant="secondary" className="ml-2 bg-green-500 text-white">New</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests */}
        <Card className="hover:shadow-2xl transition-all duration-300 border-2">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center justify-between text-xl">
              <span>🏖️ Pending Leave Requests</span>
              {leaveRequests.length > 0 && (
                <Badge variant="destructive" className="animate-pulse-gentle">{leaveRequests.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {leaveRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">✅ No pending leave requests</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {leaveRequests.map((request: any) => (
                  <div key={request.id} className="p-4 border-2 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 hover:shadow-md transition-shadow">
                    <p className="font-semibold text-lg">Teacher ID: {request.teacherId}</p>
                    <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                    <p className="text-xs text-muted-foreground mt-2 font-medium">
                      📅 {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="border-2 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 via-blue-50 to-teal-50">
            <CardTitle className="text-2xl">⚡ Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/admin/register-student" className="p-6 border-2 rounded-xl hover:bg-gradient-to-br hover:from-green-50 hover:to-teal-50 transition-all hover:shadow-lg hover:scale-105">
                <UserPlus className="h-8 w-8 mb-3 text-green-600" />
                <p className="font-semibold text-lg">Register Student</p>
              </Link>
              <Link href="/admin/students" className="p-6 border-2 rounded-xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50 transition-all hover:shadow-lg hover:scale-105">
                <Users className="h-8 w-8 mb-3 text-purple-600" />
                <p className="font-semibold text-lg">Manage Students</p>
              </Link>
              <Link href="/admin/staff-attendance" className="p-6 border-2 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all hover:shadow-lg hover:scale-105">
                <UserCheck className="h-8 w-8 mb-3 text-blue-600" />
                <p className="font-semibold text-lg">Staff Attendance</p>
              </Link>
              <Link href="/admin/revenue" className="p-6 border-2 rounded-xl hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 transition-all hover:shadow-lg hover:scale-105">
                <TrendingUp className="h-8 w-8 mb-3 text-green-600" />
                <p className="font-semibold text-lg">Revenue</p>
              </Link>
              <Link href="/admin/messaging" className="p-6 border-2 rounded-xl hover:bg-gradient-to-br hover:from-yellow-50 hover:to-orange-50 transition-all hover:shadow-lg hover:scale-105">
                <MessageSquare className="h-8 w-8 mb-3 text-yellow-600" />
                <p className="font-semibold text-lg">Send Messages</p>
              </Link>
              <Link href="/admin/calendar" className="p-6 border-2 rounded-xl hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-50 transition-all hover:shadow-lg hover:scale-105">
                <Calendar className="h-8 w-8 mb-3 text-pink-600" />
                <p className="font-semibold text-lg">Calendar</p>
              </Link>
              <Link href="/admin/remarks" className="p-6 border-2 rounded-xl hover:bg-gradient-to-br hover:from-indigo-50 hover:to-violet-50 transition-all hover:shadow-lg hover:scale-105">
                <MessageSquare className="h-8 w-8 mb-3 text-indigo-600" />
                <p className="font-semibold text-lg">Remarks</p>
              </Link>
              <Link href="/admin/timetable" className="p-6 border-2 rounded-xl hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50 transition-all hover:shadow-lg hover:scale-105">
                <Calendar className="h-8 w-8 mb-3 text-teal-600" />
                <p className="font-semibold text-lg">Timetable</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}