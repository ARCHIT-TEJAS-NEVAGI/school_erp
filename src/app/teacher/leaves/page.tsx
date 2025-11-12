"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, FileText, Plus, X } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { toast } from 'sonner';

interface LeaveRequest {
  id: number;
  teacherId: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy?: number;
  reviewedAt?: string;
}

export default function TeacherLeavesPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    fetchTeacherId();
  }, []);

  useEffect(() => {
    if (teacherId) {
      fetchLeaveRequests();
    }
  }, [teacherId]);

  const fetchTeacherId = async () => {
    try {
      const user = getUser();
      if (!user) {
        toast.error('User not found');
        return;
      }

      // Fetch teacher data using userId
      const res = await fetch(`/api/teachers?userId=${user.id}`);
      const teachers = await res.json();
      
      if (teachers && teachers.length > 0) {
        setTeacherId(teachers[0].id);
      } else {
        toast.error('Teacher profile not found');
      }
    } catch (error) {
      console.error('Error fetching teacher ID:', error);
      toast.error('Failed to fetch teacher profile');
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/teacher-leave-requests?teacherId=${teacherId}&limit=50`);
      const data = await res.json();
      setLeaveRequests(data);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast.error('Failed to fetch leave requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacherId) {
      toast.error('Teacher ID not found');
      return;
    }

    if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (end < start) {
      toast.error('End date must be after or equal to start date');
      return;
    }

    try {
      const res = await fetch('/api/teacher-leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason.trim()
        })
      });

      if (res.ok) {
        toast.success('Leave request submitted successfully');
        setFormData({ startDate: '', endDate: '', reason: '' });
        setShowForm(false);
        fetchLeaveRequests();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast.error('Failed to submit leave request');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this leave request?')) {
      return;
    }

    try {
      const res = await fetch(`/api/teacher-leave-requests?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Leave request deleted successfully');
        fetchLeaveRequests();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete leave request');
      }
    } catch (error) {
      console.error('Error deleting leave request:', error);
      toast.error('Failed to delete leave request');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leave Requests</h1>
            <p className="text-muted-foreground">Apply for and manage your leave requests</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Apply for Leave
              </>
            )}
          </Button>
        </div>

        {/* Leave Application Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Apply for Leave</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Start Date</label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">End Date</label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Reason</label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Enter reason for leave..."
                    rows={4}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Submit Leave Request
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Leave Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>My Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : leaveRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No leave requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaveRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant={getStatusBadgeVariant(request.status)}>
                            {request.status.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {calculateDays(request.startDate, request.endDate)} day(s)
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              Requested: {new Date(request.requestedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm font-medium mb-1">Reason:</p>
                          <p className="text-sm text-muted-foreground">{request.reason}</p>
                        </div>

                        {request.reviewedAt && (
                          <p className="text-xs text-muted-foreground">
                            Reviewed on: {new Date(request.reviewedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {request.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(request.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
