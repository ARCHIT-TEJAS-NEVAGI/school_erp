"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Phone, Lock, Save, Download, Database, AlertTriangle, Fingerprint, Send, CheckCircle, Edit } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testAdmissionNumber, setTestAdmissionNumber] = useState('');
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [whatsappTemplate, setWhatsappTemplate] = useState('');
  const [originalTemplate, setOriginalTemplate] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        fullName: currentUser.fullName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      });
    }
    fetchWhatsappTemplate();
    setIsLoading(false);
  }, []);

  const fetchWhatsappTemplate = async () => {
    try {
      const response = await fetch('/api/settings?key=whatsapp_attendance_template');
      if (response.ok) {
        const data = await response.json();
        setWhatsappTemplate(data.value);
        setOriginalTemplate(data.value);
      }
    } catch (error) {
      console.error('Failed to fetch template:', error);
    }
  };

  const handleSaveTemplate = async () => {
    setIsSavingTemplate(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'whatsapp_attendance_template',
          value: whatsappTemplate
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update template');
      }

      setOriginalTemplate(whatsappTemplate);
      setIsEditingTemplate(false);
      toast.success('WhatsApp template updated successfully');
    } catch (error) {
      console.error('Template update error:', error);
      toast.error('Failed to update template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleCancelEdit = () => {
    setWhatsappTemplate(originalTemplate);
    setIsEditingTemplate(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      toast.info('Exporting database... This may take a moment.');
      
      const response = await fetch('/api/admin/export-data', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `school_database_export_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Database exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export database');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAndClear = async () => {
    setIsClearingData(true);
    try {
      toast.info('Exporting and clearing database... This may take a few moments.');
      
      const response = await fetch('/api/admin/export-and-clear', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export and clear failed');
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `school_database_backup_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Database backup downloaded and database cleared successfully!');
      
      // Reload page after a short delay to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Export and clear error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export and clear database');
    } finally {
      setIsClearingData(false);
      setShowClearConfirm(false);
    }
  };

  const handleTestBiometric = async () => {
    if (!testAdmissionNumber.trim()) {
      toast.error('Please enter a student admission number');
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch('/api/biometric/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'TEST-DEVICE-001',
          studentAdmissionNumber: testAdmissionNumber,
          timestamp: new Date().toISOString(),
          status: 'present'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Test failed');
      }

      toast.success('Biometric test successful! Attendance marked and notification sent.', {
        description: `Student: ${testAdmissionNumber}\nParent notified via WhatsApp`
      });
    } catch (error) {
      console.error('Test error:', error);
      toast.error(error instanceof Error ? error.message : 'Test failed');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        {/* Biometric Attendance Configuration */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-teal-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-green-600" />
              Biometric Attendance Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-green-900">
                    ✅ Automated Attendance System Active
                  </p>
                  <p className="text-sm text-gray-700">
                    When a student scans their biometric, the system automatically:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                    <li>Marks attendance in the database</li>
                    <li>Sends WhatsApp notification to parent</li>
                    <li>Records timestamp and device information</li>
                    <li>Prevents duplicate entries for the same day</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-blue-900">📱 WhatsApp Message Template:</p>
                  {!isEditingTemplate && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsEditingTemplate(true)}
                      className="h-7"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
                
                {isEditingTemplate ? (
                  <div className="space-y-3">
                    <Textarea
                      value={whatsappTemplate}
                      onChange={(e) => setWhatsappTemplate(e.target.value)}
                      rows={12}
                      className="font-mono text-sm"
                      placeholder="Enter your WhatsApp message template..."
                    />
                    <div className="bg-amber-50 border border-amber-200 rounded p-2">
                      <p className="text-xs font-semibold text-amber-900 mb-1">Available Placeholders:</p>
                      <div className="text-xs text-amber-800 space-y-0.5">
                        <div><code className="bg-white px-1 rounded">[Student Name]</code> - Student's full name</div>
                        <div><code className="bg-white px-1 rounded">[Admission No]</code> - Admission number</div>
                        <div><code className="bg-white px-1 rounded">[HH:MM AM/PM]</code> - Attendance time</div>
                        <div><code className="bg-white px-1 rounded">[DD/MM/YYYY]</code> - Attendance date</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveTemplate}
                        disabled={isSavingTemplate}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <Save className="mr-2 h-3 w-3" />
                        {isSavingTemplate ? 'Saving...' : 'Save Template'}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        disabled={isSavingTemplate}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded p-3 text-sm text-gray-800 font-mono whitespace-pre-wrap border">
{whatsappTemplate}
                  </div>
                )}
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-purple-900 mb-2">🔗 API Endpoint:</p>
                <code className="text-xs bg-white px-2 py-1 rounded border">
                  POST /api/biometric/attendance
                </code>
                <p className="text-xs text-purple-800 mt-2">
                  Configure your biometric device to send data to this endpoint
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-3">🧪 Test Biometric Integration</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Student Admission Number"
                  value={testAdmissionNumber}
                  onChange={(e) => setTestAdmissionNumber(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleTestBiometric}
                  disabled={isTesting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isTesting ? 'Testing...' : 'Test'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This will simulate a biometric scan and send a real WhatsApp notification using the template above
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter your phone number"
              />
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Database Management */}
        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-600" />
              Database Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Export Data:</strong> Download all database records as CSV files in a ZIP archive. Your data remains in the database.
              </p>
            </div>

            <Button 
              onClick={handleExportData} 
              disabled={isExporting}
              variant="outline"
              className="w-full border-2 border-blue-500 text-blue-700 hover:bg-blue-50"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export Data Only'}
            </Button>

            <div className="border-t pt-4 mt-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm text-red-800 font-semibold">
                      <strong>Export and Clear Database:</strong> This will:
                    </p>
                    <ul className="text-sm text-red-800 space-y-1 ml-4 list-disc">
                      <li>Download a backup of all current data</li>
                      <li>Delete all students and teachers</li>
                      <li>Clear all attendance, marks, and fee records</li>
                      <li>Keep academic structure (years, classes, sections)</li>
                      <li>Keep admin account</li>
                    </ul>
                    <p className="text-sm text-red-800 font-semibold mt-2">
                      ⚠️ This action cannot be undone!
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => setShowClearConfirm(true)} 
                disabled={isClearingData}
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Database className="mr-2 h-4 w-4" />
                {isClearingData ? 'Processing...' : 'Export and Clear Database'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Change Password
              </label>
              <p className="text-sm text-muted-foreground mb-3">
                For security reasons, password changes require verification
              </p>
              <Button variant="outline">Change Password</Button>
            </div>
          </CardContent>
        </Card>

        {/* Role Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Account Status</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              Clear Database?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-foreground">
                This will permanently delete:
              </p>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li>All student and teacher records</li>
                <li>All attendance data</li>
                <li>All marks and academic records</li>
                <li>All fee invoices and payments</li>
                <li>All notifications and messages</li>
              </ul>
              <p className="font-semibold text-foreground mt-4">
                This will keep:
              </p>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li>Academic years, classes, and sections</li>
                <li>Fee templates</li>
                <li>Admin account</li>
              </ul>
              <p className="text-red-600 font-bold mt-4">
                A backup will be downloaded before clearing. This action cannot be undone!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearingData}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExportAndClear}
              disabled={isClearingData}
              className="bg-red-600 hover:bg-red-700"
            >
              {isClearingData ? 'Processing...' : 'Yes, Export and Clear Database'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}