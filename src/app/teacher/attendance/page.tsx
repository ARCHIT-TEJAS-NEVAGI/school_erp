"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Save } from 'lucide-react';
import { getUser } from '@/lib/auth';

export default function TeacherAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSection, setSelectedSection] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [sections, setSections] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    if (selectedSection) {
      fetchStudents();
    }
  }, [selectedSection]);

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/sections?limit=100');
      const data = await response.json();
      setSections(data);
      if (data.length > 0) {
        setSelectedSection(data[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/students?sectionId=${selectedSection}&limit=100`);
      const data = await response.json();
      setStudents(data);
      
      // Initialize attendance as 'present' for all students
      const initialAttendance: Record<number, string> = {};
      data.forEach((student: any) => {
        initialAttendance[student.id] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleAttendanceChange = (studentId: number, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const user = getUser();
      const promises = students.map((student: any) => {
        return fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: student.id,
            date: selectedDate,
            status: attendance[student.id] || 'present',
            markedBy: user?.id || 1,
          }),
        });
      });

      await Promise.all(promises);
      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'default';
      case 'absent': return 'destructive';
      case 'late': return 'secondary';
      case 'half_day': return 'outline';
      default: return 'outline';
    }
  };

  const stats = {
    total: students.length,
    present: Object.values(attendance).filter(s => s === 'present').length,
    absent: Object.values(attendance).filter(s => s === 'absent').length,
    late: Object.values(attendance).filter(s => s === 'late').length,
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Mark Attendance</h1>
          <Button onClick={handleSaveAttendance} disabled={saving || !selectedSection}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Attendance'}
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Select Class & Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="text-sm font-medium">Section</label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section: any) => (
                      <SelectItem key={section.id} value={section.id.toString()}>
                        {section.sectionName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Students Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedSection ? (
              <p className="text-muted-foreground text-center py-8">Please select a section</p>
            ) : students.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No students found in this section</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No.</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Attendance Status</TableHead>
                      <TableHead>Quick Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student: any) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.rollNumber}</TableCell>
                        <TableCell>{student.admissionNumber}</TableCell>
                        <TableCell>
                          <Select 
                            value={attendance[student.id] || 'present'}
                            onValueChange={(value) => handleAttendanceChange(student.id, value)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                              <SelectItem value="half_day">Half Day</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleAttendanceChange(student.id, 'present')}
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleAttendanceChange(student.id, 'absent')}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleAttendanceChange(student.id, 'late')}
                            >
                              <Clock className="h-4 w-4 text-yellow-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
