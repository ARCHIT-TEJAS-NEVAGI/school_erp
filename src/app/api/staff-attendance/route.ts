import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { staffAttendance, teachers } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const teacherId = searchParams.get('teacherId');
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Validate limit and offset
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({
        error: 'Invalid limit parameter',
        code: 'INVALID_LIMIT'
      }, { status: 400 });
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({
        error: 'Invalid offset parameter',
        code: 'INVALID_OFFSET'
      }, { status: 400 });
    }

    // Single record fetch by ID
    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json({
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const record = await db.select()
        .from(staffAttendance)
        .where(eq(staffAttendance.id, parsedId))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({
          error: 'Staff attendance record not found',
          code: 'RECORD_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // Build query with filters
    let query = db.select().from(staffAttendance);
    const conditions = [];

    // Filter by teacherId
    if (teacherId) {
      const parsedTeacherId = parseInt(teacherId);
      if (isNaN(parsedTeacherId)) {
        return NextResponse.json({
          error: 'Valid teacher ID is required',
          code: 'INVALID_TEACHER_ID'
        }, { status: 400 });
      }
      conditions.push(eq(staffAttendance.teacherId, parsedTeacherId));
    }

    // Filter by specific date
    if (date) {
      conditions.push(eq(staffAttendance.date, date));
    }

    // Filter by status
    if (status) {
      conditions.push(eq(staffAttendance.status, status));
    }

    // Filter by date range
    if (startDate) {
      conditions.push(gte(staffAttendance.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(staffAttendance.date, endDate));
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply ordering and pagination
    const results = await query
      .orderBy(desc(staffAttendance.date))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherId, date, status, markedBy } = body;

    // Validate required fields
    if (!teacherId) {
      return NextResponse.json({
        error: 'Teacher ID is required',
        code: 'MISSING_TEACHER_ID'
      }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({
        error: 'Date is required',
        code: 'MISSING_DATE'
      }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({
        error: 'Status is required',
        code: 'MISSING_STATUS'
      }, { status: 400 });
    }

    // Validate teacherId is valid integer
    const parsedTeacherId = parseInt(teacherId);
    if (isNaN(parsedTeacherId)) {
      return NextResponse.json({
        error: 'Valid teacher ID is required',
        code: 'INVALID_TEACHER_ID'
      }, { status: 400 });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({
        error: 'Invalid date format. Must be YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT'
      }, { status: 400 });
    }

    // Validate status
    if (!['present', 'absent', 'late', 'half_day'].includes(status)) {
      return NextResponse.json({
        error: 'Invalid status. Must be one of: present, absent, late, half_day',
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    // Validate teacher exists
    const teacher = await db.select()
      .from(teachers)
      .where(eq(teachers.id, parsedTeacherId))
      .limit(1);

    if (teacher.length === 0) {
      return NextResponse.json({
        error: 'Teacher not found',
        code: 'TEACHER_NOT_FOUND'
      }, { status: 400 });
    }

    // Validate markedBy if provided
    if (markedBy !== undefined && markedBy !== null) {
      const parsedMarkedBy = parseInt(markedBy);
      if (isNaN(parsedMarkedBy)) {
        return NextResponse.json({
          error: 'Valid marked by user ID is required',
          code: 'INVALID_MARKED_BY'
        }, { status: 400 });
      }
    }

    // Prepare insert data
    const currentTimestamp = new Date().toISOString();
    const insertData: any = {
      teacherId: parsedTeacherId,
      date: date.trim(),
      status: status.trim(),
      createdAt: currentTimestamp
    };

    if (markedBy !== undefined && markedBy !== null) {
      insertData.markedBy = parseInt(markedBy);
    }

    // Create staff attendance record
    const newRecord = await db.insert(staffAttendance)
      .values(insertData)
      .returning();

    return NextResponse.json(newRecord[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const parsedId = parseInt(id);
    const body = await request.json();
    const { status, markedBy } = body;

    // Check if record exists
    const existingRecord = await db.select()
      .from(staffAttendance)
      .where(eq(staffAttendance.id, parsedId))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({
        error: 'Staff attendance record not found',
        code: 'RECORD_NOT_FOUND'
      }, { status: 404 });
    }

    // Validate status if provided
    if (status && !['present', 'absent', 'late', 'half_day'].includes(status)) {
      return NextResponse.json({
        error: 'Invalid status. Must be one of: present, absent, late, half_day',
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    // Validate markedBy if provided
    if (markedBy !== undefined && markedBy !== null) {
      const parsedMarkedBy = parseInt(markedBy);
      if (isNaN(parsedMarkedBy)) {
        return NextResponse.json({
          error: 'Valid marked by user ID is required',
          code: 'INVALID_MARKED_BY'
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status.trim();
    }

    if (markedBy !== undefined) {
      updateData.markedBy = markedBy === null ? null : parseInt(markedBy);
    }

    // Update record
    const updated = await db.update(staffAttendance)
      .set(updateData)
      .where(eq(staffAttendance.id, parsedId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const parsedId = parseInt(id);

    // Check if record exists
    const existingRecord = await db.select()
      .from(staffAttendance)
      .where(eq(staffAttendance.id, parsedId))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({
        error: 'Staff attendance record not found',
        code: 'RECORD_NOT_FOUND'
      }, { status: 404 });
    }

    // Delete record
    const deleted = await db.delete(staffAttendance)
      .where(eq(staffAttendance.id, parsedId))
      .returning();

    return NextResponse.json({
      message: 'Staff attendance record deleted successfully',
      record: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}