"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function RemarksPage() {
  const [remarks, setRemarks] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remarkData, setRemarkData] = useState({
    teacherId: '',
    studentId: '',
    remarkText: '',
    remarkType: 'neutral',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchRemarks();
    fetchTeachers();
    fetchStudents();
  }, []);

  const fetchRemarks = async () => {
    try {
      const res = await fetch('/api/teacher-remarks?limit=100');
      const data = await res.json();
      setRemarks(data);
      
      // Update student colors based on remarks
      await updateStudentColors(data);
    } catch (error) {
      console.error('Error fetching remarks:', error);
    }
  };

  const updateStudentColors = async (remarksData: any[]) => {
    // Group remarks by student
    const studentRemarks: any = {};
    remarksData.forEach((remark: any) => {
      if (!studentRemarks[remark.studentId]) {
        studentRemarks[remark.studentId] = [];
      }
      studentRemarks[remark.studentId].push(remark);
    });

    // Update each student's color
    for (const [studentId, studentRemarksList] of Object.entries(studentRemarks)) {
      const negativeCount = (studentRemarksList as any[]).filter(r => r.remarkType === 'negative').length;
      const positiveCount = (studentRemarksList as any[]).filter(r => r.remarkType === 'positive').length;
      
      let color = 'green';
      if (negativeCount >= 3) {
        color = 'red';
      } else if (negativeCount > 0) {
        color = 'yellow';
      }

      // Update student color
      try {
        await fetch(`/api/students?id=${studentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ remarksColor: color }),
        });
      } catch (error) {
        console.error('Error updating student color:', error);
      }
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers?limit=100');
      const data = await res.json();
      setTeachers(data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students?limit=100');
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/teacher-remarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: parseInt(remarkData.teacherId),
          studentId: parseInt(remarkData.studentId),
          remarkText: remarkData.remarkText,
          remarkType: remarkData.remarkType,
          date: remarkData.date,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add remark');
      }

      toast.success('Remark added successfully');
      setShowAddDialog(false);
      resetForm();
      fetchRemarks();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add remark');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRemark = async (id: number) => {
    if (!confirm('Are you sure you want to delete this remark?')) return;

    try {
      const res = await fetch(`/api/teacher-remarks?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete remark');

      toast.success('Remark deleted successfully');
      fetchRemarks();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete remark');
    }
  };

  const resetForm = () => {
    setRemarkData({
      teacherId: '',
      studentId: '',
      remarkText: '',
      remarkType: 'neutral',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const getRemarkTypeBadge = (type: string) => {
    switch (type) {
      case 'positive':
        return <Badge className="bg-green-500">Positive</Badge>;
      case 'negative':
        return <Badge variant="destructive">Negative</Badge>;
      default:
        return <Badge variant="secondary">Neutral</Badge>;
    }
  };

  const getStudentColorIndicator = (studentId: number) => {
    const student = students.find((s: any) => s.id === studentId);
    if (!student) return null;

    const colorClasses: any = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
    };

    return (
      <div className={`w-3 h-3 rounded-full ${colorClasses[student.remarksColor || 'green']}`} />
    );
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Teacher Remarks</h1>
            <p className="text-muted-foreground">Manage teacher feedback and remarks for students</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Remark
          </Button>
        </div>

        {/* Color Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Student Color Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span className="text-sm">Good Performance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500" />
                <span className="text-sm">Needs Attention</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span className="text-sm">Critical (Irregular/Multiple Negative Remarks)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Remarks List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              All Remarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {remarks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No remarks found</p>
              ) : (
                remarks.map((remark: any) => (
                  <div key={remark.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex items-start gap-4 flex-1">
                      {getStudentColorIndicator(remark.studentId)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getRemarkTypeBadge(remark.remarkType)}
                          <span className="text-sm text-muted-foreground">
                            Student ID: {remark.studentId} | Teacher ID: {remark.teacherId}
                          </span>
                        </div>
                        <p className="text-sm">{remark.remarkText}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Date: {new Date(remark.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRemark(remark.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Remark Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Teacher Remark</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddRemark} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teacherId">Teacher *</Label>
                <Select
                  value={remarkData.teacherId}
                  onValueChange={(value) => setRemarkData({ ...remarkData, teacherId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher: any) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.employeeId} - {teacher.specialization || 'N/A'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId">Student *</Label>
                <Select
                  value={remarkData.studentId}
                  onValueChange={(value) => setRemarkData({ ...remarkData, studentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student: any) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.admissionNumber} - {student.rollNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarkType">Remark Type *</Label>
                <Select
                  value={remarkData.remarkType}
                  onValueChange={(value) => setRemarkData({ ...remarkData, remarkType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={remarkData.date}
                  onChange={(e) => setRemarkData({ ...remarkData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarkText">Remark *</Label>
                <Textarea
                  id="remarkText"
                  required
                  rows={4}
                  value={remarkData.remarkText}
                  onChange={(e) => setRemarkData({ ...remarkData, remarkText: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Remark'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
