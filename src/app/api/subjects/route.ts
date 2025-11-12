import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subjects, classes, teachers } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const classId = searchParams.get('classId');
    const teacherId = searchParams.get('teacherId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single record by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const subject = await db.select()
        .from(subjects)
        .where(eq(subjects.id, parseInt(id)))
        .limit(1);

      if (subject.length === 0) {
        return NextResponse.json({ 
          error: 'Subject not found',
          code: 'SUBJECT_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(subject[0], { status: 200 });
    }

    // List with filters
    let query = db.select().from(subjects);
    const conditions = [];

    if (classId) {
      if (isNaN(parseInt(classId))) {
        return NextResponse.json({ 
          error: 'Valid classId is required',
          code: 'INVALID_CLASS_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(subjects.classId, parseInt(classId)));
    }

    if (teacherId) {
      if (isNaN(parseInt(teacherId))) {
        return NextResponse.json({ 
          error: 'Valid teacherId is required',
          code: 'INVALID_TEACHER_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(subjects.teacherId, parseInt(teacherId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

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
    const { subjectName, subjectCode, classId, teacherId } = body;

    // Validate required fields
    if (!subjectName) {
      return NextResponse.json({ 
        error: 'Subject name is required',
        code: 'MISSING_SUBJECT_NAME' 
      }, { status: 400 });
    }

    if (!subjectCode) {
      return NextResponse.json({ 
        error: 'Subject code is required',
        code: 'MISSING_SUBJECT_CODE' 
      }, { status: 400 });
    }

    if (!classId) {
      return NextResponse.json({ 
        error: 'Class ID is required',
        code: 'MISSING_CLASS_ID' 
      }, { status: 400 });
    }

    if (!teacherId) {
      return NextResponse.json({ 
        error: 'Teacher ID is required',
        code: 'MISSING_TEACHER_ID' 
      }, { status: 400 });
    }

    // Validate IDs are valid integers
    if (isNaN(parseInt(classId))) {
      return NextResponse.json({ 
        error: 'Valid class ID is required',
        code: 'INVALID_CLASS_ID' 
      }, { status: 400 });
    }

    if (isNaN(parseInt(teacherId))) {
      return NextResponse.json({ 
        error: 'Valid teacher ID is required',
        code: 'INVALID_TEACHER_ID' 
      }, { status: 400 });
    }

    // Validate subjectCode is unique
    const existingSubjectCode = await db.select()
      .from(subjects)
      .where(eq(subjects.subjectCode, subjectCode.trim()))
      .limit(1);

    if (existingSubjectCode.length > 0) {
      return NextResponse.json({ 
        error: 'Subject code already exists',
        code: 'DUPLICATE_SUBJECT_CODE' 
      }, { status: 400 });
    }

    // Validate classId exists
    const classExists = await db.select()
      .from(classes)
      .where(eq(classes.id, parseInt(classId)))
      .limit(1);

    if (classExists.length === 0) {
      return NextResponse.json({ 
        error: 'Class not found',
        code: 'CLASS_NOT_FOUND' 
      }, { status: 400 });
    }

    // Validate teacherId exists
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

    // Create new subject
    const newSubject = await db.insert(subjects)
      .values({
        subjectName: subjectName.trim(),
        subjectCode: subjectCode.trim(),
        classId: parseInt(classId),
        teacherId: parseInt(teacherId),
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newSubject[0], { status: 201 });
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

    // Check if subject exists
    const existingSubject = await db.select()
      .from(subjects)
      .where(eq(subjects.id, parseInt(id)))
      .limit(1);

    if (existingSubject.length === 0) {
      return NextResponse.json({ 
        error: 'Subject not found',
        code: 'SUBJECT_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { subjectName, subjectCode, classId, teacherId } = body;
    const updates: any = {};

    // Validate and prepare updates
    if (subjectName !== undefined) {
      if (!subjectName.trim()) {
        return NextResponse.json({ 
          error: 'Subject name cannot be empty',
          code: 'INVALID_SUBJECT_NAME' 
        }, { status: 400 });
      }
      updates.subjectName = subjectName.trim();
    }

    if (subjectCode !== undefined) {
      if (!subjectCode.trim()) {
        return NextResponse.json({ 
          error: 'Subject code cannot be empty',
          code: 'INVALID_SUBJECT_CODE' 
        }, { status: 400 });
      }

      // Check if subjectCode is unique (excluding current subject)
      const existingCode = await db.select()
        .from(subjects)
        .where(eq(subjects.subjectCode, subjectCode.trim()))
        .limit(1);

      if (existingCode.length > 0 && existingCode[0].id !== parseInt(id)) {
        return NextResponse.json({ 
          error: 'Subject code already exists',
          code: 'DUPLICATE_SUBJECT_CODE' 
        }, { status: 400 });
      }

      updates.subjectCode = subjectCode.trim();
    }

    if (classId !== undefined) {
      if (isNaN(parseInt(classId))) {
        return NextResponse.json({ 
          error: 'Valid class ID is required',
          code: 'INVALID_CLASS_ID' 
        }, { status: 400 });
      }

      // Validate classId exists
      const classExists = await db.select()
        .from(classes)
        .where(eq(classes.id, parseInt(classId)))
        .limit(1);

      if (classExists.length === 0) {
        return NextResponse.json({ 
          error: 'Class not found',
          code: 'CLASS_NOT_FOUND' 
        }, { status: 400 });
      }

      updates.classId = parseInt(classId);
    }

    if (teacherId !== undefined) {
      if (isNaN(parseInt(teacherId))) {
        return NextResponse.json({ 
          error: 'Valid teacher ID is required',
          code: 'INVALID_TEACHER_ID' 
        }, { status: 400 });
      }

      // Validate teacherId exists
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

      updates.teacherId = parseInt(teacherId);
    }

    // If no fields to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existingSubject[0], { status: 200 });
    }

    // Update subject
    const updated = await db.update(subjects)
      .set(updates)
      .where(eq(subjects.id, parseInt(id)))
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

    // Check if subject exists
    const existingSubject = await db.select()
      .from(subjects)
      .where(eq(subjects.id, parseInt(id)))
      .limit(1);

    if (existingSubject.length === 0) {
      return NextResponse.json({ 
        error: 'Subject not found',
        code: 'SUBJECT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete subject
    const deleted = await db.delete(subjects)
      .where(eq(subjects.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Subject deleted successfully',
      subject: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}