"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, BookOpen, DollarSign, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    attendanceRate: 0,
    averageMarks: 0,
    pendingFees: 0,
    totalSubjects: 0,
  });

  const [recentMarks, setRecentMarks] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([
    { id: 1, title: 'Mathematics Test', date: '2025-02-10', type: 'exam' },
    { id: 2, title: 'Science Project Submission', date: '2025-02-15', type: 'assignment' },
    { id: 3, title: 'Parent-Teacher Meeting', date: '2025-02-20', type: 'meeting' },
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch student marks
      const marksRes = await fetch('/api/marks?studentId=1&limit=5');
      const marksData = await marksRes.json();
      
      // Calculate average
      const average = marksData.length > 0
        ? marksData.reduce((sum: number, mark: any) => sum + (mark.marksObtained / mark.totalMarks * 100), 0) / marksData.length
        : 0;

      setRecentMarks(marksData);
      setStats({
        attendanceRate: 85,
        averageMarks: Math.round(average),
        pendingFees: 5000,
        totalSubjects: 4,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <Progress value={stats.attendanceRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Marks</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageMarks}%</div>
              <Progress value={stats.averageMarks} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.pendingFees}</div>
              <p className="text-xs text-muted-foreground">Due this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubjects}</div>
              <p className="text-xs text-muted-foreground">This semester</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMarks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No marks available</p>
                ) : (
                  recentMarks.map((mark: any) => (
                    <div key={mark.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Subject {mark.subjectId}</p>
                        <p className="text-sm text-muted-foreground">{mark.examType}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{mark.marksObtained}/{mark.totalMarks}</p>
                        <Badge variant={mark.marksObtained / mark.totalMarks >= 0.8 ? "default" : "secondary"}>
                          {Math.round(mark.marksObtained / mark.totalMarks * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-3 border rounded-lg">
                    <div className="bg-primary/10 p-2 rounded">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.date}</p>
                    </div>
                    <Badge variant="outline">{event.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
