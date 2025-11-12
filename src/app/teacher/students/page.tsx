"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Search, Mail, Phone, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: number;
  userId: number;
  admissionNumber: string;
  rollNumber: string;
  fullName: string;
  email: string;
  phone: string;
  sectionName: string;
  className: string;
  dateOfBirth: string;
  studentLevel?: string;
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingLevels, setUpdatingLevels] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/students?limit=100');
      const data = await response.json();
      
      // Ensure we always set an array
      if (Array.isArray(data)) {
        setStudents(data);
      } else if (data.students && Array.isArray(data.students)) {
        setStudents(data.students);
      } else if (data.data && Array.isArray(data.data)) {
        setStudents(data.data);
      } else {
        console.warn('Unexpected API response format:', data);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStudentLevel = async (studentId: number, newLevel: string) => {
    setUpdatingLevels(prev => new Set(prev).add(studentId));
    
    try {
      const response = await fetch(`/api/students/${studentId}/level`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentLevel: newLevel }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update student level');
      }

      // Update local state
      setStudents(prev => prev.map(student => 
        student.id === studentId 
          ? { ...student, studentLevel: newLevel }
          : student
      ));

      toast.success(`Student level updated to ${newLevel}`);
    } catch (error) {
      console.error('Error updating student level:', error);
      toast.error('Failed to update student level');
    } finally {
      setUpdatingLevels(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }
  };

  // Safe filtering with array check
  const filteredStudents = Array.isArray(students) ? students.filter(student =>
    student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Group students by section
  const studentsBySection = filteredStudents.reduce((acc, student) => {
    const section = student.sectionName || 'Unassigned';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(student);
    return acc;
  }, {} as Record<string, Student[]>);

  const getLevelBadgeColor = (level?: string) => {
    switch (level) {
      case 'L1':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'L2':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'L3':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Students</h1>
            <p className="text-muted-foreground">View and manage your students by section</p>
          </div>
          <Card className="w-72">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{students.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, admission number, or roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Level Legend */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <span className="font-semibold">Student Levels:</span>
              <div className="flex items-center gap-2">
                <Badge className={getLevelBadgeColor('L1')}>L1 - Beginner</Badge>
                <Badge className={getLevelBadgeColor('L2')}>L2 - Intermediate</Badge>
                <Badge className={getLevelBadgeColor('L3')}>L3 - Advanced</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List Grouped by Section */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading students...</p>
          </div>
        ) : Object.keys(studentsBySection).length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No students found</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(studentsBySection).map(([section, sectionStudents]) => (
            <Card key={section}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Section: {section}
                  <Badge variant="secondary" className="ml-2">
                    {sectionStudents.length} Students
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {sectionStudents.map((student) => (
                    <div
                      key={student.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="bg-primary/10 p-3 rounded-full">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{student.fullName}</h3>
                              <Badge variant="secondary">
                                Roll: {student.rollNumber || 'N/A'}
                              </Badge>
                              <Badge className={getLevelBadgeColor(student.studentLevel)}>
                                {student.studentLevel || 'L1'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Admission: {student.admissionNumber}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                {student.email}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                {student.phone || 'N/A'}
                              </div>
                              <div className="text-muted-foreground">
                                Class: {student.className || 'N/A'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Categorize as:</span>
                              <div className="flex gap-2">
                                {['L1', 'L2', 'L3'].map((level) => (
                                  <Button
                                    key={level}
                                    size="sm"
                                    variant={student.studentLevel === level ? 'default' : 'outline'}
                                    onClick={() => updateStudentLevel(student.id, level)}
                                    disabled={updatingLevels.has(student.id)}
                                    className="min-w-[60px]"
                                  >
                                    {updatingLevels.has(student.id) && student.studentLevel !== level ? '...' : level}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}