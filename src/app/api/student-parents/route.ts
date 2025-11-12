import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { studentParents, students, parents } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const studentId = searchParams.get('studentId');
    const parentId = searchParams.get('parentId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single record by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(studentParents)
        .where(eq(studentParents.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ 
          error: 'Student-parent relationship not found',
          code: "RELATIONSHIP_NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with filtering
    let query = db.select().from(studentParents);

    // Apply filters
    const filters = [];
    if (studentId) {
      if (isNaN(parseInt(studentId))) {
        return NextResponse.json({ 
          error: "Valid studentId is required",
          code: "INVALID_STUDENT_ID" 
        }, { status: 400 });
      }
      filters.push(eq(studentParents.studentId, parseInt(studentId)));
    }
    if (parentId) {
      if (isNaN(parseInt(parentId))) {
        return NextResponse.json({ 
          error: "Valid parentId is required",
          code: "INVALID_PARENT_ID" 
        }, { status: 400 });
      }
      filters.push(eq(studentParents.parentId, parseInt(parentId)));
    }

    if (filters.length > 0) {
      query = query.where(and(...filters));
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
    const { studentId, parentId, isPrimary } = body;

    // Validate required fields
    if (!studentId) {
      return NextResponse.json({ 
        error: "studentId is required",
        code: "MISSING_STUDENT_ID" 
      }, { status: 400 });
    }

    if (!parentId) {
      return NextResponse.json({ 
        error: "parentId is required",
        code: "MISSING_PARENT_ID" 
      }, { status: 400 });
    }

    // Validate IDs are valid integers
    if (isNaN(parseInt(studentId))) {
      return NextResponse.json({ 
        error: "Valid studentId is required",
        code: "INVALID_STUDENT_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(parentId))) {
      return NextResponse.json({ 
        error: "Valid parentId is required",
        code: "INVALID_PARENT_ID" 
      }, { status: 400 });
    }

    // Validate studentId exists in students table
    const studentExists = await db.select()
      .from(students)
      .where(eq(students.id, parseInt(studentId)))
      .limit(1);

    if (studentExists.length === 0) {
      return NextResponse.json({ 
        error: "Student not found",
        code: "STUDENT_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate parentId exists in parents table
    const parentExists = await db.select()
      .from(parents)
      .where(eq(parents.id, parseInt(parentId)))
      .limit(1);

    if (parentExists.length === 0) {
      return NextResponse.json({ 
        error: "Parent not found",
        code: "PARENT_NOT_FOUND" 
      }, { status: 400 });
    }

    // Create new student-parent relationship
    const newRelationship = await db.insert(studentParents)
      .values({
        studentId: parseInt(studentId),
        parentId: parseInt(parentId),
        isPrimary: isPrimary ?? false,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newRelationship[0], { status: 201 });
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
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(studentParents)
      .where(eq(studentParents.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Student-parent relationship not found',
        code: "RELATIONSHIP_NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { studentId, parentId, isPrimary } = body;

    const updates: any = {};

    // Validate and update studentId if provided
    if (studentId !== undefined) {
      if (isNaN(parseInt(studentId))) {
        return NextResponse.json({ 
          error: "Valid studentId is required",
          code: "INVALID_STUDENT_ID" 
        }, { status: 400 });
      }

      const studentExists = await db.select()
        .from(students)
        .where(eq(students.id, parseInt(studentId)))
        .limit(1);

      if (studentExists.length === 0) {
        return NextResponse.json({ 
          error: "Student not found",
          code: "STUDENT_NOT_FOUND" 
        }, { status: 400 });
      }

      updates.studentId = parseInt(studentId);
    }

    // Validate and update parentId if provided
    if (parentId !== undefined) {
      if (isNaN(parseInt(parentId))) {
        return NextResponse.json({ 
          error: "Valid parentId is required",
          code: "INVALID_PARENT_ID" 
        }, { status: 400 });
      }

      const parentExists = await db.select()
        .from(parents)
        .where(eq(parents.id, parseInt(parentId)))
        .limit(1);

      if (parentExists.length === 0) {
        return NextResponse.json({ 
          error: "Parent not found",
          code: "PARENT_NOT_FOUND" 
        }, { status: 400 });
      }

      updates.parentId = parseInt(parentId);
    }

    // Update isPrimary if provided
    if (isPrimary !== undefined) {
      updates.isPrimary = isPrimary;
    }

    // If no updates provided, return error
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update",
        code: "NO_UPDATES" 
      }, { status: 400 });
    }

    // Perform update
    const updated = await db.update(studentParents)
      .set(updates)
      .where(eq(studentParents.id, parseInt(id)))
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
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(studentParents)
      .where(eq(studentParents.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Student-parent relationship not found',
        code: "RELATIONSHIP_NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete the record
    const deleted = await db.delete(studentParents)
      .where(eq(studentParents.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Student-parent relationship deleted successfully',
      deleted: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}