import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { calendarEvents, users } from '@/db/schema';
import { eq, and, gte, lte, like, asc } from 'drizzle-orm';

const VALID_EVENT_TYPES = ['holiday', 'exam', 'event', 'meeting'] as const;

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

function isValidEventType(type: string): boolean {
  return VALID_EVENT_TYPES.includes(type as any);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const eventType = searchParams.get('eventType');
    const month = searchParams.get('month');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const isHoliday = searchParams.get('isHoliday');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single record fetch
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(calendarEvents)
        .where(eq(calendarEvents.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ 
          error: 'Calendar event not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(record[0]);
    }

    // List with filters
    let query = db.select().from(calendarEvents);
    const conditions: any[] = [];

    // Validate and apply eventType filter
    if (eventType) {
      if (!isValidEventType(eventType)) {
        return NextResponse.json({ 
          error: `Event type must be one of: ${VALID_EVENT_TYPES.join(', ')}`,
          code: 'INVALID_EVENT_TYPE' 
        }, { status: 400 });
      }
      conditions.push(eq(calendarEvents.eventType, eventType));
    }

    // Validate and apply month filter
    if (month) {
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        return NextResponse.json({ 
          error: 'Month must be in YYYY-MM format',
          code: 'INVALID_MONTH_FORMAT' 
        }, { status: 400 });
      }
      const monthStart = `${month}-01`;
      const year = parseInt(month.split('-')[0]);
      const monthNum = parseInt(month.split('-')[1]);
      const nextMonth = monthNum === 12 ? `${year + 1}-01-01` : `${year}-${String(monthNum + 1).padStart(2, '0')}-01`;
      conditions.push(gte(calendarEvents.eventDate, monthStart));
      conditions.push(lte(calendarEvents.eventDate, nextMonth));
    }

    // Validate and apply date range filters
    if (startDate) {
      if (!isValidDate(startDate)) {
        return NextResponse.json({ 
          error: 'Start date must be in YYYY-MM-DD format',
          code: 'INVALID_START_DATE' 
        }, { status: 400 });
      }
      conditions.push(gte(calendarEvents.eventDate, startDate));
    }

    if (endDate) {
      if (!isValidDate(endDate)) {
        return NextResponse.json({ 
          error: 'End date must be in YYYY-MM-DD format',
          code: 'INVALID_END_DATE' 
        }, { status: 400 });
      }
      conditions.push(lte(calendarEvents.eventDate, endDate));
    }

    // Validate and apply isHoliday filter
    if (isHoliday !== null && isHoliday !== undefined) {
      const holidayValue = isHoliday.toLowerCase();
      if (holidayValue !== 'true' && holidayValue !== 'false') {
        return NextResponse.json({ 
          error: 'isHoliday must be true or false',
          code: 'INVALID_IS_HOLIDAY' 
        }, { status: 400 });
      }
      conditions.push(eq(calendarEvents.isHoliday, holidayValue === 'true'));
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply ordering and pagination
    const results = await query
      .orderBy(asc(calendarEvents.eventDate))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);

  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, eventDate, eventType, isHoliday, createdBy } = body;

    // Validate required fields
    if (!title || title.trim() === '') {
      return NextResponse.json({ 
        error: 'Title is required and cannot be empty',
        code: 'MISSING_TITLE' 
      }, { status: 400 });
    }

    if (!eventDate) {
      return NextResponse.json({ 
        error: 'Event date is required',
        code: 'MISSING_EVENT_DATE' 
      }, { status: 400 });
    }

    if (!eventType) {
      return NextResponse.json({ 
        error: 'Event type is required',
        code: 'MISSING_EVENT_TYPE' 
      }, { status: 400 });
    }

    // Validate eventDate format
    if (!isValidDate(eventDate)) {
      return NextResponse.json({ 
        error: 'Event date must be in YYYY-MM-DD format',
        code: 'INVALID_EVENT_DATE' 
      }, { status: 400 });
    }

    // Validate eventType
    if (!isValidEventType(eventType)) {
      return NextResponse.json({ 
        error: `Event type must be one of: ${VALID_EVENT_TYPES.join(', ')}`,
        code: 'INVALID_EVENT_TYPE' 
      }, { status: 400 });
    }

    // Validate createdBy if provided
    if (createdBy) {
      if (isNaN(parseInt(createdBy))) {
        return NextResponse.json({ 
          error: 'Created by must be a valid user ID',
          code: 'INVALID_CREATED_BY' 
        }, { status: 400 });
      }

      const userExists = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(createdBy)))
        .limit(1);

      if (userExists.length === 0) {
        return NextResponse.json({ 
          error: 'Referenced user does not exist',
          code: 'USER_NOT_FOUND' 
        }, { status: 400 });
      }
    }

    // Prepare insert data
    const insertData: any = {
      title: title.trim(),
      description: description?.trim() || null,
      eventDate,
      eventType,
      isHoliday: isHoliday ?? false,
      createdAt: new Date().toISOString(),
    };

    if (createdBy) {
      insertData.createdBy = parseInt(createdBy);
    }

    // Insert the record
    const newEvent = await db.insert(calendarEvents)
      .values(insertData)
      .returning();

    return NextResponse.json(newEvent[0], { status: 201 });

  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
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
    const { title, description, eventDate, eventType, isHoliday } = body;

    // Check if record exists
    const existing = await db.select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Calendar event not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Validate title if provided
    if (title !== undefined && title.trim() === '') {
      return NextResponse.json({ 
        error: 'Title cannot be empty',
        code: 'INVALID_TITLE' 
      }, { status: 400 });
    }

    // Validate eventDate if provided
    if (eventDate !== undefined && !isValidDate(eventDate)) {
      return NextResponse.json({ 
        error: 'Event date must be in YYYY-MM-DD format',
        code: 'INVALID_EVENT_DATE' 
      }, { status: 400 });
    }

    // Validate eventType if provided
    if (eventType !== undefined && !isValidEventType(eventType)) {
      return NextResponse.json({ 
        error: `Event type must be one of: ${VALID_EVENT_TYPES.join(', ')}`,
        code: 'INVALID_EVENT_TYPE' 
      }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {};

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (eventDate !== undefined) {
      updateData.eventDate = eventDate;
    }

    if (eventType !== undefined) {
      updateData.eventType = eventType;
    }

    if (isHoliday !== undefined) {
      updateData.isHoliday = isHoliday;
    }

    // Update the record
    const updated = await db.update(calendarEvents)
      .set(updateData)
      .where(eq(calendarEvents.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);

  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
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
      .from(calendarEvents)
      .where(eq(calendarEvents.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Calendar event not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete the record
    const deleted = await db.delete(calendarEvents)
      .where(eq(calendarEvents.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Calendar event deleted successfully',
      deletedEvent: deleted[0]
    });

  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}