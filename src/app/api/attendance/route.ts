import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { attendance, students, users } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

const VALID_STATUSES = ['present', 'absent', 'late', 'half_day'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const record = await db
        .select({
          id: attendance.id,
          studentId: attendance.studentId,
          date: attendance.date,
          status: attendance.status,
          markedBy: attendance.markedBy,
          markedAt: attendance.markedAt,
          notes: attendance.notes,
          biometricDeviceId: attendance.biometricDeviceId,
          createdAt: attendance.createdAt,
          studentName: users.fullName,
          admissionNumber: students.admissionNumber,
          rollNumber: students.rollNumber,
        })
        .from(attendance)
        .leftJoin(students, eq(attendance.studentId, students.id))
        .leftJoin(users, eq(students.userId, users.id))
        .where(eq(attendance.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          { error: 'Attendance record not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with filters and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const studentId = searchParams.get('studentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    let query = db
      .select({
        id: attendance.id,
        studentId: attendance.studentId,
        date: attendance.date,
        status: attendance.status,
        markedBy: attendance.markedBy,
        markedAt: attendance.markedAt,
        notes: attendance.notes,
        biometricDeviceId: attendance.biometricDeviceId,
        createdAt: attendance.createdAt,
        studentName: users.fullName,
        admissionNumber: students.admissionNumber,
        rollNumber: students.rollNumber,
      })
      .from(attendance)
      .leftJoin(students, eq(attendance.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id));
    
    const conditions = [];

    // Filter by studentId
    if (studentId) {
      const studentIdInt = parseInt(studentId);
      if (isNaN(studentIdInt)) {
        return NextResponse.json(
          { error: 'Valid student ID is required', code: 'INVALID_STUDENT_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(attendance.studentId, studentIdInt));
    }

    // Filter by date range
    if (startDate) {
      conditions.push(gte(attendance.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(attendance.date, endDate));
    }

    // Filter by status
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        );
      }
      conditions.push(eq(attendance.status, status));
    }

    // Apply conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query
      .orderBy(desc(attendance.date), desc(attendance.markedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, date, status, markedBy, notes, biometricDeviceId } = body;

    // Validate required fields
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required', code: 'MISSING_STUDENT_ID' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required', code: 'MISSING_DATE' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required', code: 'MISSING_STATUS' },
        { status: 400 }
      );
    }

    if (!markedBy) {
      return NextResponse.json(
        { error: 'Marked by user ID is required', code: 'MISSING_MARKED_BY' },
        { status: 400 }
      );
    }

    // Validate status value
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Validate studentId is a number
    const studentIdInt = parseInt(studentId);
    if (isNaN(studentIdInt)) {
      return NextResponse.json(
        { error: 'Student ID must be a valid number', code: 'INVALID_STUDENT_ID' },
        { status: 400 }
      );
    }

    // Validate markedBy is a number
    const markedByInt = parseInt(markedBy);
    if (isNaN(markedByInt)) {
      return NextResponse.json(
        { error: 'Marked by user ID must be a valid number', code: 'INVALID_MARKED_BY' },
        { status: 400 }
      );
    }

    // Validate student exists
    const studentExists = await db
      .select()
      .from(students)
      .where(eq(students.id, studentIdInt))
      .limit(1);

    if (studentExists.length === 0) {
      return NextResponse.json(
        { error: 'Student not found', code: 'STUDENT_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Validate markedBy user exists
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, markedByInt))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'Marked by user not found', code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Create attendance record
    const currentTimestamp = new Date().toISOString();
    const newAttendance = await db
      .insert(attendance)
      .values({
        studentId: studentIdInt,
        date: date.trim(),
        status: status.trim(),
        markedBy: markedByInt,
        markedAt: currentTimestamp,
        notes: notes ? notes.trim() : null,
        biometricDeviceId: biometricDeviceId ? biometricDeviceId.trim() : null,
        createdAt: currentTimestamp,
      })
      .returning();

    return NextResponse.json(newAttendance[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const attendanceId = parseInt(id);

    // Check if record exists
    const existingRecord = await db
      .select()
      .from(attendance)
      .where(eq(attendance.id, attendanceId))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Attendance record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { studentId, date, status, markedBy, notes, biometricDeviceId } = body;

    const updates: Record<string, any> = {};

    // Validate and update studentId if provided
    if (studentId !== undefined) {
      const studentIdInt = parseInt(studentId);
      if (isNaN(studentIdInt)) {
        return NextResponse.json(
          { error: 'Student ID must be a valid number', code: 'INVALID_STUDENT_ID' },
          { status: 400 }
        );
      }

      // Validate student exists
      const studentExists = await db
        .select()
        .from(students)
        .where(eq(students.id, studentIdInt))
        .limit(1);

      if (studentExists.length === 0) {
        return NextResponse.json(
          { error: 'Student not found', code: 'STUDENT_NOT_FOUND' },
          { status: 400 }
        );
      }

      updates.studentId = studentIdInt;
    }

    // Update date if provided
    if (date !== undefined) {
      updates.date = date.trim();
    }

    // Validate and update status if provided
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        );
      }
      updates.status = status.trim();
    }

    // Validate and update markedBy if provided
    if (markedBy !== undefined) {
      const markedByInt = parseInt(markedBy);
      if (isNaN(markedByInt)) {
        return NextResponse.json(
          { error: 'Marked by user ID must be a valid number', code: 'INVALID_MARKED_BY' },
          { status: 400 }
        );
      }

      // Validate user exists
      const userExists = await db
        .select()
        .from(users)
        .where(eq(users.id, markedByInt))
        .limit(1);

      if (userExists.length === 0) {
        return NextResponse.json(
          { error: 'Marked by user not found', code: 'USER_NOT_FOUND' },
          { status: 400 }
        );
      }

      updates.markedBy = markedByInt;
      updates.markedAt = new Date().toISOString();
    }

    // Update notes if provided
    if (notes !== undefined) {
      updates.notes = notes ? notes.trim() : null;
    }

    // Update biometricDeviceId if provided
    if (biometricDeviceId !== undefined) {
      updates.biometricDeviceId = biometricDeviceId ? biometricDeviceId.trim() : null;
    }

    // If no updates provided
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update', code: 'NO_UPDATES' },
        { status: 400 }
      );
    }

    const updated = await db
      .update(attendance)
      .set(updates)
      .where(eq(attendance.id, attendanceId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const attendanceId = parseInt(id);

    // Check if record exists
    const existingRecord = await db
      .select()
      .from(attendance)
      .where(eq(attendance.id, attendanceId))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Attendance record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(attendance)
      .where(eq(attendance.id, attendanceId))
      .returning();

    return NextResponse.json(
      {
        message: 'Attendance record deleted successfully',
        deleted: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}