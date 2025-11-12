import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feeConcessions, students, users } from '@/db/schema';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(feeConcessions)
        .where(eq(feeConcessions.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ 
          error: 'Fee concession not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with filters, pagination, and sorting
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const studentId = searchParams.get('studentId');
    const concessionType = searchParams.get('concessionType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sort = searchParams.get('sort') ?? 'createdAt';
    const order = searchParams.get('order') ?? 'desc';

    let query = db.select().from(feeConcessions);

    // Build where conditions
    const conditions = [];

    if (studentId) {
      if (isNaN(parseInt(studentId))) {
        return NextResponse.json({ 
          error: "Valid student ID is required",
          code: "INVALID_STUDENT_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(feeConcessions.studentId, parseInt(studentId)));
    }

    if (concessionType) {
      conditions.push(eq(feeConcessions.concessionType, concessionType));
    }

    if (startDate) {
      conditions.push(gte(feeConcessions.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(feeConcessions.createdAt, endDate));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sort === 'createdAt' ? feeConcessions.createdAt : feeConcessions.createdAt;
    query = query.orderBy(order === 'asc' ? asc(sortColumn) : desc(sortColumn));

    // Apply pagination
    const results = await query.limit(limit).offset(offset);

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

    // Extract and validate required fields
    const { 
      studentId, 
      concessionType, 
      concessionPercentage, 
      amountWaived, 
      reason,
      approvedBy,
      approvedAt
    } = body;

    // Validate required fields
    if (!studentId) {
      return NextResponse.json({ 
        error: "Student ID is required",
        code: "MISSING_STUDENT_ID" 
      }, { status: 400 });
    }

    if (!concessionType || !concessionType.trim()) {
      return NextResponse.json({ 
        error: "Concession type is required",
        code: "MISSING_CONCESSION_TYPE" 
      }, { status: 400 });
    }

    if (concessionPercentage === undefined || concessionPercentage === null) {
      return NextResponse.json({ 
        error: "Concession percentage is required",
        code: "MISSING_CONCESSION_PERCENTAGE" 
      }, { status: 400 });
    }

    if (amountWaived === undefined || amountWaived === null) {
      return NextResponse.json({ 
        error: "Amount waived is required",
        code: "MISSING_AMOUNT_WAIVED" 
      }, { status: 400 });
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ 
        error: "Reason is required",
        code: "MISSING_REASON" 
      }, { status: 400 });
    }

    // Validate numeric values
    if (isNaN(parseInt(studentId))) {
      return NextResponse.json({ 
        error: "Valid student ID is required",
        code: "INVALID_STUDENT_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseFloat(concessionPercentage))) {
      return NextResponse.json({ 
        error: "Valid concession percentage is required",
        code: "INVALID_CONCESSION_PERCENTAGE" 
      }, { status: 400 });
    }

    if (isNaN(parseFloat(amountWaived))) {
      return NextResponse.json({ 
        error: "Valid amount waived is required",
        code: "INVALID_AMOUNT_WAIVED" 
      }, { status: 400 });
    }

    // Validate percentage range
    const percentage = parseFloat(concessionPercentage);
    if (percentage < 0 || percentage > 100) {
      return NextResponse.json({ 
        error: "Concession percentage must be between 0 and 100",
        code: "INVALID_PERCENTAGE_RANGE" 
      }, { status: 400 });
    }

    // Validate amount is positive
    const amount = parseFloat(amountWaived);
    if (amount < 0) {
      return NextResponse.json({ 
        error: "Amount waived must be a positive number",
        code: "INVALID_AMOUNT" 
      }, { status: 400 });
    }

    // Validate student exists
    const student = await db.select()
      .from(students)
      .where(eq(students.id, parseInt(studentId)))
      .limit(1);

    if (student.length === 0) {
      return NextResponse.json({ 
        error: "Student not found",
        code: "STUDENT_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate approvedBy exists if provided
    if (approvedBy) {
      if (isNaN(parseInt(approvedBy))) {
        return NextResponse.json({ 
          error: "Valid approver ID is required",
          code: "INVALID_APPROVER_ID" 
        }, { status: 400 });
      }

      const approver = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(approvedBy)))
        .limit(1);

      if (approver.length === 0) {
        return NextResponse.json({ 
          error: "Approver not found",
          code: "APPROVER_NOT_FOUND" 
        }, { status: 400 });
      }
    }

    // Prepare insert data
    const insertData: any = {
      studentId: parseInt(studentId),
      concessionType: concessionType.trim(),
      concessionPercentage: percentage,
      amountWaived: amount,
      reason: reason.trim(),
      createdAt: new Date().toISOString()
    };

    if (approvedBy) {
      insertData.approvedBy = parseInt(approvedBy);
    }

    if (approvedAt) {
      insertData.approvedAt = approvedAt;
    }

    // Insert into database
    const newRecord = await db.insert(feeConcessions)
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(feeConcessions)
      .where(eq(feeConcessions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Fee concession not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const updates: any = {};

    // Validate and prepare updates
    if (body.concessionType !== undefined) {
      if (!body.concessionType.trim()) {
        return NextResponse.json({ 
          error: "Concession type cannot be empty",
          code: "INVALID_CONCESSION_TYPE" 
        }, { status: 400 });
      }
      updates.concessionType = body.concessionType.trim();
    }

    if (body.concessionPercentage !== undefined) {
      const percentage = parseFloat(body.concessionPercentage);
      if (isNaN(percentage)) {
        return NextResponse.json({ 
          error: "Valid concession percentage is required",
          code: "INVALID_CONCESSION_PERCENTAGE" 
        }, { status: 400 });
      }
      if (percentage < 0 || percentage > 100) {
        return NextResponse.json({ 
          error: "Concession percentage must be between 0 and 100",
          code: "INVALID_PERCENTAGE_RANGE" 
        }, { status: 400 });
      }
      updates.concessionPercentage = percentage;
    }

    if (body.amountWaived !== undefined) {
      const amount = parseFloat(body.amountWaived);
      if (isNaN(amount)) {
        return NextResponse.json({ 
          error: "Valid amount waived is required",
          code: "INVALID_AMOUNT_WAIVED" 
        }, { status: 400 });
      }
      if (amount < 0) {
        return NextResponse.json({ 
          error: "Amount waived must be a positive number",
          code: "INVALID_AMOUNT" 
        }, { status: 400 });
      }
      updates.amountWaived = amount;
    }

    if (body.reason !== undefined) {
      if (!body.reason.trim()) {
        return NextResponse.json({ 
          error: "Reason cannot be empty",
          code: "INVALID_REASON" 
        }, { status: 400 });
      }
      updates.reason = body.reason.trim();
    }

    if (body.approvedBy !== undefined) {
      if (body.approvedBy === null) {
        updates.approvedBy = null;
      } else {
        if (isNaN(parseInt(body.approvedBy))) {
          return NextResponse.json({ 
            error: "Valid approver ID is required",
            code: "INVALID_APPROVER_ID" 
          }, { status: 400 });
        }

        const approver = await db.select()
          .from(users)
          .where(eq(users.id, parseInt(body.approvedBy)))
          .limit(1);

        if (approver.length === 0) {
          return NextResponse.json({ 
            error: "Approver not found",
            code: "APPROVER_NOT_FOUND" 
          }, { status: 400 });
        }
        updates.approvedBy = parseInt(body.approvedBy);
      }
    }

    if (body.approvedAt !== undefined) {
      updates.approvedAt = body.approvedAt;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update",
        code: "NO_UPDATES" 
      }, { status: 400 });
    }

    // Perform update
    const updated = await db.update(feeConcessions)
      .set(updates)
      .where(eq(feeConcessions.id, parseInt(id)))
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(feeConcessions)
      .where(eq(feeConcessions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Fee concession not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete the record
    const deleted = await db.delete(feeConcessions)
      .where(eq(feeConcessions.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Fee concession deleted successfully',
      deleted: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}