"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, BookOpen, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    todayClasses: 0,
    pendingTasks: 0,
  });

  const [todaySchedule, setTodaySchedule] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch timetable for today
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      
      const timetableRes = await fetch(`/api/timetables?dayOfWeek=${today}&limit=10`);
      const timetableData = await timetableRes.json();
      
      setTodaySchedule(timetableData);
      setStats({
        totalClasses: 6,
        totalStudents: 30,
        todayClasses: timetableData.length,
        pendingTasks: 3,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClasses}</div>
              <p className="text-xs text-muted-foreground">Assigned to you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Under your guidance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayClasses}</div>
              <p className="text-xs text-muted-foreground">Scheduled today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingTasks}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaySchedule.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No classes scheduled for today</p>
              ) : (
                todaySchedule.map((schedule: any) => (
                  <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Subject {schedule.subjectId}</p>
                        <p className="text-sm text-muted-foreground">Section {schedule.sectionId} • Room {schedule.roomNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{schedule.startTime} - {schedule.endTime}</p>
                      <Badge variant="secondary">{schedule.dayOfWeek}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/teacher/attendance" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <Calendar className="h-6 w-6 mb-2 text-primary" />
                <p className="font-medium">Mark Attendance</p>
              </a>
              <a href="/teacher/marks" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <BookOpen className="h-6 w-6 mb-2 text-primary" />
                <p className="font-medium">Enter Marks</p>
              </a>
              <a href="/teacher/students" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <Users className="h-6 w-6 mb-2 text-primary" />
                <p className="font-medium">View Students</p>
              </a>
              <a href="/teacher/timetable" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <Clock className="h-6 w-6 mb-2 text-primary" />
                <p className="font-medium">My Timetable</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
