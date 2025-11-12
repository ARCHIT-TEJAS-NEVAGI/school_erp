"use client";

import { useEffect, useState, Suspense } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, Plus, Eye, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AddStudentDialog } from './add-student-dialog';
import Link from 'next/link';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

function StudentsContent() {
  const searchParams = useSearchParams();
  const filterIrregular = searchParams.get('irregular');
  
  const [students, setStudents] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchSections();
  }, [filterIrregular]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      let url = '/api/students?limit=100';
      if (filterIrregular === 'true') {
        url += '&isIrregular=true';
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setStudents(data);
      } else if (data && Array.isArray(data.students)) {
        setStudents(data.students);
      } else {
        console.error('Invalid data format:', data);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const res = await fetch('/api/sections?limit=100');
      const data = await res.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setSections(data);
      } else if (data && Array.isArray(data.sections)) {
        setSections(data.sections);
      } else {
        setSections([]);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      const res = await fetch(`/api/students?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete student');

      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete student');
    }
  };

  // Safely filter students - ensure students is always an array
  const filteredStudents = Array.isArray(students) ? students.filter((student: any) =>
    student.admissionNumber?.toLowerCase().includes(search.toLowerCase()) ||
    student.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
    student.username?.toLowerCase().includes(search.toLowerCase()) ||
    student.fullName?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const getColorIndicator = (color: string) => {
    const colorClasses: any = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
    };
    return <div className={`w-3 h-3 rounded-full ${colorClasses[color || 'green']}`} />;
  };

  const getPageTitle = () => {
    if (filterIrregular === 'true') return 'Irregular Students';
    return 'Students Management';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
          <p className="text-muted-foreground">
            {filterIrregular === 'true' 
              ? 'Students with low attendance records'
              : 'Manage student records and information'}
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, admission number, roll number, or username..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {filterIrregular === 'true' ? 'Irregular Students' : 'All Students'} ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading students...</p>
          ) : (
            <div className="space-y-3">
              {filteredStudents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {filterIrregular === 'true' ? 'No irregular students found' : 'No students found'}
                </p>
              ) : (
                filteredStudents.map((student: any) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      {getColorIndicator(student.remarksColor)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-lg">
                            {student.fullName || 'Unknown Student'}
                          </p>
                          {student.isIrregular && (
                            <Badge variant="destructive">Irregular</Badge>
                          )}
                          {student.feesConcession > 0 && (
                            <Badge variant="secondary">{student.feesConcession}% Concession</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Admission: {student.admissionNumber} | Roll: {student.rollNumber || 'N/A'} | Username: {student.username || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/students/profile/${student.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(student.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Student Dialog */}
      <AddStudentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchStudents}
        sections={sections}
      />
    </div>
  );
}

export default function StudentsPage() {
  return (
    <DashboardLayout role="admin">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <StudentsContent />
      </Suspense>
    </DashboardLayout>
  );
}