import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { academicYears } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

      const academicYear = await db
        .select()
        .from(academicYears)
        .where(eq(academicYears.id, parseInt(id)))
        .limit(1);

      if (academicYear.length === 0) {
        return NextResponse.json(
          { error: 'Academic year not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(academicYear[0], { status: 200 });
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const isCurrent = searchParams.get('isCurrent');

    let query = db.select().from(academicYears);

    // Filter by isCurrent if provided
    if (isCurrent !== null) {
      const isCurrentBool = isCurrent === 'true';
      query = query.where(eq(academicYears.isCurrent, isCurrentBool));
    }

    const results = await query.limit(limit).offset(offset);

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
    const { yearName, startDate, endDate, isCurrent } = body;

    // Validate required fields
    if (!yearName || !startDate || !endDate) {
      return NextResponse.json(
        {
          error: 'Missing required fields: yearName, startDate, and endDate are required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Validate date format (basic check)
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return NextResponse.json(
        {
          error: 'Invalid date format. Please use ISO 8601 format (YYYY-MM-DD)',
          code: 'INVALID_DATE_FORMAT',
        },
        { status: 400 }
      );
    }

    // Validate end date is after start date
    if (endDateObj <= startDateObj) {
      return NextResponse.json(
        {
          error: 'End date must be after start date',
          code: 'INVALID_DATE_RANGE',
        },
        { status: 400 }
      );
    }

    // If isCurrent is true, set all other academic years' isCurrent to false
    if (isCurrent === true) {
      await db
        .update(academicYears)
        .set({ isCurrent: false })
        .where(eq(academicYears.isCurrent, true));
    }

    // Create new academic year
    const newAcademicYear = await db
      .insert(academicYears)
      .values({
        yearName: yearName.trim(),
        startDate,
        endDate,
        isCurrent: isCurrent ?? false,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newAcademicYear[0], { status: 201 });
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

    // Check if record exists
    const existing = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Academic year not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { yearName, startDate, endDate, isCurrent } = body;

    // Validate dates if provided
    if (startDate || endDate) {
      const start = startDate || existing[0].startDate;
      const end = endDate || existing[0].endDate;

      const startDateObj = new Date(start);
      const endDateObj = new Date(end);

      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return NextResponse.json(
          {
            error: 'Invalid date format. Please use ISO 8601 format (YYYY-MM-DD)',
            code: 'INVALID_DATE_FORMAT',
          },
          { status: 400 }
        );
      }

      if (endDateObj <= startDateObj) {
        return NextResponse.json(
          {
            error: 'End date must be after start date',
            code: 'INVALID_DATE_RANGE',
          },
          { status: 400 }
        );
      }
    }

    // If isCurrent is being set to true, set all other academic years' isCurrent to false
    if (isCurrent === true) {
      await db
        .update(academicYears)
        .set({ isCurrent: false })
        .where(eq(academicYears.isCurrent, true));
    }

    // Build update object with only provided fields
    const updates: Record<string, any> = {};

    if (yearName !== undefined) updates.yearName = yearName.trim();
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;
    if (isCurrent !== undefined) updates.isCurrent = isCurrent;

    const updated = await db
      .update(academicYears)
      .set(updates)
      .where(eq(academicYears.id, parseInt(id)))
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

    // Check if record exists
    const existing = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Academic year not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(academicYears)
      .where(eq(academicYears.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Academic year deleted successfully',
        deletedRecord: deleted[0],
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