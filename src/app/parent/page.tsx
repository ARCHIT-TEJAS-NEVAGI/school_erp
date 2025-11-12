"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, BookOpen, DollarSign, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function ParentDashboard() {
  const [children, setChildren] = useState([
    {
      id: 1,
      name: 'Student 1',
      class: 'Class 8A',
      attendanceRate: 85,
      averageMarks: 78,
      pendingFees: 5000,
    },
  ]);

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const notifRes = await fetch('/api/notifications?recipientId=1&limit=5');
      const notifData = await notifRes.json();
      setNotifications(notifData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6">
        {/* Children Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Children
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {children.map((child) => (
                <div key={child.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{child.name}</h3>
                      <p className="text-sm text-muted-foreground">{child.class}</p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Attendance</p>
                      <div className="flex items-center gap-2">
                        <Progress value={child.attendanceRate} className="flex-1" />
                        <span className="text-sm font-medium">{child.attendanceRate}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Average Marks</p>
                      <p className="text-2xl font-bold">{child.averageMarks}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Pending Fees</p>
                      <p className="text-2xl font-bold">₹{child.pendingFees}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No notifications</p>
                ) : (
                  notifications.map((notif: any) => (
                    <div key={notif.id} className="p-3 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{notif.title}</p>
                          <p className="text-sm text-muted-foreground">{notif.message}</p>
                        </div>
                        {!notif.isRead && <Badge variant="secondary">New</Badge>}
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
              <div className="grid grid-cols-2 gap-4">
                <a href="/parent/attendance" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                  <Calendar className="h-6 w-6 mb-2 text-primary" />
                  <p className="font-medium">View Attendance</p>
                </a>
                <a href="/parent/marks" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                  <BookOpen className="h-6 w-6 mb-2 text-primary" />
                  <p className="font-medium">View Performance</p>
                </a>
                <a href="/parent/fees" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                  <DollarSign className="h-6 w-6 mb-2 text-primary" />
                  <p className="font-medium">Pay Fees</p>
                </a>
                <a href="/parent/children" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                  <Users className="h-6 w-6 mb-2 text-primary" />
                  <p className="font-medium">Child Profile</p>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
