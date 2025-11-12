import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  students, 
  attendance, 
  feeInvoices, 
  teachers, 
  staffAttendance, 
  academicYears,
  feePayments,
  users
} from '@/db/schema';
import { eq, and, sum, count, sql, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Get current month boundaries
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const monthStart = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
    const monthEnd = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

    // 1. Total Students (all students regardless of isActive in users table)
    const totalStudentsResult = await db
      .select({ count: count() })
      .from(students);
    const totalStudents = totalStudentsResult[0]?.count || 0;

    // 2. Today's Present Students
    const presentTodayResult = await db
      .select({ count: count() })
      .from(attendance)
      .where(and(
        eq(attendance.date, todayString),
        eq(attendance.status, 'present')
      ));
    const presentToday = presentTodayResult[0]?.count || 0;

    // 3. Today's Absent Students
    const absentTodayResult = await db
      .select({ count: count() })
      .from(attendance)
      .where(and(
        eq(attendance.date, todayString),
        eq(attendance.status, 'absent')
      ));
    const absentToday = absentTodayResult[0]?.count || 0;

    // 4. Today's Unmarked Students
    // Get all students who have attendance record today
    const markedTodayResult = await db
      .select({ studentId: attendance.studentId })
      .from(attendance)
      .where(eq(attendance.date, todayString));
    
    const markedStudentIds = new Set(markedTodayResult.map(r => r.studentId));
    const unmarkedToday = totalStudents - markedStudentIds.size;

    // 5. Fees Fully Paid - Students with ALL invoices paid
    const studentsWithInvoices = await db
      .select({ 
        studentId: feeInvoices.studentId,
        status: feeInvoices.status 
      })
      .from(feeInvoices);

    // Group by student and check if all their invoices are paid
    const studentInvoiceStatus = new Map<number, string[]>();
    studentsWithInvoices.forEach(inv => {
      if (!studentInvoiceStatus.has(inv.studentId)) {
        studentInvoiceStatus.set(inv.studentId, []);
      }
      studentInvoiceStatus.get(inv.studentId)!.push(inv.status);
    });

    const feesFullyPaid = Array.from(studentInvoiceStatus.entries())
      .filter(([_, statuses]) => statuses.every(s => s === 'paid'))
      .length;

    // 6. Fees Unpaid - Students with at least one pending or overdue invoice
    const feesUnpaid = Array.from(studentInvoiceStatus.entries())
      .filter(([_, statuses]) => statuses.some(s => s === 'pending' || s === 'overdue'))
      .length;

    // 7. Fees Partial - Students with at least one partial invoice
    const feesPartial = Array.from(studentInvoiceStatus.entries())
      .filter(([_, statuses]) => statuses.some(s => s === 'partial'))
      .length;

    // 8. Total Staff (all teachers)
    const totalStaffResult = await db
      .select({ count: count() })
      .from(teachers);
    const totalStaff = totalStaffResult[0]?.count || 0;

    // 9. Staff Present Today
    const staffPresentTodayResult = await db
      .select({ count: count() })
      .from(staffAttendance)
      .where(and(
        eq(staffAttendance.date, todayString),
        eq(staffAttendance.status, 'present')
      ));
    const staffPresentToday = staffPresentTodayResult[0]?.count || 0;

    // 10. Staff Absent Today
    const staffAbsentTodayResult = await db
      .select({ count: count() })
      .from(staffAttendance)
      .where(and(
        eq(staffAttendance.date, todayString),
        eq(staffAttendance.status, 'absent')
      ));
    const staffAbsentToday = staffAbsentTodayResult[0]?.count || 0;

    // 11. Staff Unmarked Today
    const staffMarkedTodayResult = await db
      .select({ teacherId: staffAttendance.teacherId })
      .from(staffAttendance)
      .where(eq(staffAttendance.date, todayString));
    
    const markedStaffIds = new Set(staffMarkedTodayResult.map(r => r.teacherId));
    const staffUnmarked = totalStaff - markedStaffIds.size;

    // 12. Irregular Students (isIrregular = true)
    const irregularStudentsResult = await db
      .select({ count: count() })
      .from(students)
      .where(eq(students.isIrregular, true));
    const irregularStudents = irregularStudentsResult[0]?.count || 0;

    // 13. Regular Students (isIrregular = false)
    const regularStudentsResult = await db
      .select({ count: count() })
      .from(students)
      .where(eq(students.isIrregular, false));
    const regularStudents = regularStudentsResult[0]?.count || 0;

    // 14. Today's Revenue
    const todayRevenueResult = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${feePayments.amount}), 0)` 
      })
      .from(feePayments)
      .where(and(
        eq(feePayments.paymentStatus, 'completed'),
        eq(sql`DATE(${feePayments.paymentDate})`, todayString)
      ));
    const todayRevenue = Number(todayRevenueResult[0]?.total) || 0;

    // 15. Monthly Revenue
    const monthlyRevenueResult = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${feePayments.amount}), 0)` 
      })
      .from(feePayments)
      .where(and(
        eq(feePayments.paymentStatus, 'completed'),
        gte(feePayments.paymentDate, monthStart),
        lte(feePayments.paymentDate, monthEnd)
      ));
    const monthlyRevenue = Number(monthlyRevenueResult[0]?.total) || 0;

    // 16. Today's Fee Receipts - Student names and amounts
    const todayReceiptsData = await db
      .select({
        paymentId: feePayments.id,
        amount: feePayments.amount,
        paymentDate: feePayments.paymentDate,
        invoiceId: feePayments.invoiceId,
        studentId: feeInvoices.studentId,
        fullName: users.fullName,
        admissionNumber: students.admissionNumber,
      })
      .from(feePayments)
      .innerJoin(feeInvoices, eq(feePayments.invoiceId, feeInvoices.id))
      .innerJoin(students, eq(feeInvoices.studentId, students.id))
      .innerJoin(users, eq(students.userId, users.id))
      .where(and(
        eq(feePayments.paymentStatus, 'completed'),
        eq(sql`DATE(${feePayments.paymentDate})`, todayString)
      ));

    const todayFeeReceipts = todayReceiptsData.map(r => ({
      studentName: r.fullName,
      admissionNumber: r.admissionNumber,
      amount: r.amount,
      paymentDate: r.paymentDate,
    }));

    // Get current academic year info
    const currentAcademicYearResult = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.isCurrent, true))
      .limit(1);
    
    const currentAcademicYear = currentAcademicYearResult.length > 0 
      ? {
          id: currentAcademicYearResult[0].id,
          yearName: currentAcademicYearResult[0].yearName,
          startDate: currentAcademicYearResult[0].startDate,
          endDate: currentAcademicYearResult[0].endDate
        }
      : null;

    // Return comprehensive dashboard statistics
    return NextResponse.json({
      students: {
        total: totalStudents,
        presentToday: presentToday,
        absentToday: absentToday,
        unmarkedToday: unmarkedToday,
        irregular: irregularStudents,
        regular: regularStudents,
      },
      fees: {
        fullyPaid: feesFullyPaid,
        unpaid: feesUnpaid,
        partial: feesPartial,
      },
      staff: {
        total: totalStaff,
        presentToday: staffPresentToday,
        absentToday: staffAbsentToday,
        unmarkedToday: staffUnmarked,
      },
      revenue: {
        today: todayRevenue,
        monthly: monthlyRevenue,
      },
      todayFeeReceipts: todayFeeReceipts,
      academicYear: currentAcademicYear,
      generatedAt: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error('GET dashboard stats error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}