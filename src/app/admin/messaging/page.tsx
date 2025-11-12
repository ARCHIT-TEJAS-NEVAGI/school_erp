"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, Loader2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function MessagingPage() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const [messageData, setMessageData] = useState({
    recipientType: 'all',
    classId: '',
    sectionId: '',
    studentId: '',
    messageText: '',
  });

  useEffect(() => {
    fetchClasses();
    fetchMessages();
  }, []);

  useEffect(() => {
    if (messageData.classId) {
      fetchSections(messageData.classId);
    }
  }, [messageData.classId]);

  useEffect(() => {
    if (messageData.sectionId) {
      fetchStudents(messageData.sectionId);
    }
  }, [messageData.sectionId]);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes?limit=50');
      const data = await res.json();
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSections = async (classId: string) => {
    try {
      const res = await fetch(`/api/sections?classId=${classId}&limit=50`);
      const data = await res.json();
      setSections(data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchStudents = async (sectionId: string) => {
    try {
      const res = await fetch(`/api/students?sectionId=${sectionId}&limit=100`);
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/whatsapp-messages?limit=50');
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingMessage(true);

    try {
      const payload: any = {
        recipientType: messageData.recipientType,
        messageText: messageData.messageText,
        sentBy: 1, // Admin user ID
      };

      if (messageData.recipientType === 'individual') {
        if (!messageData.studentId) {
          toast.error('Please select a student');
          return;
        }
        payload.recipientId = parseInt(messageData.studentId);
        payload.phoneNumber = '+1234567890'; // This should come from student data
      } else if (messageData.recipientType === 'class') {
        if (!messageData.classId) {
          toast.error('Please select a class');
          return;
        }
        payload.classId = parseInt(messageData.classId);
      } else if (messageData.recipientType === 'section') {
        if (!messageData.sectionId) {
          toast.error('Please select a section');
          return;
        }
        payload.sectionId = parseInt(messageData.sectionId);
      }

      const res = await fetch('/api/whatsapp-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send message');
      }

      toast.success('Message sent successfully!');
      setMessageData({
        recipientType: 'all',
        classId: '',
        sectionId: '',
        studentId: '',
        messageText: '',
      });
      fetchMessages();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mass Messaging</h1>
          <p className="text-muted-foreground">Send WhatsApp/SMS messages to students and parents</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Send Message Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientType">Recipient Type</Label>
                  <Select
                    value={messageData.recipientType}
                    onValueChange={(value) => setMessageData({ ...messageData, recipientType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      <SelectItem value="class">By Class</SelectItem>
                      <SelectItem value="section">By Section</SelectItem>
                      <SelectItem value="individual">Individual Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {messageData.recipientType === 'class' && (
                  <div className="space-y-2">
                    <Label htmlFor="classId">Select Class</Label>
                    <Select
                      value={messageData.classId}
                      onValueChange={(value) => setMessageData({ ...messageData, classId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls: any) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {cls.className}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(messageData.recipientType === 'section' || messageData.recipientType === 'individual') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="classId">Select Class</Label>
                      <Select
                        value={messageData.classId}
                        onValueChange={(value) => setMessageData({ ...messageData, classId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls: any) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>
                              {cls.className}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sectionId">Select Section</Label>
                      <Select
                        value={messageData.sectionId}
                        onValueChange={(value) => setMessageData({ ...messageData, sectionId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map((section: any) => (
                            <SelectItem key={section.id} value={section.id.toString()}>
                              {section.sectionName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {messageData.recipientType === 'individual' && (
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Select Student</Label>
                    <Select
                      value={messageData.studentId}
                      onValueChange={(value) => setMessageData({ ...messageData, studentId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student: any) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.admissionNumber} - {student.rollNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="messageText">Message</Label>
                  <Textarea
                    id="messageText"
                    required
                    rows={5}
                    placeholder="Type your message here..."
                    value={messageData.messageText}
                    onChange={(e) => setMessageData({ ...messageData, messageText: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {messageData.messageText.length} characters
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={sendingMessage}>
                  {sendingMessage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Message History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Message History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No messages sent yet</p>
                ) : (
                  messages.map((message: any) => (
                    <div key={message.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={message.status === 'sent' ? 'default' : message.status === 'failed' ? 'destructive' : 'secondary'}>
                          {message.recipientType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.sentAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.messageText}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>Status: {message.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
