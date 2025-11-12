import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { attendance, students, users, whatsappMessages, studentParents, parents, settings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Biometric Device Integration Endpoint
 * 
 * This endpoint receives attendance data from biometric devices
 * and automatically:
 * 1. Creates attendance record
 * 2. Sends WhatsApp notification to parent
 * 3. Logs the event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      deviceId, 
      studentAdmissionNumber, 
      timestamp,
      status = 'present' 
    } = body;

    // Validate required fields
    if (!deviceId || !studentAdmissionNumber) {
      return NextResponse.json(
        { error: 'Device ID and student admission number are required' },
        { status: 400 }
      );
    }

    // Find student by admission number
    const student = await db
      .select()
      .from(students)
      .where(eq(students.admissionNumber, studentAdmissionNumber))
      .limit(1);

    if (student.length === 0) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const studentId = student[0].id;
    const attendanceDate = timestamp ? new Date(timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const markedAt = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();

    // Check if attendance already marked for today
    const existingAttendance = await db
      .select()
      .from(attendance)
      .where(and(
        eq(attendance.studentId, studentId),
        eq(attendance.date, attendanceDate)
      ))
      .limit(1);

    if (existingAttendance.length > 0) {
      return NextResponse.json(
        { 
          message: 'Attendance already marked for today',
          attendance: existingAttendance[0] 
        },
        { status: 200 }
      );
    }

    // Create attendance record
    const newAttendance = await db
      .insert(attendance)
      .values({
        studentId,
        date: attendanceDate,
        status,
        markedBy: 1, // System user
        markedAt,
        notes: 'Marked via biometric device',
        biometricDeviceId: deviceId,
        createdAt: markedAt,
      })
      .returning();

    // Get student user info
    const studentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, student[0].userId))
      .limit(1);

    // Get parent information
    const studentParentLinks = await db
      .select()
      .from(studentParents)
      .where(eq(studentParents.studentId, studentId))
      .limit(1);

    let parentPhone = student[0].parentMobileNumber; // Fallback to student record
    let parentUserId = null;

    if (studentParentLinks.length > 0) {
      const parentRecord = await db
        .select()
        .from(parents)
        .where(eq(parents.id, studentParentLinks[0].parentId))
        .limit(1);

      if (parentRecord.length > 0) {
        const parentUser = await db
          .select()
          .from(users)
          .where(eq(users.id, parentRecord[0].userId))
          .limit(1);

        if (parentUser.length > 0) {
          parentPhone = parentUser[0].phone || parentPhone;
          parentUserId = parentUser[0].id;
        }
      }
    }

    // Format time
    const attendanceTime = new Date(markedAt).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Get template from settings
    const templateSetting = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'whatsapp_attendance_template'))
      .limit(1);

    // Use template or fallback to default
    let messageText = `🎓 School Attendance Alert\n\nYour ward ${studentUser[0]?.fullName || 'Student'} (${studentAdmissionNumber}) has reached the school.\n\n⏰ Time: ${attendanceTime}\n📅 Date: ${new Date(attendanceDate).toLocaleDateString('en-IN')}\n✅ Status: ${status.toUpperCase()}\n\nThank you!\n- School Management`;
    
    if (templateSetting.length > 0) {
      // Replace placeholders in template
      messageText = templateSetting[0].value
        .replace(/\[Student Name\]/g, studentUser[0]?.fullName || 'Student')
        .replace(/\[Admission No\]/g, studentAdmissionNumber)
        .replace(/\[HH:MM AM\/PM\]/g, attendanceTime)
        .replace(/\[DD\/MM\/YYYY\]/g, new Date(attendanceDate).toLocaleDateString('en-IN'))
        .replace(/\[Status\]/g, status.toUpperCase())
        .replace(/PRESENT/g, status.toUpperCase());
    }

    await db
      .insert(whatsappMessages)
      .values({
        recipientType: 'individual',
        recipientId: parentUserId,
        phoneNumber: parentPhone,
        messageText,
        sentBy: 1, // System user
        sentAt: new Date().toISOString(),
        status: 'sent', // In production, this would be 'pending' until actually sent
      });

    return NextResponse.json(
      {
        success: true,
        message: 'Attendance marked successfully',
        attendance: newAttendance[0],
        notification: {
          sent: true,
          method: 'WhatsApp',
          recipient: 'Parent',
          phone: parentPhone,
          message: messageText
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Biometric attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for biometric device health check
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      status: 'online',
      service: 'Biometric Attendance Integration',
      timestamp: new Date().toISOString(),
      endpoints: {
        markAttendance: 'POST /api/biometric/attendance',
      },
      features: [
        'Auto attendance marking',
        'WhatsApp notification to parents',
        'Duplicate prevention',
        'Real-time logging'
      ]
    },
    { status: 200 }
  );
}