"use client";

import { useEffect, useState, Suspense } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

function StaffAttendanceContent() {
  const searchParams = useSearchParams();
  const filterStatus = searchParams.get('status');
  
  const [teachers, setTeachers] = useState([]);
  const [attendance, setAttendance] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTeachers();
    fetchAttendance();
  }, [selectedDate, filterStatus]);

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers?limit=100');
      const data = await res.json();
      setTeachers(data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`/api/staff-attendance?date=${selectedDate}&limit=100`);
      const data = await res.json();
      
      const attendanceMap: any = {};
      data.forEach((record: any) => {
        attendanceMap[record.teacherId] = record;
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const markAttendance = async (teacherId: number, status: string) => {
    setLoading(true);
    try {
      const existingRecord = attendance[teacherId];
      
      if (existingRecord) {
        // Update existing record
        const res = await fetch(`/api/staff-attendance?id=${existingRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, markedBy: 1 }),
        });
        
        if (!res.ok) throw new Error('Failed to update attendance');
      } else {
        // Create new record
        const res = await fetch('/api/staff-attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacherId,
            date: selectedDate,
            status,
            markedBy: 1,
          }),
        });
        
        if (!res.ok) throw new Error('Failed to mark attendance');
      }
      
      toast.success('Attendance marked successfully');
      fetchAttendance();
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500">Present</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      default:
        return <Badge variant="secondary">Unmarked</Badge>;
    }
  };

  const stats = {
    total: teachers.length,
    present: Object.values(attendance).filter((a: any) => a.status === 'present').length,
    absent: Object.values(attendance).filter((a: any) => a.status === 'absent').length,
    unmarked: teachers.length - Object.values(attendance).length,
  };

  const getFilteredTeachers = () => {
    if (!filterStatus) return teachers;
    
    return teachers.filter((teacher: any) => {
      const status = attendance[teacher.id]?.status || 'unmarked';
      return status === filterStatus;
    });
  };

  const filteredTeachers = getFilteredTeachers();

  const getPageTitle = () => {
    if (filterStatus === 'present') return 'Present Teachers';
    if (filterStatus === 'absent') return 'Absent Teachers';
    return 'Staff Attendance';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
          <p className="text-muted-foreground">
            {filterStatus 
              ? `Showing ${filterStatus} teachers for ${selectedDate}`
              : 'Mark and manage teacher attendance'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.present}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.absent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unmarked</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.unmarked}</div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Attendance ({filteredTeachers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTeachers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {filterStatus 
                  ? `No ${filterStatus} teachers for selected date`
                  : 'No teachers found'}
              </p>
            ) : (
              filteredTeachers.map((teacher: any) => (
                <div key={teacher.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">
                        {teacher.fullName || 'Unknown Teacher'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Employee ID: {teacher.employeeId} | {teacher.specialization || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(attendance[teacher.id]?.status || 'unmarked')}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-green-50 hover:bg-green-100 text-green-700"
                        onClick={() => markAttendance(teacher.id, 'present')}
                        disabled={loading}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-red-50 hover:bg-red-100 text-red-700"
                        onClick={() => markAttendance(teacher.id, 'absent')}
                        disabled={loading}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Absent
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function StaffAttendancePage() {
  return (
    <DashboardLayout role="admin">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading attendance...</p>
          </div>
        </div>
      }>
        <StaffAttendanceContent />
      </Suspense>
    </DashboardLayout>
  );
}