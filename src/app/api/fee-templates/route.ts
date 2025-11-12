import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feeTemplates, classes } from '@/db/schema';
import { eq, and, like, or, desc } from 'drizzle-orm';

const VALID_FREQUENCIES = ['monthly', 'quarterly', 'annually', 'one_time'] as const;

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

      const feeTemplate = await db.select()
        .from(feeTemplates)
        .where(eq(feeTemplates.id, parseInt(id)))
        .limit(1);

      if (feeTemplate.length === 0) {
        return NextResponse.json({ 
          error: 'Fee template not found',
          code: "NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(feeTemplate[0], { status: 200 });
    }

    // List with filtering and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const classId = searchParams.get('classId');
    const feeType = searchParams.get('feeType');
    const frequency = searchParams.get('frequency');
    const search = searchParams.get('search');

    let query = db.select().from(feeTemplates);

    // Build filter conditions
    const conditions = [];

    if (classId) {
      if (isNaN(parseInt(classId))) {
        return NextResponse.json({ 
          error: "Valid classId is required",
          code: "INVALID_CLASS_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(feeTemplates.classId, parseInt(classId)));
    }

    if (feeType) {
      conditions.push(eq(feeTemplates.feeType, feeType));
    }

    if (frequency) {
      if (!VALID_FREQUENCIES.includes(frequency as any)) {
        return NextResponse.json({ 
          error: `Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(', ')}`,
          code: "INVALID_FREQUENCY" 
        }, { status: 400 });
      }
      conditions.push(eq(feeTemplates.frequency, frequency));
    }

    if (search) {
      conditions.push(
        or(
          like(feeTemplates.templateName, `%${search}%`),
          like(feeTemplates.feeType, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(feeTemplates.createdAt))
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
    const { templateName, amount, feeType, frequency, classId } = body;

    // Validate required fields
    if (!templateName || templateName.trim() === '') {
      return NextResponse.json({ 
        error: "Template name is required",
        code: "MISSING_TEMPLATE_NAME" 
      }, { status: 400 });
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json({ 
        error: "Amount is required",
        code: "MISSING_AMOUNT" 
      }, { status: 400 });
    }

    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json({ 
        error: "Amount must be a non-negative number",
        code: "INVALID_AMOUNT" 
      }, { status: 400 });
    }

    if (!feeType || feeType.trim() === '') {
      return NextResponse.json({ 
        error: "Fee type is required",
        code: "MISSING_FEE_TYPE" 
      }, { status: 400 });
    }

    if (!frequency || frequency.trim() === '') {
      return NextResponse.json({ 
        error: "Frequency is required",
        code: "MISSING_FREQUENCY" 
      }, { status: 400 });
    }

    // Validate frequency value
    if (!VALID_FREQUENCIES.includes(frequency as any)) {
      return NextResponse.json({ 
        error: `Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(', ')}`,
        code: "INVALID_FREQUENCY" 
      }, { status: 400 });
    }

    // Validate classId if provided
    if (classId !== undefined && classId !== null) {
      if (isNaN(parseInt(classId))) {
        return NextResponse.json({ 
          error: "Valid classId is required",
          code: "INVALID_CLASS_ID" 
        }, { status: 400 });
      }

      // Check if class exists
      const classExists = await db.select()
        .from(classes)
        .where(eq(classes.id, parseInt(classId)))
        .limit(1);

      if (classExists.length === 0) {
        return NextResponse.json({ 
          error: "Class not found",
          code: "CLASS_NOT_FOUND" 
        }, { status: 400 });
      }
    }

    // Prepare insert data
    const insertData: any = {
      templateName: templateName.trim(),
      amount: amount,
      feeType: feeType.trim(),
      frequency: frequency,
      createdAt: new Date().toISOString()
    };

    // Add classId if provided (can be null for school-wide fees)
    if (classId !== undefined && classId !== null) {
      insertData.classId = parseInt(classId);
    }

    const newFeeTemplate = await db.insert(feeTemplates)
      .values(insertData)
      .returning();

    return NextResponse.json(newFeeTemplate[0], { status: 201 });
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
      .from(feeTemplates)
      .where(eq(feeTemplates.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Fee template not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { templateName, amount, feeType, frequency, classId } = body;

    // Validate fields if provided
    if (templateName !== undefined && (typeof templateName !== 'string' || templateName.trim() === '')) {
      return NextResponse.json({ 
        error: "Template name must be a non-empty string",
        code: "INVALID_TEMPLATE_NAME" 
      }, { status: 400 });
    }

    if (amount !== undefined && (typeof amount !== 'number' || amount < 0)) {
      return NextResponse.json({ 
        error: "Amount must be a non-negative number",
        code: "INVALID_AMOUNT" 
      }, { status: 400 });
    }

    if (feeType !== undefined && (typeof feeType !== 'string' || feeType.trim() === '')) {
      return NextResponse.json({ 
        error: "Fee type must be a non-empty string",
        code: "INVALID_FEE_TYPE" 
      }, { status: 400 });
    }

    if (frequency !== undefined) {
      if (!VALID_FREQUENCIES.includes(frequency as any)) {
        return NextResponse.json({ 
          error: `Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(', ')}`,
          code: "INVALID_FREQUENCY" 
        }, { status: 400 });
      }
    }

    // Validate classId if provided
    if (classId !== undefined && classId !== null) {
      if (isNaN(parseInt(classId))) {
        return NextResponse.json({ 
          error: "Valid classId is required",
          code: "INVALID_CLASS_ID" 
        }, { status: 400 });
      }

      // Check if class exists
      const classExists = await db.select()
        .from(classes)
        .where(eq(classes.id, parseInt(classId)))
        .limit(1);

      if (classExists.length === 0) {
        return NextResponse.json({ 
          error: "Class not found",
          code: "CLASS_NOT_FOUND" 
        }, { status: 400 });
      }
    }

    // Build update object
    const updates: any = {};

    if (templateName !== undefined) {
      updates.templateName = templateName.trim();
    }
    if (amount !== undefined) {
      updates.amount = amount;
    }
    if (feeType !== undefined) {
      updates.feeType = feeType.trim();
    }
    if (frequency !== undefined) {
      updates.frequency = frequency;
    }
    if (classId !== undefined) {
      updates.classId = classId !== null ? parseInt(classId) : null;
    }

    const updated = await db.update(feeTemplates)
      .set(updates)
      .where(eq(feeTemplates.id, parseInt(id)))
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
      .from(feeTemplates)
      .where(eq(feeTemplates.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Fee template not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    const deleted = await db.delete(feeTemplates)
      .where(eq(feeTemplates.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Fee template deleted successfully',
      deleted: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}