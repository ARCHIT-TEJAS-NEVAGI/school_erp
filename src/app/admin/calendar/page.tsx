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
import { Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventType: 'event',
    isHoliday: false,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/calendar-events?limit=100');
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/calendar-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...eventData,
          createdBy: 1,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add event');
      }

      toast.success('Event added successfully');
      setShowAddDialog(false);
      resetForm();
      fetchEvents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add event');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const res = await fetch(`/api/calendar-events?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete event');

      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete event');
    }
  };

  const resetForm = () => {
    setEventData({
      title: '',
      description: '',
      eventDate: '',
      eventType: 'event',
      isHoliday: false,
    });
  };

  const getEventTypeBadge = (type: string) => {
    const variants: any = {
      holiday: 'destructive',
      exam: 'default',
      event: 'secondary',
      meeting: 'outline',
    };
    return <Badge variant={variants[type] || 'secondary'}>{type}</Badge>;
  };

  const groupEventsByMonth = () => {
    const grouped: any = {};
    events.forEach((event: any) => {
      const month = new Date(event.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(event);
    });
    return grouped;
  };

  const groupedEvents = groupEventsByMonth();

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">School Calendar</h1>
            <p className="text-muted-foreground">Manage holidays, events, and important dates</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>

        {/* Events by Month */}
        <div className="space-y-6">
          {Object.keys(groupedEvents).length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">No events scheduled</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedEvents).map(([month, monthEvents]: [string, any]) => (
              <Card key={month}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {month}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monthEvents.map((event: any) => (
                      <div key={event.id} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getEventTypeBadge(event.eventType)}
                            {event.isHoliday && <Badge variant="destructive">Holiday</Badge>}
                          </div>
                          <h3 className="font-semibold">{event.title}</h3>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(event.eventDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add Event Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Calendar Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  required
                  value={eventData.title}
                  onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventDate">Event Date *</Label>
                <Input
                  id="eventDate"
                  type="date"
                  required
                  value={eventData.eventDate}
                  onChange={(e) => setEventData({ ...eventData, eventDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type *</Label>
                <Select
                  value={eventData.eventType}
                  onValueChange={(value) => setEventData({ ...eventData, eventType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isHoliday"
                  checked={eventData.isHoliday}
                  onChange={(e) => setEventData({ ...eventData, isHoliday: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isHoliday">Mark as Holiday</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={eventData.description}
                  onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Event'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
