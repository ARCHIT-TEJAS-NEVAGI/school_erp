"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Phone, Mail, Calendar, MapPin, Heart, AlertTriangle, BookOpen, IndianRupee, MessageSquare } from 'lucide-react';

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchProfile();
    }
  }, [params.id]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/students/profile/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      
      const data = await res.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout role="admin">
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-muted-foreground mb-4">Profile not found</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  const getColorIndicator = (color: string) => {
    const colorClasses: any = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
    };
    return <div className={`w-4 h-4 rounded-full ${colorClasses[color || 'green']}`} />;
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{profile.user?.fullName || 'Student Profile'}</h1>
              <p className="text-muted-foreground">Complete student information</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getColorIndicator(profile.student.remarksColor)}
            {profile.student.isIrregular && (
              <Badge variant="destructive">Irregular</Badge>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Admission Number</p>
                  <p className="font-medium">{profile.student.admissionNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Roll Number</p>
                  <p className="font-medium">{profile.student.rollNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{profile.student.dateOfBirth ? new Date(profile.student.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{profile.student.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blood Group</p>
                  <p className="font-medium">{profile.student.bloodGroup || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium">{profile.student.username || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{profile.user?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Student Mobile</p>
                <p className="font-medium">{profile.student.studentMobileNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emergency Contact</p>
                <p className="font-medium">{profile.student.emergencyContact || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{profile.student.address || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Parent Information */}
        <Card>
          <CardHeader>
            <CardTitle>Parent/Guardian Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Parent Name</p>
                <p className="font-medium">{profile.student.parentName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Parent Mobile</p>
                <p className="font-medium">{profile.student.parentMobileNumber || 'N/A'}</p>
              </div>
            </div>
            {profile.parents && profile.parents.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold">Linked Parents:</p>
                {profile.parents.map((parent: any, index: number) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">{parent.fullName}</p>
                    <p className="text-sm text-muted-foreground">{parent.relation} • {parent.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Academic Information */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{profile.attendance.attendancePercentage}%</div>
              <div className="space-y-1 text-sm">
                <p>Total Days: {profile.attendance.totalDays}</p>
                <p className="text-green-600">Present: {profile.attendance.presentDays}</p>
                <p className="text-red-600">Absent: {profile.attendance.absentDays}</p>
                <p className="text-orange-600">Late: {profile.attendance.lateDays}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Academic Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{profile.marks.averagePercentage.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Total Exams: {profile.marks.totalExams}</p>
              {profile.marks.subjectWiseMarks.length > 0 && (
                <div className="mt-3 space-y-1">
                  {profile.marks.subjectWiseMarks.slice(0, 3).map((subject: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="truncate">{subject.subjectName}</span>
                      <span className="font-medium">{subject.averagePercentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Fee Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-bold">₹{profile.fees.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid Amount</p>
                  <p className="text-lg font-bold text-green-600">₹{profile.fees.paidAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Amount</p>
                  <p className="text-lg font-bold text-red-600">₹{profile.fees.dueAmount.toLocaleString()}</p>
                </div>
                {profile.student.feesConcession > 0 && (
                  <Badge variant="secondary">
                    {profile.student.feesConcession}% Concession
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Remarks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Remarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.recentRemarks.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No remarks yet</p>
            ) : (
              <div className="space-y-3">
                {profile.recentRemarks.map((remark: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={remark.remarkType === 'positive' ? 'default' : remark.remarkType === 'negative' ? 'destructive' : 'secondary'}>
                        {remark.remarkType}
                      </Badge>
                      <span className="text-sm text-muted-foreground">by {remark.teacherName}</span>
                    </div>
                    <p className="text-sm">{remark.remarkText}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(remark.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee Invoices */}
        {profile.fees.invoices && profile.fees.invoices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Fee Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profile.fees.invoices.map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{invoice.finalAmount.toLocaleString()}</p>
                      <Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'overdue' ? 'destructive' : 'secondary'}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
