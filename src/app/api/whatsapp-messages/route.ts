import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { whatsappMessages, users, classes, sections } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const message = await db.select()
        .from(whatsappMessages)
        .where(eq(whatsappMessages.id, parseInt(id)))
        .limit(1);

      if (message.length === 0) {
        return NextResponse.json({ 
          error: 'WhatsApp message not found',
          code: "MESSAGE_NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(message[0], { status: 200 });
    }

    // List with filters
    const recipientType = searchParams.get('recipientType');
    const status = searchParams.get('status');
    const sentBy = searchParams.get('sentBy');
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Validate recipientType if provided
    if (recipientType && !['individual', 'class', 'section', 'all'].includes(recipientType)) {
      return NextResponse.json({ 
        error: "Invalid recipient type. Must be one of: 'individual', 'class', 'section', 'all'",
        code: "INVALID_RECIPIENT_TYPE" 
      }, { status: 400 });
    }

    // Validate status if provided
    if (status && !['pending', 'sent', 'failed'].includes(status)) {
      return NextResponse.json({ 
        error: "Invalid status. Must be one of: 'pending', 'sent', 'failed'",
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    // Validate numeric parameters
    if (sentBy && isNaN(parseInt(sentBy))) {
      return NextResponse.json({ 
        error: "sentBy must be a valid integer",
        code: "INVALID_SENT_BY" 
      }, { status: 400 });
    }

    if (classId && isNaN(parseInt(classId))) {
      return NextResponse.json({ 
        error: "classId must be a valid integer",
        code: "INVALID_CLASS_ID" 
      }, { status: 400 });
    }

    if (sectionId && isNaN(parseInt(sectionId))) {
      return NextResponse.json({ 
        error: "sectionId must be a valid integer",
        code: "INVALID_SECTION_ID" 
      }, { status: 400 });
    }

    // Build where conditions
    const conditions = [];

    if (recipientType) {
      conditions.push(eq(whatsappMessages.recipientType, recipientType));
    }

    if (status) {
      conditions.push(eq(whatsappMessages.status, status));
    }

    if (sentBy) {
      conditions.push(eq(whatsappMessages.sentBy, parseInt(sentBy)));
    }

    if (classId) {
      conditions.push(eq(whatsappMessages.classId, parseInt(classId)));
    }

    if (sectionId) {
      conditions.push(eq(whatsappMessages.sectionId, parseInt(sectionId)));
    }

    if (startDate) {
      conditions.push(gte(whatsappMessages.sentAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(whatsappMessages.sentAt, endDate));
    }

    let query = db.select().from(whatsappMessages);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const messages = await query
      .orderBy(desc(whatsappMessages.sentAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(messages, { status: 200 });

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
    const { recipientType, recipientId, classId, sectionId, messageText, sentBy, phoneNumber } = body;

    // Validate required fields
    if (!recipientType) {
      return NextResponse.json({ 
        error: "recipientType is required",
        code: "MISSING_RECIPIENT_TYPE" 
      }, { status: 400 });
    }

    if (!messageText || messageText.trim() === '') {
      return NextResponse.json({ 
        error: "messageText is required and cannot be empty",
        code: "MISSING_MESSAGE_TEXT" 
      }, { status: 400 });
    }

    if (!sentBy) {
      return NextResponse.json({ 
        error: "sentBy is required",
        code: "MISSING_SENT_BY" 
      }, { status: 400 });
    }

    // Validate recipientType
    if (!['individual', 'class', 'section', 'all'].includes(recipientType)) {
      return NextResponse.json({ 
        error: "Invalid recipient type. Must be one of: 'individual', 'class', 'section', 'all'",
        code: "INVALID_RECIPIENT_TYPE" 
      }, { status: 400 });
    }

    // Conditional validation based on recipientType
    if (recipientType === 'individual') {
      if (!recipientId) {
        return NextResponse.json({ 
          error: "recipientId is required for individual messages",
          code: "MISSING_RECIPIENT_ID" 
        }, { status: 400 });
      }
      if (!phoneNumber) {
        return NextResponse.json({ 
          error: "phoneNumber is required for individual messages",
          code: "MISSING_PHONE_NUMBER" 
        }, { status: 400 });
      }
    }

    if (recipientType === 'class' && !classId) {
      return NextResponse.json({ 
        error: "classId is required for class messages",
        code: "MISSING_CLASS_ID" 
      }, { status: 400 });
    }

    if (recipientType === 'section' && !sectionId) {
      return NextResponse.json({ 
        error: "sectionId is required for section messages",
        code: "MISSING_SECTION_ID" 
      }, { status: 400 });
    }

    // Validate sentBy user exists
    const userExists = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(sentBy)))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json({ 
        error: "sentBy user does not exist",
        code: "INVALID_SENT_BY_USER" 
      }, { status: 400 });
    }

    // Validate recipientId exists if provided
    if (recipientId) {
      const recipientExists = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(recipientId)))
        .limit(1);

      if (recipientExists.length === 0) {
        return NextResponse.json({ 
          error: "recipientId user does not exist",
          code: "INVALID_RECIPIENT_ID" 
        }, { status: 400 });
      }
    }

    // Validate classId exists if provided
    if (classId) {
      const classExists = await db.select()
        .from(classes)
        .where(eq(classes.id, parseInt(classId)))
        .limit(1);

      if (classExists.length === 0) {
        return NextResponse.json({ 
          error: "classId does not exist",
          code: "INVALID_CLASS_ID" 
        }, { status: 400 });
      }
    }

    // Validate sectionId exists if provided
    if (sectionId) {
      const sectionExists = await db.select()
        .from(sections)
        .where(eq(sections.id, parseInt(sectionId)))
        .limit(1);

      if (sectionExists.length === 0) {
        return NextResponse.json({ 
          error: "sectionId does not exist",
          code: "INVALID_SECTION_ID" 
        }, { status: 400 });
      }
    }

    // Prepare insert data
    const insertData: any = {
      recipientType,
      messageText: messageText.trim(),
      sentBy: parseInt(sentBy),
      sentAt: new Date().toISOString(),
      status: 'pending',
    };

    if (recipientId) {
      insertData.recipientId = parseInt(recipientId);
    }

    if (classId) {
      insertData.classId = parseInt(classId);
    }

    if (sectionId) {
      insertData.sectionId = parseInt(sectionId);
    }

    if (phoneNumber) {
      insertData.phoneNumber = phoneNumber.trim();
    }

    // Insert message
    const newMessage = await db.insert(whatsappMessages)
      .values(insertData)
      .returning();

    return NextResponse.json(newMessage[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status) {
      return NextResponse.json({ 
        error: "status is required",
        code: "MISSING_STATUS" 
      }, { status: 400 });
    }

    if (!['pending', 'sent', 'failed'].includes(status)) {
      return NextResponse.json({ 
        error: "Invalid status. Must be one of: 'pending', 'sent', 'failed'",
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    // Check if message exists
    const existingMessage = await db.select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.id, parseInt(id)))
      .limit(1);

    if (existingMessage.length === 0) {
      return NextResponse.json({ 
        error: 'WhatsApp message not found',
        code: "MESSAGE_NOT_FOUND" 
      }, { status: 404 });
    }

    // Update message
    const updated = await db.update(whatsappMessages)
      .set({
        status,
      })
      .where(eq(whatsappMessages.id, parseInt(id)))
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if message exists
    const existingMessage = await db.select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.id, parseInt(id)))
      .limit(1);

    if (existingMessage.length === 0) {
      return NextResponse.json({ 
        error: 'WhatsApp message not found',
        code: "MESSAGE_NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete message
    const deleted = await db.delete(whatsappMessages)
      .where(eq(whatsappMessages.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'WhatsApp message deleted successfully',
      deleted: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}