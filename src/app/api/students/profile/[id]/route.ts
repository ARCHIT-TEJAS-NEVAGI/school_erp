import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  students, 
  users, 
  sections, 
  classes, 
  academicYears, 
  attendance, 
  feeInvoices, 
  marks, 
  teacherRemarks, 
  parents, 
  studentParents, 
  subjects,
  teachers
} from '@/db/schema';
import { eq, and, avg, sum, count, desc, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid student ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const studentId = parseInt(id);

    // Fetch basic student record first
    const studentResult = await db.select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (studentResult.length === 0) {
      return NextResponse.json({ 
        error: 'Student not found',
        code: 'STUDENT_NOT_FOUND' 
      }, { status: 404 });
    }

    const student = studentResult[0];

    // Fetch user information
    let userInfo = null;
    if (student.userId) {
      const userResult = await db.select()
        .from(users)
        .where(eq(users.id, student.userId))
        .limit(1);
      if (userResult.length > 0) {
        const user = userResult[0];
        userInfo = {
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
        };
      }
    }

    // Fetch section and class information
    let sectionInfo = null;
    let classInfo = null;
    let academicYearInfo = null;

    if (student.sectionId) {
      const sectionResult = await db.select()
        .from(sections)
        .where(eq(sections.id, student.sectionId))
        .limit(1);

      if (sectionResult.length > 0) {
        const section = sectionResult[0];
        sectionInfo = {
          sectionName: section.sectionName,
          classId: section.classId,
        };

        if (section.classId) {
          const classResult = await db.select()
            .from(classes)
            .where(eq(classes.id, section.classId))
            .limit(1);

          if (classResult.length > 0) {
            const classData = classResult[0];
            classInfo = {
              className: classData.className,
            };

            if (classData.academicYearId) {
              const academicYearResult = await db.select()
                .from(academicYears)
                .where(eq(academicYears.id, classData.academicYearId))
                .limit(1);

              if (academicYearResult.length > 0) {
                const academicYear = academicYearResult[0];
                academicYearInfo = {
                  yearName: academicYear.yearName,
                  startDate: academicYear.startDate,
                  endDate: academicYear.endDate,
                  isCurrent: academicYear.isCurrent,
                };
              }
            }
          }
        }
      }
    }

    // Fetch attendance summary
    const attendanceSummary = await db.select({
      totalDays: count(attendance.id),
      presentDays: sql<number>`SUM(CASE WHEN ${attendance.status} = 'present' THEN 1 ELSE 0 END)`,
      absentDays: sql<number>`SUM(CASE WHEN ${attendance.status} = 'absent' THEN 1 ELSE 0 END)`,
      lateDays: sql<number>`SUM(CASE WHEN ${attendance.status} = 'late' THEN 1 ELSE 0 END)`,
    })
    .from(attendance)
    .where(eq(attendance.studentId, studentId));

    const attendanceData = attendanceSummary[0];
    const totalDays = attendanceData?.totalDays || 0;
    const presentDays = Number(attendanceData?.presentDays) || 0;
    const absentDays = Number(attendanceData?.absentDays) || 0;
    const lateDays = Number(attendanceData?.lateDays) || 0;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // Fetch fee summary
    const feeSummary = await db.select({
      totalInvoices: count(feeInvoices.id),
      totalAmount: sql<number>`COALESCE(SUM(${feeInvoices.totalAmount}), 0)`,
      paidAmount: sql<number>`COALESCE(SUM(${feeInvoices.paidAmount}), 0)`,
      dueAmount: sql<number>`COALESCE(SUM(${feeInvoices.dueAmount}), 0)`,
    })
    .from(feeInvoices)
    .where(eq(feeInvoices.studentId, studentId));

    const feeData = feeSummary[0];
    const feeSummaryResult = {
      totalInvoices: feeData?.totalInvoices || 0,
      totalAmount: Number(feeData?.totalAmount) || 0,
      paidAmount: Number(feeData?.paidAmount) || 0,
      dueAmount: Number(feeData?.dueAmount) || 0,
    };

    // Fetch fee invoices list
    const invoices = await db.select()
      .from(feeInvoices)
      .where(eq(feeInvoices.studentId, studentId))
      .orderBy(desc(feeInvoices.createdAt));

    // Fetch marks data
    const marksData = await db.select()
      .from(marks)
      .where(eq(marks.studentId, studentId));

    // Calculate overall marks summary
    let totalExams = marksData.length;
    let totalPercentage = 0;
    
    if (marksData.length > 0) {
      totalPercentage = marksData.reduce((acc, mark) => {
        const percentage = mark.totalMarks > 0 ? (mark.marksObtained / mark.totalMarks) * 100 : 0;
        return acc + percentage;
      }, 0) / marksData.length;
    }

    // Get subject details for marks
    const subjectWiseMap = new Map();
    
    for (const mark of marksData) {
      if (mark.subjectId) {
        const subjectResult = await db.select()
          .from(subjects)
          .where(eq(subjects.id, mark.subjectId))
          .limit(1);

        const subjectName = subjectResult.length > 0 ? subjectResult[0].subjectName : 'Unknown Subject';
        
        if (!subjectWiseMap.has(mark.subjectId)) {
          subjectWiseMap.set(mark.subjectId, {
            subjectId: mark.subjectId,
            subjectName: subjectName,
            totalExams: 0,
            totalPercentage: 0,
          });
        }

        const subjectData = subjectWiseMap.get(mark.subjectId);
        const percentage = mark.totalMarks > 0 ? (mark.marksObtained / mark.totalMarks) * 100 : 0;
        subjectData.totalExams += 1;
        subjectData.totalPercentage += percentage;
      }
    }

    const subjectWiseMarks = Array.from(subjectWiseMap.values()).map(subject => ({
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      totalExams: subject.totalExams,
      averagePercentage: subject.totalExams > 0 ? subject.totalPercentage / subject.totalExams : 0,
    }));

    const marksSummary = {
      totalExams,
      averagePercentage: totalPercentage,
      subjectWiseMarks,
    };

    // Fetch recent remarks
    const remarksData = await db.select()
      .from(teacherRemarks)
      .where(eq(teacherRemarks.studentId, studentId))
      .orderBy(desc(teacherRemarks.date))
      .limit(5);

    const remarks = [];
    for (const remark of remarksData) {
      let teacherName = 'Unknown Teacher';
      if (remark.teacherId) {
        const teacherResult = await db.select()
          .from(teachers)
          .where(eq(teachers.id, remark.teacherId))
          .limit(1);

        if (teacherResult.length > 0 && teacherResult[0].userId) {
          const teacherUserResult = await db.select()
            .from(users)
            .where(eq(users.id, teacherResult[0].userId))
            .limit(1);

          if (teacherUserResult.length > 0) {
            teacherName = teacherUserResult[0].fullName;
          }
        }
      }

      remarks.push({
        remarkText: remark.remarkText,
        remarkType: remark.remarkType,
        date: remark.date,
        teacherName: teacherName,
      });
    }

    // Fetch parent information
    const parentLinks = await db.select()
      .from(studentParents)
      .where(eq(studentParents.studentId, studentId));

    const parentInfo = [];
    for (const link of parentLinks) {
      if (link.parentId) {
        const parentResult = await db.select()
          .from(parents)
          .where(eq(parents.id, link.parentId))
          .limit(1);

        if (parentResult.length > 0) {
          const parent = parentResult[0];
          let parentUserInfo = null;

          if (parent.userId) {
            const parentUserResult = await db.select()
              .from(users)
              .where(eq(users.id, parent.userId))
              .limit(1);

            if (parentUserResult.length > 0) {
              const parentUser = parentUserResult[0];
              parentUserInfo = {
                fullName: parentUser.fullName,
                email: parentUser.email,
                phone: parentUser.phone,
              };
            }
          }

          parentInfo.push({
            parentId: parent.id,
            relation: parent.relation,
            occupation: parent.occupation,
            fullName: parentUserInfo?.fullName || null,
            email: parentUserInfo?.email || null,
            phone: parentUserInfo?.phone || null,
            isPrimary: link.isPrimary,
          });
        }
      }
    }

    // Construct comprehensive response
    const response = {
      student: student,
      user: userInfo,
      section: sectionInfo,
      class: classInfo,
      academicYear: academicYearInfo,
      attendance: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100,
      },
      fees: {
        ...feeSummaryResult,
        invoices,
      },
      marks: marksSummary,
      recentRemarks: remarks,
      parents: parentInfo,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('GET student profile error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}