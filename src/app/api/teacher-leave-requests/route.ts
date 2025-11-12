import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teacherLeaveRequests, teachers, users } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const teacherId = searchParams.get('teacherId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Validate status if provided
    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({
        error: 'Invalid status. Must be one of: pending, approved, rejected',
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    // Validate teacherId if provided
    if (teacherId && isNaN(parseInt(teacherId))) {
      return NextResponse.json({
        error: 'Invalid teacher ID',
        code: 'INVALID_TEACHER_ID'
      }, { status: 400 });
    }

    // Single record fetch
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const record = await db.select()
        .from(teacherLeaveRequests)
        .where(eq(teacherLeaveRequests.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({
          error: 'Leave request not found',
          code: 'NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // Build query with filters
    let query = db.select().from(teacherLeaveRequests);
    const conditions = [];

    if (teacherId) {
      conditions.push(eq(teacherLeaveRequests.teacherId, parseInt(teacherId)));
    }

    if (status) {
      conditions.push(eq(teacherLeaveRequests.status, status));
    }

    if (startDate) {
      conditions.push(gte(teacherLeaveRequests.startDate, startDate));
    }

    if (endDate) {
      conditions.push(lte(teacherLeaveRequests.endDate, endDate));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(teacherLeaveRequests.requestedAt))
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
    const { teacherId, startDate, endDate, reason } = body;

    // Validate required fields
    if (!teacherId) {
      return NextResponse.json({
        error: 'Teacher ID is required',
        code: 'MISSING_TEACHER_ID'
      }, { status: 400 });
    }

    if (!startDate) {
      return NextResponse.json({
        error: 'Start date is required',
        code: 'MISSING_START_DATE'
      }, { status: 400 });
    }

    if (!endDate) {
      return NextResponse.json({
        error: 'End date is required',
        code: 'MISSING_END_DATE'
      }, { status: 400 });
    }

    if (!reason || reason.trim() === '') {
      return NextResponse.json({
        error: 'Reason is required',
        code: 'MISSING_REASON'
      }, { status: 400 });
    }

    // Validate teacherId is valid integer
    if (isNaN(parseInt(teacherId))) {
      return NextResponse.json({
        error: 'Invalid teacher ID',
        code: 'INVALID_TEACHER_ID'
      }, { status: 400 });
    }

    // Validate teacher exists
    const teacher = await db.select()
      .from(teachers)
      .where(eq(teachers.id, parseInt(teacherId)))
      .limit(1);

    if (teacher.length === 0) {
      return NextResponse.json({
        error: 'Teacher not found',
        code: 'TEACHER_NOT_FOUND'
      }, { status: 400 });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      return NextResponse.json({
        error: 'Invalid start date format',
        code: 'INVALID_START_DATE'
      }, { status: 400 });
    }

    if (isNaN(end.getTime())) {
      return NextResponse.json({
        error: 'Invalid end date format',
        code: 'INVALID_END_DATE'
      }, { status: 400 });
    }

    if (end < start) {
      return NextResponse.json({
        error: 'End date must be after or equal to start date',
        code: 'INVALID_DATE_RANGE'
      }, { status: 400 });
    }

    // Create leave request
    const newLeaveRequest = await db.insert(teacherLeaveRequests)
      .values({
        teacherId: parseInt(teacherId),
        startDate: startDate,
        endDate: endDate,
        reason: reason.trim(),
        status: 'pending',
        requestedAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newLeaveRequest[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const { status, reviewedBy, startDate, endDate, reason } = body;

    // Check if record exists
    const existing = await db.select()
      .from(teacherLeaveRequests)
      .where(eq(teacherLeaveRequests.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({
        error: 'Leave request not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // Build update object
    const updates: any = {};

    // Validate and add status update
    if (status !== undefined) {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return NextResponse.json({
          error: 'Invalid status. Must be one of: pending, approved, rejected',
          code: 'INVALID_STATUS'
        }, { status: 400 });
      }
      updates.status = status;

      // If approving or rejecting, set reviewedAt and require reviewedBy
      if (status === 'approved' || status === 'rejected') {
        if (!reviewedBy) {
          return NextResponse.json({
            error: 'Reviewer ID is required when approving or rejecting',
            code: 'MISSING_REVIEWER'
          }, { status: 400 });
        }

        if (isNaN(parseInt(reviewedBy))) {
          return NextResponse.json({
            error: 'Invalid reviewer ID',
            code: 'INVALID_REVIEWER_ID'
          }, { status: 400 });
        }

        // Validate reviewer exists
        const reviewer = await db.select()
          .from(users)
          .where(eq(users.id, parseInt(reviewedBy)))
          .limit(1);

        if (reviewer.length === 0) {
          return NextResponse.json({
            error: 'Reviewer not found',
            code: 'REVIEWER_NOT_FOUND'
          }, { status: 400 });
        }

        updates.reviewedBy = parseInt(reviewedBy);
        updates.reviewedAt = new Date().toISOString();
      }
    }

    // Validate and add reviewedBy if provided separately
    if (reviewedBy !== undefined && !updates.reviewedBy) {
      if (isNaN(parseInt(reviewedBy))) {
        return NextResponse.json({
          error: 'Invalid reviewer ID',
          code: 'INVALID_REVIEWER_ID'
        }, { status: 400 });
      }

      const reviewer = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(reviewedBy)))
        .limit(1);

      if (reviewer.length === 0) {
        return NextResponse.json({
          error: 'Reviewer not found',
          code: 'REVIEWER_NOT_FOUND'
        }, { status: 400 });
      }

      updates.reviewedBy = parseInt(reviewedBy);
    }

    // Validate and add date updates
    if (startDate !== undefined || endDate !== undefined) {
      const newStartDate = startDate || existing[0].startDate;
      const newEndDate = endDate || existing[0].endDate;

      const start = new Date(newStartDate);
      const end = new Date(newEndDate);

      if (isNaN(start.getTime())) {
        return NextResponse.json({
          error: 'Invalid start date format',
          code: 'INVALID_START_DATE'
        }, { status: 400 });
      }

      if (isNaN(end.getTime())) {
        return NextResponse.json({
          error: 'Invalid end date format',
          code: 'INVALID_END_DATE'
        }, { status: 400 });
      }

      if (end < start) {
        return NextResponse.json({
          error: 'End date must be after or equal to start date',
          code: 'INVALID_DATE_RANGE'
        }, { status: 400 });
      }

      if (startDate !== undefined) updates.startDate = startDate;
      if (endDate !== undefined) updates.endDate = endDate;
    }

    // Add reason if provided
    if (reason !== undefined) {
      if (reason.trim() === '') {
        return NextResponse.json({
          error: 'Reason cannot be empty',
          code: 'EMPTY_REASON'
        }, { status: 400 });
      }
      updates.reason = reason.trim();
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        error: 'No valid fields to update',
        code: 'NO_UPDATES'
      }, { status: 400 });
    }

    // Perform update
    const updated = await db.update(teacherLeaveRequests)
      .set(updates)
      .where(eq(teacherLeaveRequests.id, parseInt(id)))
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(teacherLeaveRequests)
      .where(eq(teacherLeaveRequests.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({
        error: 'Leave request not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // Only allow deletion of pending requests
    if (existing[0].status !== 'pending') {
      return NextResponse.json({
        error: 'Cannot delete leave request that has been approved or rejected',
        code: 'CANNOT_DELETE_PROCESSED_REQUEST'
      }, { status: 400 });
    }

    // Delete the record
    const deleted = await db.delete(teacherLeaveRequests)
      .where(eq(teacherLeaveRequests.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Leave request deleted successfully',
      deletedRecord: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}