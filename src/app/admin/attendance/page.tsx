"use client";

import { useEffect, useState, Suspense } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Download, TrendingUp, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useSearchParams } from 'next/navigation';

function AttendanceContent() {
  const searchParams = useSearchParams();
  const filterStatus = searchParams.get('status');
  
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0,
    attendanceRate: 0,
  });

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate, filterStatus]);

  const fetchAttendanceData = async () => {
    try {
      let url = `/api/attendance?date=${selectedDate}&limit=100`;
      if (filterStatus) {
        url += `&status=${filterStatus}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      const present = data.filter((a: any) => a.status === 'present').length;
      const absent = data.filter((a: any) => a.status === 'absent').length;
      const late = data.filter((a: any) => a.status === 'late').length;
      const rate = data.length > 0 ? (present / data.length * 100) : 0;

      setAttendanceData(data);
      setStats({
        totalPresent: present,
        totalAbsent: absent,
        totalLate: late,
        attendanceRate: Math.round(rate),
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const weeklyData = [
    { day: 'Mon', present: 28, absent: 2 },
    { day: 'Tue', present: 27, absent: 3 },
    { day: 'Wed', present: 29, absent: 1 },
    { day: 'Thu', present: 26, absent: 4 },
    { day: 'Fri', present: 28, absent: 2 },
  ];

  const getFilterTitle = () => {
    if (filterStatus === 'present') return 'Present Students';
    if (filterStatus === 'absent') return 'Absent Students';
    if (filterStatus === 'late') return 'Late Students';
    return "Today's Attendance Records";
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Attendance Management</h1>
            {filterStatus && (
              <p className="text-muted-foreground mt-1">
                Showing {filterStatus} students for {selectedDate}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Class</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="8">Class 8</SelectItem>
                    <SelectItem value="9">Class 9</SelectItem>
                    <SelectItem value="10">Class 10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Section</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    <SelectItem value="A">Section A</SelectItem>
                    <SelectItem value="B">Section B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalPresent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.totalAbsent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.totalLate}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#10b981" name="Present" />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle>{getFilterTitle()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendanceData.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {filterStatus 
                    ? `No ${filterStatus} students for selected date`
                    : 'No attendance records for selected date'}
                </p>
              ) : (
                attendanceData.map((record: any) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">
                        {record.studentName || 'Unknown Student'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Admission No: {record.admissionNumber || 'N/A'} | 
                        Roll: {record.rollNumber || 'N/A'} | 
                        Marked at: {new Date(record.markedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        record.status === 'present' ? 'default' : 
                        record.status === 'absent' ? 'destructive' : 
                        'secondary'
                      }
                    >
                      {record.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function AdminAttendancePage() {
  return (
    <Suspense fallback={
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    }>
      <AttendanceContent />
    </Suspense>
  );
}