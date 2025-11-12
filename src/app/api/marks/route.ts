import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marks, students, subjects } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const mark = await db
        .select()
        .from(marks)
        .where(eq(marks.id, parseInt(id)))
        .limit(1);

      if (mark.length === 0) {
        return NextResponse.json(
          { error: 'Mark entry not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(mark[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const studentId = searchParams.get('studentId');
    const subjectId = searchParams.get('subjectId');
    const examType = searchParams.get('examType');

    let query = db.select().from(marks);

    // Build filters
    const filters = [];
    if (studentId) {
      if (isNaN(parseInt(studentId))) {
        return NextResponse.json(
          { error: 'Valid studentId is required', code: 'INVALID_STUDENT_ID' },
          { status: 400 }
        );
      }
      filters.push(eq(marks.studentId, parseInt(studentId)));
    }
    if (subjectId) {
      if (isNaN(parseInt(subjectId))) {
        return NextResponse.json(
          { error: 'Valid subjectId is required', code: 'INVALID_SUBJECT_ID' },
          { status: 400 }
        );
      }
      filters.push(eq(marks.subjectId, parseInt(subjectId)));
    }
    if (examType) {
      filters.push(eq(marks.examType, examType));
    }

    if (filters.length > 0) {
      query = query.where(and(...filters));
    }

    const results = await query
      .orderBy(desc(marks.examDate))
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
    const {
      studentId,
      subjectId,
      examType,
      marksObtained,
      totalMarks,
      examDate,
      remarks,
    } = body;

    // Validate required fields
    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId is required', code: 'MISSING_STUDENT_ID' },
        { status: 400 }
      );
    }
    if (!subjectId) {
      return NextResponse.json(
        { error: 'subjectId is required', code: 'MISSING_SUBJECT_ID' },
        { status: 400 }
      );
    }
    if (!examType || examType.trim() === '') {
      return NextResponse.json(
        { error: 'examType is required', code: 'MISSING_EXAM_TYPE' },
        { status: 400 }
      );
    }
    if (marksObtained === undefined || marksObtained === null) {
      return NextResponse.json(
        { error: 'marksObtained is required', code: 'MISSING_MARKS_OBTAINED' },
        { status: 400 }
      );
    }
    if (!totalMarks) {
      return NextResponse.json(
        { error: 'totalMarks is required', code: 'MISSING_TOTAL_MARKS' },
        { status: 400 }
      );
    }
    if (!examDate || examDate.trim() === '') {
      return NextResponse.json(
        { error: 'examDate is required', code: 'MISSING_EXAM_DATE' },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (isNaN(parseInt(studentId))) {
      return NextResponse.json(
        { error: 'Valid studentId is required', code: 'INVALID_STUDENT_ID' },
        { status: 400 }
      );
    }
    if (isNaN(parseInt(subjectId))) {
      return NextResponse.json(
        { error: 'Valid subjectId is required', code: 'INVALID_SUBJECT_ID' },
        { status: 400 }
      );
    }
    if (isNaN(parseFloat(marksObtained))) {
      return NextResponse.json(
        { error: 'Valid marksObtained is required', code: 'INVALID_MARKS_OBTAINED' },
        { status: 400 }
      );
    }
    if (isNaN(parseFloat(totalMarks))) {
      return NextResponse.json(
        { error: 'Valid totalMarks is required', code: 'INVALID_TOTAL_MARKS' },
        { status: 400 }
      );
    }

    // Validate marksObtained <= totalMarks
    if (parseFloat(marksObtained) > parseFloat(totalMarks)) {
      return NextResponse.json(
        {
          error: 'marksObtained cannot be greater than totalMarks',
          code: 'MARKS_EXCEED_TOTAL',
        },
        { status: 400 }
      );
    }

    // Validate studentId exists
    const studentExists = await db
      .select()
      .from(students)
      .where(eq(students.id, parseInt(studentId)))
      .limit(1);

    if (studentExists.length === 0) {
      return NextResponse.json(
        { error: 'Student not found', code: 'STUDENT_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Validate subjectId exists
    const subjectExists = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, parseInt(subjectId)))
      .limit(1);

    if (subjectExists.length === 0) {
      return NextResponse.json(
        { error: 'Subject not found', code: 'SUBJECT_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Create new mark entry
    const newMark = await db
      .insert(marks)
      .values({
        studentId: parseInt(studentId),
        subjectId: parseInt(subjectId),
        examType: examType.trim(),
        marksObtained: parseFloat(marksObtained),
        totalMarks: parseFloat(totalMarks),
        examDate: examDate.trim(),
        remarks: remarks ? remarks.trim() : null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newMark[0], { status: 201 });
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

    // Check if mark exists
    const existingMark = await db
      .select()
      .from(marks)
      .where(eq(marks.id, parseInt(id)))
      .limit(1);

    if (existingMark.length === 0) {
      return NextResponse.json(
        { error: 'Mark entry not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      studentId,
      subjectId,
      examType,
      marksObtained,
      totalMarks,
      examDate,
      remarks,
    } = body;

    // Validate numeric fields if provided
    if (studentId !== undefined) {
      if (isNaN(parseInt(studentId))) {
        return NextResponse.json(
          { error: 'Valid studentId is required', code: 'INVALID_STUDENT_ID' },
          { status: 400 }
        );
      }

      // Validate studentId exists
      const studentExists = await db
        .select()
        .from(students)
        .where(eq(students.id, parseInt(studentId)))
        .limit(1);

      if (studentExists.length === 0) {
        return NextResponse.json(
          { error: 'Student not found', code: 'STUDENT_NOT_FOUND' },
          { status: 400 }
        );
      }
    }

    if (subjectId !== undefined) {
      if (isNaN(parseInt(subjectId))) {
        return NextResponse.json(
          { error: 'Valid subjectId is required', code: 'INVALID_SUBJECT_ID' },
          { status: 400 }
        );
      }

      // Validate subjectId exists
      const subjectExists = await db
        .select()
        .from(subjects)
        .where(eq(subjects.id, parseInt(subjectId)))
        .limit(1);

      if (subjectExists.length === 0) {
        return NextResponse.json(
          { error: 'Subject not found', code: 'SUBJECT_NOT_FOUND' },
          { status: 400 }
        );
      }
    }

    if (marksObtained !== undefined && isNaN(parseFloat(marksObtained))) {
      return NextResponse.json(
        { error: 'Valid marksObtained is required', code: 'INVALID_MARKS_OBTAINED' },
        { status: 400 }
      );
    }

    if (totalMarks !== undefined && isNaN(parseFloat(totalMarks))) {
      return NextResponse.json(
        { error: 'Valid totalMarks is required', code: 'INVALID_TOTAL_MARKS' },
        { status: 400 }
      );
    }

    // Validate marksObtained <= totalMarks
    const finalMarksObtained =
      marksObtained !== undefined ? parseFloat(marksObtained) : existingMark[0].marksObtained;
    const finalTotalMarks =
      totalMarks !== undefined ? parseFloat(totalMarks) : existingMark[0].totalMarks;

    if (finalMarksObtained > finalTotalMarks) {
      return NextResponse.json(
        {
          error: 'marksObtained cannot be greater than totalMarks',
          code: 'MARKS_EXCEED_TOTAL',
        },
        { status: 400 }
      );
    }

    // Build update object
    const updates: any = {};

    if (studentId !== undefined) updates.studentId = parseInt(studentId);
    if (subjectId !== undefined) updates.subjectId = parseInt(subjectId);
    if (examType !== undefined) updates.examType = examType.trim();
    if (marksObtained !== undefined) updates.marksObtained = parseFloat(marksObtained);
    if (totalMarks !== undefined) updates.totalMarks = parseFloat(totalMarks);
    if (examDate !== undefined) updates.examDate = examDate.trim();
    if (remarks !== undefined) updates.remarks = remarks ? remarks.trim() : null;

    // Update the mark entry
    const updatedMark = await db
      .update(marks)
      .set(updates)
      .where(eq(marks.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedMark[0], { status: 200 });
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

    // Check if mark exists
    const existingMark = await db
      .select()
      .from(marks)
      .where(eq(marks.id, parseInt(id)))
      .limit(1);

    if (existingMark.length === 0) {
      return NextResponse.json(
        { error: 'Mark entry not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the mark entry
    const deletedMark = await db
      .delete(marks)
      .where(eq(marks.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Mark entry deleted successfully',
        deletedMark: deletedMark[0],
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