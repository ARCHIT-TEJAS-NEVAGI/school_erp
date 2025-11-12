"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Save } from 'lucide-react';

export default function TeacherMarksPage() {
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    examType: '',
    marksObtained: '',
    totalMarks: '',
    examDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  useEffect(() => {
    fetchSections();
    fetchSubjects();
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
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects?limit=100');
      const data = await response.json();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/students?sectionId=${selectedSection}&limit=100`);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: parseInt(formData.studentId),
          subjectId: parseInt(selectedSubject),
          examType: formData.examType,
          marksObtained: parseFloat(formData.marksObtained),
          totalMarks: parseFloat(formData.totalMarks),
          examDate: formData.examDate,
          remarks: formData.remarks,
        }),
      });

      if (!response.ok) throw new Error('Failed to add marks');

      setDialogOpen(false);
      alert('Marks added successfully!');
      resetForm();
    } catch (error) {
      console.error('Error adding marks:', error);
      alert('Failed to add marks');
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      examType: '',
      marksObtained: '',
      totalMarks: '',
      examDate: new Date().toISOString().split('T')[0],
      remarks: '',
    });
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Marks Entry</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!selectedSection || !selectedSubject}>
                <Plus className="mr-2 h-4 w-4" />
                Add Marks
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enter Student Marks</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Student*</Label>
                  <Select 
                    value={formData.studentId} 
                    onValueChange={(value) => setFormData({ ...formData, studentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student: any) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.firstName} {student.lastName} (Roll: {student.rollNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Exam Type*</Label>
                  <Select 
                    value={formData.examType} 
                    onValueChange={(value) => setFormData({ ...formData, examType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unit Test 1">Unit Test 1</SelectItem>
                      <SelectItem value="Unit Test 2">Unit Test 2</SelectItem>
                      <SelectItem value="Midterm">Midterm</SelectItem>
                      <SelectItem value="Final">Final</SelectItem>
                      <SelectItem value="Practical">Practical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Marks Obtained*</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.marksObtained}
                      onChange={(e) => setFormData({ ...formData, marksObtained: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Marks*</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.totalMarks}
                      onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Exam Date*</Label>
                  <Input
                    type="date"
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Input
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Optional remarks"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Save Marks
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Select Class & Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Section</Label>
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
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject: any) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.subjectName} ({subject.subjectCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Students List</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedSection ? (
              <p className="text-muted-foreground text-center py-8">Please select a section</p>
            ) : students.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No students found</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Roll No.</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Blood Group</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student: any) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>{student.rollNumber}</TableCell>
                        <TableCell>{student.admissionNumber}</TableCell>
                        <TableCell>{student.gender}</TableCell>
                        <TableCell>{student.bloodGroup}</TableCell>
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