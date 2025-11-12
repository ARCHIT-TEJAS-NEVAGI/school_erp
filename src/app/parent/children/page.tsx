"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Calendar, BookOpen, DollarSign, Mail, Phone } from 'lucide-react';

interface Child {
  id: number;
  fullName: string;
  admissionNumber: string;
  rollNumber: string;
  email: string;
  phone: string;
  className: string;
  sectionName: string;
  dateOfBirth: string;
  bloodGroup: string;
  attendanceRate: number;
  averageMarks: number;
  pendingFees: number;
}

export default function ParentChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      // Mock data - in production, fetch from API based on parent ID
      const mockChildren: Child[] = [
        {
          id: 1,
          fullName: 'Student One',
          admissionNumber: 'ADM001',
          rollNumber: '101',
          email: 'student1@example.com',
          phone: '+91-9876543210',
          className: 'Class 8',
          sectionName: 'A',
          dateOfBirth: '2010-05-15',
          bloodGroup: 'O+',
          attendanceRate: 85,
          averageMarks: 78,
          pendingFees: 5000,
        },
      ];
      setChildren(mockChildren);
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">My Children</h1>
          <p className="text-muted-foreground">View your children's profiles and academic information</p>
        </div>

        {/* Children Cards */}
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading children profiles...</p>
              </div>
            </CardContent>
          </Card>
        ) : children.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No children profiles found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {children.map((child) => (
              <Card key={child.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-4 rounded-full">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{child.fullName}</CardTitle>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="secondary">
                            {child.className} - {child.sectionName}
                          </Badge>
                          <Badge variant="outline">Roll: {child.rollNumber}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="font-semibold mb-3">Personal Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Admission No.</p>
                        <p className="font-medium">{child.admissionNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        <p className="font-medium">
                          {new Date(child.dateOfBirth).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Blood Group</p>
                        <p className="font-medium">{child.bloodGroup}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Class</p>
                        <p className="font-medium">{child.className} - {child.sectionName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="font-semibold mb-3">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{child.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{child.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Academic Performance */}
                  <div>
                    <h3 className="font-semibold mb-4">Academic Performance</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium">Attendance</span>
                          </div>
                          <div className="text-2xl font-bold mb-2">{child.attendanceRate}%</div>
                          <Progress value={child.attendanceRate} />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3 mb-2">
                            <BookOpen className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium">Average Marks</span>
                          </div>
                          <div className="text-2xl font-bold mb-2">{child.averageMarks}%</div>
                          <Progress value={child.averageMarks} />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="h-5 w-5 text-yellow-600" />
                            <span className="text-sm font-medium">Pending Fees</span>
                          </div>
                          <div className="text-2xl font-bold">₹{child.pendingFees}</div>
                          <p className="text-xs text-muted-foreground mt-1">To be paid</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
