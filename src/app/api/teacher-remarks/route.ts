import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teacherRemarks, teachers, students } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

const VALID_REMARK_TYPES = ['positive', 'neutral', 'negative'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const teacherId = searchParams.get('teacherId');
    const studentId = searchParams.get('studentId');
    const remarkType = searchParams.get('remarkType');
    const date = searchParams.get('date');
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
      if (isNaN(parseInt(id))) {
        return NextResponse.json({
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const record = await db.select()
        .from(teacherRemarks)
        .where(eq(teacherRemarks.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({
          error: 'Teacher remark not found',
          code: 'REMARK_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // Build query with filters
    const conditions = [];

    // Filter by teacherId
    if (teacherId) {
      const parsedTeacherId = parseInt(teacherId);
      if (isNaN(parsedTeacherId)) {
        return NextResponse.json({
          error: 'Invalid teacherId parameter',
          code: 'INVALID_TEACHER_ID'
        }, { status: 400 });
      }
      conditions.push(eq(teacherRemarks.teacherId, parsedTeacherId));
    }

    // Filter by studentId
    if (studentId) {
      const parsedStudentId = parseInt(studentId);
      if (isNaN(parsedStudentId)) {
        return NextResponse.json({
          error: 'Invalid studentId parameter',
          code: 'INVALID_STUDENT_ID'
        }, { status: 400 });
      }
      conditions.push(eq(teacherRemarks.studentId, parsedStudentId));
    }

    // Filter by remarkType
    if (remarkType) {
      if (!VALID_REMARK_TYPES.includes(remarkType as any)) {
        return NextResponse.json({
          error: 'Invalid remarkType. Must be one of: positive, neutral, negative',
          code: 'INVALID_REMARK_TYPE'
        }, { status: 400 });
      }
      conditions.push(eq(teacherRemarks.remarkType, remarkType));
    }

    // Filter by specific date
    if (date) {
      conditions.push(eq(teacherRemarks.date, date));
    }

    // Filter by date range
    if (startDate) {
      conditions.push(gte(teacherRemarks.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(teacherRemarks.date, endDate));
    }

    let query = db.select().from(teacherRemarks);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(teacherRemarks.date), desc(teacherRemarks.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherId, studentId, remarkText, remarkType, date, subjectId } = body;

    // Validate required fields
    if (!teacherId) {
      return NextResponse.json({
        error: 'teacherId is required',
        code: 'MISSING_TEACHER_ID'
      }, { status: 400 });
    }

    if (!studentId) {
      return NextResponse.json({
        error: 'studentId is required',
        code: 'MISSING_STUDENT_ID'
      }, { status: 400 });
    }

    if (!remarkText || remarkText.trim() === '') {
      return NextResponse.json({
        error: 'remarkText is required and cannot be empty',
        code: 'MISSING_REMARK_TEXT'
      }, { status: 400 });
    }

    if (!remarkType) {
      return NextResponse.json({
        error: 'remarkType is required',
        code: 'MISSING_REMARK_TYPE'
      }, { status: 400 });
    }

    // Validate IDs are integers
    if (isNaN(parseInt(teacherId))) {
      return NextResponse.json({
        error: 'teacherId must be a valid integer',
        code: 'INVALID_TEACHER_ID'
      }, { status: 400 });
    }

    if (isNaN(parseInt(studentId))) {
      return NextResponse.json({
        error: 'studentId must be a valid integer',
        code: 'INVALID_STUDENT_ID'
      }, { status: 400 });
    }

    // Validate remarkType
    if (!VALID_REMARK_TYPES.includes(remarkType)) {
      return NextResponse.json({
        error: 'remarkType must be one of: positive, neutral, negative',
        code: 'INVALID_REMARK_TYPE'
      }, { status: 400 });
    }

    // Validate teacher exists
    const teacherExists = await db.select()
      .from(teachers)
      .where(eq(teachers.id, parseInt(teacherId)))
      .limit(1);

    if (teacherExists.length === 0) {
      return NextResponse.json({
        error: 'Teacher not found',
        code: 'TEACHER_NOT_FOUND'
      }, { status: 400 });
    }

    // Validate student exists
    const studentExists = await db.select()
      .from(students)
      .where(eq(students.id, parseInt(studentId)))
      .limit(1);

    if (studentExists.length === 0) {
      return NextResponse.json({
        error: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData: any = {
      teacherId: parseInt(teacherId),
      studentId: parseInt(studentId),
      remarkText: remarkText.trim(),
      remarkType,
      date: date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    // Add subjectId if provided
    if (subjectId !== undefined && subjectId !== null) {
      insertData.subjectId = parseInt(subjectId);
    }

    // Create the remark
    const newRemark = await db.insert(teacherRemarks)
      .values(insertData)
      .returning();

    return NextResponse.json(newRemark[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
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
    const { remarkText, remarkType, date, subjectId } = body;

    // Check if record exists
    const existingRecord = await db.select()
      .from(teacherRemarks)
      .where(eq(teacherRemarks.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({
        error: 'Teacher remark not found',
        code: 'REMARK_NOT_FOUND'
      }, { status: 404 });
    }

    // Validate remarkText if provided
    if (remarkText !== undefined && remarkText.trim() === '') {
      return NextResponse.json({
        error: 'remarkText cannot be empty',
        code: 'INVALID_REMARK_TEXT'
      }, { status: 400 });
    }

    // Validate remarkType if provided
    if (remarkType !== undefined && !VALID_REMARK_TYPES.includes(remarkType)) {
      return NextResponse.json({
        error: 'remarkType must be one of: positive, neutral, negative',
        code: 'INVALID_REMARK_TYPE'
      }, { status: 400 });
    }

    // Build update object
    const updateData: any = {};

    if (remarkText !== undefined) {
      updateData.remarkText = remarkText.trim();
    }

    if (remarkType !== undefined) {
      updateData.remarkType = remarkType;
    }

    if (date !== undefined) {
      updateData.date = date;
    }

    if (subjectId !== undefined) {
      updateData.subjectId = subjectId !== null ? parseInt(subjectId) : null;
    }

    // Perform update
    const updated = await db.update(teacherRemarks)
      .set(updateData)
      .where(eq(teacherRemarks.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
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
    const existingRecord = await db.select()
      .from(teacherRemarks)
      .where(eq(teacherRemarks.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({
        error: 'Teacher remark not found',
        code: 'REMARK_NOT_FOUND'
      }, { status: 404 });
    }

    // Perform delete
    const deleted = await db.delete(teacherRemarks)
      .where(eq(teacherRemarks.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Teacher remark deleted successfully',
      deletedRecord: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}