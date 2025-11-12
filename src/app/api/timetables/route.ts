import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { timetables, sections, subjects } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const timetable = await db.select()
        .from(timetables)
        .where(eq(timetables.id, parseInt(id)))
        .limit(1);

      if (timetable.length === 0) {
        return NextResponse.json({ 
          error: 'Timetable entry not found',
          code: "NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(timetable[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const sectionId = searchParams.get('sectionId');
    const dayOfWeek = searchParams.get('dayOfWeek');

    let query = db.select().from(timetables);

    // Build filter conditions
    const conditions = [];
    
    if (sectionId) {
      if (isNaN(parseInt(sectionId))) {
        return NextResponse.json({ 
          error: "Valid section ID is required",
          code: "INVALID_SECTION_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(timetables.sectionId, parseInt(sectionId)));
    }

    if (dayOfWeek) {
      if (!VALID_DAYS.includes(dayOfWeek)) {
        return NextResponse.json({ 
          error: `Day of week must be one of: ${VALID_DAYS.join(', ')}`,
          code: "INVALID_DAY_OF_WEEK" 
        }, { status: 400 });
      }
      conditions.push(eq(timetables.dayOfWeek, dayOfWeek));
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
    const { sectionId, subjectId, dayOfWeek, startTime, endTime, roomNumber } = body;

    // Validate required fields
    if (!sectionId) {
      return NextResponse.json({ 
        error: "Section ID is required",
        code: "MISSING_SECTION_ID" 
      }, { status: 400 });
    }

    if (!subjectId) {
      return NextResponse.json({ 
        error: "Subject ID is required",
        code: "MISSING_SUBJECT_ID" 
      }, { status: 400 });
    }

    if (!dayOfWeek) {
      return NextResponse.json({ 
        error: "Day of week is required",
        code: "MISSING_DAY_OF_WEEK" 
      }, { status: 400 });
    }

    if (!startTime) {
      return NextResponse.json({ 
        error: "Start time is required",
        code: "MISSING_START_TIME" 
      }, { status: 400 });
    }

    if (!endTime) {
      return NextResponse.json({ 
        error: "End time is required",
        code: "MISSING_END_TIME" 
      }, { status: 400 });
    }

    // Validate sectionId is a valid integer
    if (isNaN(parseInt(sectionId))) {
      return NextResponse.json({ 
        error: "Section ID must be a valid integer",
        code: "INVALID_SECTION_ID" 
      }, { status: 400 });
    }

    // Validate subjectId is a valid integer
    if (isNaN(parseInt(subjectId))) {
      return NextResponse.json({ 
        error: "Subject ID must be a valid integer",
        code: "INVALID_SUBJECT_ID" 
      }, { status: 400 });
    }

    // Validate dayOfWeek
    if (!VALID_DAYS.includes(dayOfWeek)) {
      return NextResponse.json({ 
        error: `Day of week must be one of: ${VALID_DAYS.join(', ')}`,
        code: "INVALID_DAY_OF_WEEK" 
      }, { status: 400 });
    }

    // Validate sectionId exists in sections table
    const sectionExists = await db.select()
      .from(sections)
      .where(eq(sections.id, parseInt(sectionId)))
      .limit(1);

    if (sectionExists.length === 0) {
      return NextResponse.json({ 
        error: "Section does not exist",
        code: "SECTION_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate subjectId exists in subjects table
    const subjectExists = await db.select()
      .from(subjects)
      .where(eq(subjects.id, parseInt(subjectId)))
      .limit(1);

    if (subjectExists.length === 0) {
      return NextResponse.json({ 
        error: "Subject does not exist",
        code: "SUBJECT_NOT_FOUND" 
      }, { status: 400 });
    }

    // Create new timetable entry
    const newTimetable = await db.insert(timetables)
      .values({
        sectionId: parseInt(sectionId),
        subjectId: parseInt(subjectId),
        dayOfWeek: dayOfWeek.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        roomNumber: roomNumber ? roomNumber.trim() : null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newTimetable[0], { status: 201 });
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
      .from(timetables)
      .where(eq(timetables.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Timetable entry not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { sectionId, subjectId, dayOfWeek, startTime, endTime, roomNumber } = body;

    const updates: any = {};

    // Validate and add sectionId if provided
    if (sectionId !== undefined) {
      if (isNaN(parseInt(sectionId))) {
        return NextResponse.json({ 
          error: "Section ID must be a valid integer",
          code: "INVALID_SECTION_ID" 
        }, { status: 400 });
      }

      const sectionExists = await db.select()
        .from(sections)
        .where(eq(sections.id, parseInt(sectionId)))
        .limit(1);

      if (sectionExists.length === 0) {
        return NextResponse.json({ 
          error: "Section does not exist",
          code: "SECTION_NOT_FOUND" 
        }, { status: 400 });
      }

      updates.sectionId = parseInt(sectionId);
    }

    // Validate and add subjectId if provided
    if (subjectId !== undefined) {
      if (isNaN(parseInt(subjectId))) {
        return NextResponse.json({ 
          error: "Subject ID must be a valid integer",
          code: "INVALID_SUBJECT_ID" 
        }, { status: 400 });
      }

      const subjectExists = await db.select()
        .from(subjects)
        .where(eq(subjects.id, parseInt(subjectId)))
        .limit(1);

      if (subjectExists.length === 0) {
        return NextResponse.json({ 
          error: "Subject does not exist",
          code: "SUBJECT_NOT_FOUND" 
        }, { status: 400 });
      }

      updates.subjectId = parseInt(subjectId);
    }

    // Validate and add dayOfWeek if provided
    if (dayOfWeek !== undefined) {
      if (!VALID_DAYS.includes(dayOfWeek)) {
        return NextResponse.json({ 
          error: `Day of week must be one of: ${VALID_DAYS.join(', ')}`,
          code: "INVALID_DAY_OF_WEEK" 
        }, { status: 400 });
      }
      updates.dayOfWeek = dayOfWeek.trim();
    }

    // Add other fields if provided
    if (startTime !== undefined) {
      updates.startTime = startTime.trim();
    }

    if (endTime !== undefined) {
      updates.endTime = endTime.trim();
    }

    if (roomNumber !== undefined) {
      updates.roomNumber = roomNumber ? roomNumber.trim() : null;
    }

    // Update the record
    const updated = await db.update(timetables)
      .set(updates)
      .where(eq(timetables.id, parseInt(id)))
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
      .from(timetables)
      .where(eq(timetables.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Timetable entry not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete the record
    const deleted = await db.delete(timetables)
      .where(eq(timetables.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Timetable entry deleted successfully',
      deleted: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}