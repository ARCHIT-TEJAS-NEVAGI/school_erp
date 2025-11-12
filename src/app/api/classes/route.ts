import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { classes, academicYears } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const academicYearId = searchParams.get('academicYearId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single record by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(classes)
        .where(eq(classes.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ 
          error: 'Class not found',
          code: "NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with optional filtering
    let query = db.select().from(classes);

    // Filter by academicYearId if provided
    if (academicYearId) {
      if (isNaN(parseInt(academicYearId))) {
        return NextResponse.json({ 
          error: "Valid academicYearId is required",
          code: "INVALID_ACADEMIC_YEAR_ID" 
        }, { status: 400 });
      }
      query = query.where(eq(classes.academicYearId, parseInt(academicYearId)));
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
    const { className, academicYearId } = body;

    // Validate required fields
    if (!className) {
      return NextResponse.json({ 
        error: "className is required",
        code: "MISSING_CLASS_NAME" 
      }, { status: 400 });
    }

    if (!academicYearId) {
      return NextResponse.json({ 
        error: "academicYearId is required",
        code: "MISSING_ACADEMIC_YEAR_ID" 
      }, { status: 400 });
    }

    // Validate academicYearId is a valid integer
    if (isNaN(parseInt(academicYearId))) {
      return NextResponse.json({ 
        error: "Valid academicYearId is required",
        code: "INVALID_ACADEMIC_YEAR_ID" 
      }, { status: 400 });
    }

    // Validate academicYearId exists in academicYears table
    const academicYear = await db.select()
      .from(academicYears)
      .where(eq(academicYears.id, parseInt(academicYearId)))
      .limit(1);

    if (academicYear.length === 0) {
      return NextResponse.json({ 
        error: "Academic year not found",
        code: "ACADEMIC_YEAR_NOT_FOUND" 
      }, { status: 400 });
    }

    // Sanitize input
    const sanitizedClassName = className.trim();

    // Create new class
    const newClass = await db.insert(classes)
      .values({
        className: sanitizedClassName,
        academicYearId: parseInt(academicYearId),
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newClass[0], { status: 201 });
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

    // Validate ID is provided
    if (!id) {
      return NextResponse.json({ 
        error: "ID is required",
        code: "MISSING_ID" 
      }, { status: 400 });
    }

    // Validate ID is valid integer
    if (isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists
    const existingClass = await db.select()
      .from(classes)
      .where(eq(classes.id, parseInt(id)))
      .limit(1);

    if (existingClass.length === 0) {
      return NextResponse.json({ 
        error: 'Class not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { className, academicYearId } = body;

    // Build update object with only provided fields
    const updates: any = {};

    if (className !== undefined) {
      if (!className.trim()) {
        return NextResponse.json({ 
          error: "className cannot be empty",
          code: "INVALID_CLASS_NAME" 
        }, { status: 400 });
      }
      updates.className = className.trim();
    }

    if (academicYearId !== undefined) {
      // Validate academicYearId is a valid integer
      if (isNaN(parseInt(academicYearId))) {
        return NextResponse.json({ 
          error: "Valid academicYearId is required",
          code: "INVALID_ACADEMIC_YEAR_ID" 
        }, { status: 400 });
      }

      // Validate academicYearId exists in academicYears table
      const academicYear = await db.select()
        .from(academicYears)
        .where(eq(academicYears.id, parseInt(academicYearId)))
        .limit(1);

      if (academicYear.length === 0) {
        return NextResponse.json({ 
          error: "Academic year not found",
          code: "ACADEMIC_YEAR_NOT_FOUND" 
        }, { status: 400 });
      }

      updates.academicYearId = parseInt(academicYearId);
    }

    // If no fields to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: "No fields to update",
        code: "NO_UPDATES" 
      }, { status: 400 });
    }

    // Update the record
    const updated = await db.update(classes)
      .set(updates)
      .where(eq(classes.id, parseInt(id)))
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

    // Validate ID is provided
    if (!id) {
      return NextResponse.json({ 
        error: "ID is required",
        code: "MISSING_ID" 
      }, { status: 400 });
    }

    // Validate ID is valid integer
    if (isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists
    const existingClass = await db.select()
      .from(classes)
      .where(eq(classes.id, parseInt(id)))
      .limit(1);

    if (existingClass.length === 0) {
      return NextResponse.json({ 
        error: 'Class not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete the record
    const deleted = await db.delete(classes)
      .where(eq(classes.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Class deleted successfully',
      deletedClass: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}