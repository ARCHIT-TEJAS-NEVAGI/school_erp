import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { students } from '@/db/schema';
import { eq } from 'drizzle-orm';

const ALLOWED_STUDENT_LEVELS = ['L1', 'L2', 'L3'] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid student ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const studentId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { studentLevel } = body;

    // Validate studentLevel is provided
    if (!studentLevel) {
      return NextResponse.json(
        {
          error: 'Student level is required',
          code: 'MISSING_STUDENT_LEVEL',
        },
        { status: 400 }
      );
    }

    // Validate studentLevel is one of allowed values
    if (!ALLOWED_STUDENT_LEVELS.includes(studentLevel)) {
      return NextResponse.json(
        {
          error: `Student level must be one of: ${ALLOWED_STUDENT_LEVELS.join(', ')}`,
          code: 'INVALID_STUDENT_LEVEL',
        },
        { status: 400 }
      );
    }

    // Check if student exists
    const existingStudent = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (existingStudent.length === 0) {
      return NextResponse.json(
        {
          error: 'Student not found',
          code: 'STUDENT_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Update student level
    const updatedStudent = await db
      .update(students)
      .set({
        studentLevel,
      })
      .where(eq(students.id, studentId))
      .returning();

    if (updatedStudent.length === 0) {
      return NextResponse.json(
        {
          error: 'Failed to update student level',
          code: 'UPDATE_FAILED',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedStudent[0], { status: 200 });
  } catch (error) {
    console.error('PATCH /api/students/[id]/level error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}