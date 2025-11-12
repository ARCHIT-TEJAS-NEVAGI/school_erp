"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Class {
  id: number;
  className: string;
}

interface Section {
  id: number;
  sectionName: string;
  classId: number;
}

export default function RegisterStudentPage() {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [filteredSections, setFilteredSections] = useState<Section[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    username: "",
    password: "",
    classId: "",
    sectionId: "",
    parentName: "",
    parentMobile: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    address: "",
    totalFees: "",
    admissionConcessionFees: "",
  });

  useEffect(() => {
    fetchClasses();
    fetchSections();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      const filtered = sections.filter(s => s.classId === parseInt(selectedClass));
      setFilteredSections(filtered);
    } else {
      setFilteredSections([]);
    }
  }, [selectedClass, sections]);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      setClasses(data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchSections = async () => {
    try {
      const res = await fetch('/api/sections');
      const data = await res.json();
      setSections(data);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.mobile || !formData.username || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.classId || !formData.sectionId) {
      toast.error("Please select class and section");
      return;
    }

    if (!formData.parentName || !formData.parentMobile) {
      toast.error("Please enter parent information");
      return;
    }

    if (!formData.totalFees) {
      toast.error("Please enter total fees");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          mobile: formData.mobile,
          username: formData.username,
          password: formData.password,
          classId: parseInt(formData.classId),
          sectionId: parseInt(formData.sectionId),
          parentName: formData.parentName,
          parentMobile: formData.parentMobile,
          dateOfBirth: formData.dateOfBirth || undefined,
          gender: formData.gender || undefined,
          bloodGroup: formData.bloodGroup || undefined,
          address: formData.address || undefined,
          totalFees: parseFloat(formData.totalFees),
          admissionConcessionFees: formData.admissionConcessionFees ? parseFloat(formData.admissionConcessionFees) : 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to register student');
        return;
      }

      toast.success('Student registered successfully!', {
        description: `Admission Number: ${data.student.admissionNumber}`,
        icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      });

      // Reset form
      setFormData({
        name: "",
        mobile: "",
        username: "",
        password: "",
        classId: "",
        sectionId: "",
        parentName: "",
        parentMobile: "",
        dateOfBirth: "",
        gender: "",
        bloodGroup: "",
        address: "",
        totalFees: "",
        admissionConcessionFees: "",
      });
      setSelectedClass("");
      setFilteredSections([]);

    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register student');
    } finally {
      setLoading(false);
    }
  };

  const netFees = formData.totalFees && formData.admissionConcessionFees 
    ? parseFloat(formData.totalFees) - parseFloat(formData.admissionConcessionFees)
    : formData.totalFees 
    ? parseFloat(formData.totalFees)
    : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <Card className="shadow-xl border-2">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg">
          <CardTitle className="text-3xl flex items-center gap-3">
            <UserPlus className="w-8 h-8" />
            Register New Student
          </CardTitle>
          <CardDescription className="text-white/90">
            Add a new student to the system with auto-profile generation
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-primary">Student Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter student's full name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="Enter mobile number"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Create username for student"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Create password"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select value={formData.bloodGroup} onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter full address"
                  />
                </div>
              </div>
            </div>

            {/* Class Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-primary">Class Assignment</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="class">Class *</Label>
                  <Select 
                    value={selectedClass} 
                    onValueChange={(value) => {
                      setSelectedClass(value);
                      setFormData({ ...formData, classId: value, sectionId: "" });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="section">Section *</Label>
                  <Select 
                    value={formData.sectionId} 
                    onValueChange={(value) => setFormData({ ...formData, sectionId: value })}
                    disabled={!selectedClass}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSections.map((section) => (
                        <SelectItem key={section.id} value={section.id.toString()}>
                          {section.sectionName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Fee Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-primary">Fee Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="totalFees">Total Fees (₹) *</Label>
                  <Input
                    id="totalFees"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.totalFees}
                    onChange={(e) => setFormData({ ...formData, totalFees: e.target.value })}
                    placeholder="Enter total fees amount"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="admissionConcessionFees">Admission Concession Fees (₹)</Label>
                  <Input
                    id="admissionConcessionFees"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.admissionConcessionFees}
                    onChange={(e) => setFormData({ ...formData, admissionConcessionFees: e.target.value })}
                    placeholder="Enter concession amount (if any)"
                  />
                </div>

                {formData.totalFees && (
                  <div className="md:col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-blue-900">Net Fees Payable:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ₹{netFees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {formData.admissionConcessionFees && parseFloat(formData.admissionConcessionFees) > 0 && (
                      <p className="text-sm text-blue-700 mt-2">
                        (Total: ₹{parseFloat(formData.totalFees).toLocaleString('en-IN')} - Concession: ₹{parseFloat(formData.admissionConcessionFees).toLocaleString('en-IN')})
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Parent Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-primary">Parent Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="parentName">Parent Name *</Label>
                  <Input
                    id="parentName"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="Enter parent's name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="parentMobile">Parent Mobile *</Label>
                  <Input
                    id="parentMobile"
                    value={formData.parentMobile}
                    onChange={(e) => setFormData({ ...formData, parentMobile: e.target.value })}
                    placeholder="Enter parent's mobile"
                    required
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Registering Student...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Register Student
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}