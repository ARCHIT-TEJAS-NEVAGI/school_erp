"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, TrendingUp, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Mark {
  id: number;
  subjectId: number;
  examType: string;
  marksObtained: number;
  totalMarks: number;
  examDate: string;
  remarks: string;
}

export default function ParentMarksPage() {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    average: 0,
    highest: 0,
    totalExams: 0,
  });

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/marks?studentId=1&limit=50');
      const data = await response.json();
      setMarks(data);

      // Calculate stats
      if (data.length > 0) {
        const percentages = data.map((m: Mark) => (m.marksObtained / m.totalMarks) * 100);
        const average = Math.round(percentages.reduce((a: number, b: number) => a + b, 0) / percentages.length);
        const highest = Math.round(Math.max(...percentages));

        setStats({
          average,
          highest,
          totalExams: data.length,
        });
      }
    } catch (error) {
      console.error('Error fetching marks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (obtained: number, total: number) => {
    return Math.round((obtained / total) * 100);
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-500' };
    if (percentage >= 70) return { grade: 'B+', color: 'text-blue-600' };
    if (percentage >= 60) return { grade: 'B', color: 'text-blue-500' };
    if (percentage >= 50) return { grade: 'C', color: 'text-yellow-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Academic Performance</h1>
          <p className="text-muted-foreground">Track your child's marks and grades</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Marks</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.average}%</div>
              <Progress value={stats.average} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.highest}%</div>
              <p className="text-xs text-muted-foreground mt-1">Best performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExams}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Marks Table */}
        <Card>
          <CardHeader>
            <CardTitle>Examination Results</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading marks...</p>
              </div>
            ) : marks.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No marks available yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {marks.map((mark) => {
                  const percentage = getPercentage(mark.marksObtained, mark.totalMarks);
                  const gradeInfo = getGrade(percentage);

                  return (
                    <div
                      key={mark.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">Subject {mark.subjectId}</h3>
                            <Badge variant="outline">{mark.examType}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Date: {new Date(mark.examDate).toLocaleDateString()}
                          </p>
                          {mark.remarks && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Remarks: {mark.remarks}
                            </p>
                          )}
                          <Progress value={percentage} className="mt-2 w-48" />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {mark.marksObtained}/{mark.totalMarks}
                        </div>
                        <div className={`text-lg font-bold ${gradeInfo.color}`}>
                          {gradeInfo.grade}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {percentage}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
