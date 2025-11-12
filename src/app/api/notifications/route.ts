import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications, users } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

const VALID_TYPES = ['attendance', 'fee', 'academic', 'general'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single notification by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const notification = await db.select()
        .from(notifications)
        .where(eq(notifications.id, parseInt(id)))
        .limit(1);

      if (notification.length === 0) {
        return NextResponse.json({ 
          error: 'Notification not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(notification[0], { status: 200 });
    }

    // List notifications with filters and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const recipientId = searchParams.get('recipientId');
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');

    let query = db.select().from(notifications);

    const conditions = [];

    if (recipientId) {
      if (isNaN(parseInt(recipientId))) {
        return NextResponse.json({ 
          error: "Valid recipientId is required",
          code: "INVALID_RECIPIENT_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(notifications.recipientId, parseInt(recipientId)));
    }

    if (type) {
      if (!VALID_TYPES.includes(type as any)) {
        return NextResponse.json({ 
          error: `Type must be one of: ${VALID_TYPES.join(', ')}`,
          code: "INVALID_TYPE" 
        }, { status: 400 });
      }
      conditions.push(eq(notifications.type, type));
    }

    if (isRead !== null && isRead !== undefined) {
      const isReadBool = isRead === 'true';
      conditions.push(eq(notifications.isRead, isReadBool));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

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
    const { 
      recipientId, 
      title, 
      message, 
      type, 
      isRead = false, 
      sentViaWhatsapp = false 
    } = body;

    // Validate required fields
    if (!recipientId) {
      return NextResponse.json({ 
        error: "recipientId is required",
        code: "MISSING_RECIPIENT_ID" 
      }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ 
        error: "Valid title is required",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ 
        error: "Valid message is required",
        code: "MISSING_MESSAGE" 
      }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ 
        error: "type is required",
        code: "MISSING_TYPE" 
      }, { status: 400 });
    }

    // Validate recipientId is a valid integer
    if (isNaN(parseInt(recipientId))) {
      return NextResponse.json({ 
        error: "recipientId must be a valid integer",
        code: "INVALID_RECIPIENT_ID" 
      }, { status: 400 });
    }

    // Validate type
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ 
        error: `type must be one of: ${VALID_TYPES.join(', ')}`,
        code: "INVALID_TYPE" 
      }, { status: 400 });
    }

    // Validate recipientId exists in users table
    const user = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(recipientId)))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ 
        error: "recipientId does not exist in users table",
        code: "RECIPIENT_NOT_FOUND" 
      }, { status: 400 });
    }

    // Create notification
    const newNotification = await db.insert(notifications)
      .values({
        recipientId: parseInt(recipientId),
        title: title.trim(),
        message: message.trim(),
        type,
        isRead: Boolean(isRead),
        sentViaWhatsapp: Boolean(sentViaWhatsapp),
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newNotification[0], { status: 201 });
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

    // Check if notification exists
    const existing = await db.select()
      .from(notifications)
      .where(eq(notifications.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Notification not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const updates: any = {};

    // Validate and prepare updates
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim() === '') {
        return NextResponse.json({ 
          error: "Valid title is required",
          code: "INVALID_TITLE" 
        }, { status: 400 });
      }
      updates.title = body.title.trim();
    }

    if (body.message !== undefined) {
      if (typeof body.message !== 'string' || body.message.trim() === '') {
        return NextResponse.json({ 
          error: "Valid message is required",
          code: "INVALID_MESSAGE" 
        }, { status: 400 });
      }
      updates.message = body.message.trim();
    }

    if (body.type !== undefined) {
      if (!VALID_TYPES.includes(body.type)) {
        return NextResponse.json({ 
          error: `type must be one of: ${VALID_TYPES.join(', ')}`,
          code: "INVALID_TYPE" 
        }, { status: 400 });
      }
      updates.type = body.type;
    }

    if (body.recipientId !== undefined) {
      if (isNaN(parseInt(body.recipientId))) {
        return NextResponse.json({ 
          error: "recipientId must be a valid integer",
          code: "INVALID_RECIPIENT_ID" 
        }, { status: 400 });
      }

      // Validate recipientId exists in users table
      const user = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(body.recipientId)))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json({ 
          error: "recipientId does not exist in users table",
          code: "RECIPIENT_NOT_FOUND" 
        }, { status: 400 });
      }

      updates.recipientId = parseInt(body.recipientId);
    }

    if (body.isRead !== undefined) {
      updates.isRead = Boolean(body.isRead);
    }

    if (body.sentViaWhatsapp !== undefined) {
      updates.sentViaWhatsapp = Boolean(body.sentViaWhatsapp);
    }

    // Perform update
    const updated = await db.update(notifications)
      .set(updates)
      .where(eq(notifications.id, parseInt(id)))
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

    // Check if notification exists
    const existing = await db.select()
      .from(notifications)
      .where(eq(notifications.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Notification not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete notification
    const deleted = await db.delete(notifications)
      .where(eq(notifications.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Notification deleted successfully',
      notification: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}