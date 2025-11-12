import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { analyticsLogs } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

const VALID_SEVERITIES = ['info', 'warning', 'critical'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(analyticsLogs)
        .where(eq(analyticsLogs.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ 
          error: 'Analytics log not found',
          code: "NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const logType = searchParams.get('logType');
    const severity = searchParams.get('severity');
    const relatedEntityType = searchParams.get('relatedEntityType');
    const sort = searchParams.get('sort') ?? 'createdAt';
    const order = searchParams.get('order') ?? 'desc';

    let query = db.select().from(analyticsLogs);

    // Build filter conditions
    const conditions = [];
    
    if (logType) {
      conditions.push(eq(analyticsLogs.logType, logType));
    }
    
    if (severity) {
      conditions.push(eq(analyticsLogs.severity, severity));
    }
    
    if (relatedEntityType) {
      conditions.push(eq(analyticsLogs.relatedEntityType, relatedEntityType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const orderFn = order === 'asc' ? 'asc' : 'desc';
    if (sort === 'createdAt') {
      query = orderFn === 'desc' 
        ? query.orderBy(desc(analyticsLogs.createdAt))
        : query.orderBy(analyticsLogs.createdAt);
    } else if (sort === 'severity') {
      query = orderFn === 'desc'
        ? query.orderBy(desc(analyticsLogs.severity))
        : query.orderBy(analyticsLogs.severity);
    }

    const results = await query.limit(limit).offset(offset);

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
    const { 
      logType, 
      severity, 
      relatedEntityType, 
      relatedEntityId, 
      aiInsights 
    } = body;

    // Validate required fields
    if (!logType || typeof logType !== 'string' || logType.trim() === '') {
      return NextResponse.json({ 
        error: "logType is required and must be a non-empty string",
        code: "MISSING_LOG_TYPE" 
      }, { status: 400 });
    }

    if (!severity || typeof severity !== 'string' || severity.trim() === '') {
      return NextResponse.json({ 
        error: "severity is required and must be a non-empty string",
        code: "MISSING_SEVERITY" 
      }, { status: 400 });
    }

    // Validate severity value
    if (!VALID_SEVERITIES.includes(severity as any)) {
      return NextResponse.json({ 
        error: `severity must be one of: ${VALID_SEVERITIES.join(', ')}`,
        code: "INVALID_SEVERITY" 
      }, { status: 400 });
    }

    // Validate relatedEntityId if provided
    if (relatedEntityId !== undefined && relatedEntityId !== null && isNaN(parseInt(relatedEntityId))) {
      return NextResponse.json({ 
        error: "relatedEntityId must be a valid integer",
        code: "INVALID_RELATED_ENTITY_ID" 
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData: any = {
      logType: logType.trim(),
      severity: severity.trim(),
      createdAt: new Date().toISOString(),
    };

    if (relatedEntityType && typeof relatedEntityType === 'string') {
      insertData.relatedEntityType = relatedEntityType.trim();
    }

    if (relatedEntityId !== undefined && relatedEntityId !== null) {
      insertData.relatedEntityId = parseInt(relatedEntityId);
    }

    if (aiInsights !== undefined && aiInsights !== null) {
      // Validate JSON structure if provided
      if (typeof aiInsights === 'object') {
        insertData.aiInsights = aiInsights;
      } else {
        return NextResponse.json({ 
          error: "aiInsights must be a valid JSON object",
          code: "INVALID_AI_INSIGHTS" 
        }, { status: 400 });
      }
    }

    const newRecord = await db.insert(analyticsLogs)
      .values(insertData)
      .returning();

    return NextResponse.json(newRecord[0], { status: 201 });

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
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(analyticsLogs)
      .where(eq(analyticsLogs.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Analytics log not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { 
      logType, 
      severity, 
      relatedEntityType, 
      relatedEntityId, 
      aiInsights 
    } = body;

    // Validate severity if provided
    if (severity && !VALID_SEVERITIES.includes(severity as any)) {
      return NextResponse.json({ 
        error: `severity must be one of: ${VALID_SEVERITIES.join(', ')}`,
        code: "INVALID_SEVERITY" 
      }, { status: 400 });
    }

    // Validate relatedEntityId if provided
    if (relatedEntityId !== undefined && relatedEntityId !== null && isNaN(parseInt(relatedEntityId))) {
      return NextResponse.json({ 
        error: "relatedEntityId must be a valid integer",
        code: "INVALID_RELATED_ENTITY_ID" 
      }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {};

    if (logType !== undefined) {
      if (typeof logType !== 'string' || logType.trim() === '') {
        return NextResponse.json({ 
          error: "logType must be a non-empty string",
          code: "INVALID_LOG_TYPE" 
        }, { status: 400 });
      }
      updateData.logType = logType.trim();
    }

    if (severity !== undefined) {
      if (typeof severity !== 'string' || severity.trim() === '') {
        return NextResponse.json({ 
          error: "severity must be a non-empty string",
          code: "INVALID_SEVERITY" 
        }, { status: 400 });
      }
      updateData.severity = severity.trim();
    }

    if (relatedEntityType !== undefined) {
      updateData.relatedEntityType = relatedEntityType && typeof relatedEntityType === 'string' 
        ? relatedEntityType.trim() 
        : null;
    }

    if (relatedEntityId !== undefined) {
      updateData.relatedEntityId = relatedEntityId !== null 
        ? parseInt(relatedEntityId) 
        : null;
    }

    if (aiInsights !== undefined) {
      if (aiInsights !== null && typeof aiInsights !== 'object') {
        return NextResponse.json({ 
          error: "aiInsights must be a valid JSON object or null",
          code: "INVALID_AI_INSIGHTS" 
        }, { status: 400 });
      }
      updateData.aiInsights = aiInsights;
    }

    const updated = await db.update(analyticsLogs)
      .set(updateData)
      .where(eq(analyticsLogs.id, parseInt(id)))
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
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(analyticsLogs)
      .where(eq(analyticsLogs.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Analytics log not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    const deleted = await db.delete(analyticsLogs)
      .where(eq(analyticsLogs.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Analytics log deleted successfully',
      deleted: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}