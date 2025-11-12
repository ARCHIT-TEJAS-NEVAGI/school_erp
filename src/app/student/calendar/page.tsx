"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function StudentCalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
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

  const getEventTypeBadge = (type: string) => {
    const variants: any = {
      holiday: 'destructive',
      exam: 'default',
      event: 'secondary',
      meeting: 'outline',
    };
    return <Badge variant={variants[type] || 'secondary'}>{type}</Badge>;
  };

  const groupedEvents = groupEventsByMonth();

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">School Calendar</h1>
          <p className="text-muted-foreground">View holidays, events, and important dates</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-muted-foreground text-center">Loading events...</p>
            </CardContent>
          </Card>
        ) : Object.keys(groupedEvents).length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-muted-foreground text-center">No events scheduled</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([month, monthEvents]: [string, any]) => (
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
                      <div key={event.id} className="p-4 border rounded-lg">
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
                    ))}
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
