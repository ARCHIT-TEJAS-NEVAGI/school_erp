"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, BookOpen } from 'lucide-react';

interface TimetableEntry {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subjectId: number;
  sectionId: number;
  roomNumber: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeacherTimetablePage() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/timetables?limit=100');
      const data = await response.json();
      setTimetable(data);
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimetableForDay = (day: string) => {
    return timetable
      .filter(entry => entry.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">My Timetable</h1>
          <p className="text-muted-foreground">Your weekly class schedule</p>
        </div>

        {/* Timetable Grid */}
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading timetable...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {DAYS.map((day) => {
              const daySchedule = getTimetableForDay(day);
              const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
              const isToday = day === today;

              return (
                <Card key={day} className={isToday ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {day}
                        {isToday && (
                          <Badge variant="default">Today</Badge>
                        )}
                      </CardTitle>
                      <Badge variant="secondary">
                        {daySchedule.length} {daySchedule.length === 1 ? 'Class' : 'Classes'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {daySchedule.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No classes scheduled
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {daySchedule.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="bg-primary/10 p-3 rounded-lg">
                                <BookOpen className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">Subject {entry.subjectId}</p>
                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {entry.startTime} - {entry.endTime}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    Room {entry.roomNumber}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline">Section {entry.sectionId}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
