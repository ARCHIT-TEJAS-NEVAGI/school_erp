"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar, Plus, Edit, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface TimetableEntry {
  id: number;
  sectionId: number;
  subjectId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
}

interface Section {
  id: number;
  sectionName: string;
  className: string;
}

interface Subject {
  id: number;
  subjectName: string;
  subjectCode: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminTimetablePage() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  
  const [formData, setFormData] = useState({
    sectionId: '',
    subjectId: '',
    dayOfWeek: 'Monday',
    startTime: '',
    endTime: '',
    roomNumber: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timetableRes, sectionsRes, subjectsRes] = await Promise.all([
        fetch('/api/timetables?limit=500'),
        fetch('/api/sections?limit=100'),
        fetch('/api/subjects?limit=100'),
      ]);

      const timetableData = await timetableRes.json();
      const sectionsData = await sectionsRes.json();
      const subjectsData = await subjectsRes.json();

      setTimetable(timetableData);
      setSections(sectionsData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingEntry(null);
    setFormData({
      sectionId: '',
      subjectId: '',
      dayOfWeek: selectedDay,
      startTime: '',
      endTime: '',
      roomNumber: '',
    });
    setShowDialog(true);
  };

  const handleEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormData({
      sectionId: entry.sectionId.toString(),
      subjectId: entry.subjectId.toString(),
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      roomNumber: entry.roomNumber,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this timetable entry?')) return;

    try {
      const response = await fetch(`/api/timetables/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Timetable entry deleted successfully');
        fetchData();
      } else {
        toast.error('Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      sectionId: parseInt(formData.sectionId),
      subjectId: parseInt(formData.subjectId),
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      roomNumber: formData.roomNumber,
    };

    try {
      const url = editingEntry
        ? `/api/timetables/${editingEntry.id}`
        : '/api/timetables';
      
      const method = editingEntry ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingEntry ? 'Entry updated successfully' : 'Entry added successfully');
        setShowDialog(false);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save entry');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save entry');
    }
  };

  const getTimetableForDay = (day: string) => {
    return timetable
      .filter(entry => entry.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getSectionName = (sectionId: number) => {
    const section = sections.find(s => s.id === sectionId);
    return section ? `${section.className} - ${section.sectionName}` : `Section ${sectionId}`;
  };

  const getSubjectName = (subjectId: number) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.subjectName : `Subject ${subjectId}`;
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Timetable Management</h1>
            <p className="text-muted-foreground">Manage class schedules and timetables</p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        </div>

        {/* Day Tabs */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {DAYS.map((day) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? 'default' : 'outline'}
                  onClick={() => setSelectedDay(day)}
                  className="flex-shrink-0"
                >
                  {day}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timetable Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {selectedDay}'s Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading timetable...</p>
              </div>
            ) : getTimetableForDay(selectedDay).length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No schedules for {selectedDay}</p>
                <Button onClick={handleAdd} className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Schedule
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {getTimetableForDay(selectedDay).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{getSubjectName(entry.subjectId)}</h3>
                          <Badge variant="secondary">{getSectionName(entry.sectionId)}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {entry.startTime} - {entry.endTime}
                          </span>
                          <span>Room {entry.roomNumber}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Edit Schedule' : 'Add New Schedule'}</DialogTitle>
            <DialogDescription>
              {editingEntry ? 'Update the schedule details' : 'Add a new class schedule to the timetable'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="section">Class/Section</Label>
              <Select
                value={formData.sectionId}
                onValueChange={(value) => setFormData({ ...formData, sectionId: value })}
                required
              >
                <SelectTrigger id="section">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id.toString()}>
                      {section.className} - {section.sectionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={formData.subjectId}
                onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                required
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.subjectName} ({subject.subjectCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="day">Day of Week</Label>
              <Select
                value={formData.dayOfWeek}
                onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}
                required
              >
                <SelectTrigger id="day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room">Room Number</Label>
              <Input
                id="room"
                placeholder="e.g., 101, Lab-A"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingEntry ? 'Update' : 'Add'} Schedule
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
