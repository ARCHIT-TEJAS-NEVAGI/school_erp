import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feeInvoices, students, academicYears } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const VALID_STATUSES = ['pending', 'partial', 'paid', 'overdue'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const invoice = await db
        .select()
        .from(feeInvoices)
        .where(eq(feeInvoices.id, parseInt(id)))
        .limit(1);

      if (invoice.length === 0) {
        return NextResponse.json(
          { error: 'Fee invoice not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(invoice[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const academicYearId = searchParams.get('academicYearId');

    let query = db.select().from(feeInvoices);

    // Build filter conditions
    const conditions = [];

    if (studentId) {
      if (isNaN(parseInt(studentId))) {
        return NextResponse.json(
          { error: 'Valid studentId is required', code: 'INVALID_STUDENT_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(feeInvoices.studentId, parseInt(studentId)));
    }

    if (status) {
      if (!VALID_STATUSES.includes(status as any)) {
        return NextResponse.json(
          { 
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
            code: 'INVALID_STATUS' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(feeInvoices.status, status));
    }

    if (academicYearId) {
      if (isNaN(parseInt(academicYearId))) {
        return NextResponse.json(
          { error: 'Valid academicYearId is required', code: 'INVALID_ACADEMIC_YEAR_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(feeInvoices.academicYearId, parseInt(academicYearId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(feeInvoices.createdAt))
      .limit(limit)
      .offset(offset);

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
    const {
      studentId,
      invoiceNumber,
      totalAmount,
      dueAmount,
      dueDate,
      status,
      academicYearId,
      paidAmount = 0,
    } = body;

    // Validate required fields
    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId is required', code: 'MISSING_STUDENT_ID' },
        { status: 400 }
      );
    }

    if (!invoiceNumber) {
      return NextResponse.json(
        { error: 'invoiceNumber is required', code: 'MISSING_INVOICE_NUMBER' },
        { status: 400 }
      );
    }

    if (totalAmount === undefined || totalAmount === null) {
      return NextResponse.json(
        { error: 'totalAmount is required', code: 'MISSING_TOTAL_AMOUNT' },
        { status: 400 }
      );
    }

    if (dueAmount === undefined || dueAmount === null) {
      return NextResponse.json(
        { error: 'dueAmount is required', code: 'MISSING_DUE_AMOUNT' },
        { status: 400 }
      );
    }

    if (!dueDate) {
      return NextResponse.json(
        { error: 'dueDate is required', code: 'MISSING_DUE_DATE' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'status is required', code: 'MISSING_STATUS' },
        { status: 400 }
      );
    }

    if (!academicYearId) {
      return NextResponse.json(
        { error: 'academicYearId is required', code: 'MISSING_ACADEMIC_YEAR_ID' },
        { status: 400 }
      );
    }

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Validate studentId exists
    const studentExists = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.id, parseInt(studentId)))
      .limit(1);

    if (studentExists.length === 0) {
      return NextResponse.json(
        { error: 'Student not found', code: 'STUDENT_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Validate academicYearId exists
    const academicYearExists = await db
      .select({ id: academicYears.id })
      .from(academicYears)
      .where(eq(academicYears.id, parseInt(academicYearId)))
      .limit(1);

    if (academicYearExists.length === 0) {
      return NextResponse.json(
        { error: 'Academic year not found', code: 'ACADEMIC_YEAR_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Validate invoiceNumber is unique
    const invoiceExists = await db
      .select({ id: feeInvoices.id })
      .from(feeInvoices)
      .where(eq(feeInvoices.invoiceNumber, invoiceNumber.trim()))
      .limit(1);

    if (invoiceExists.length > 0) {
      return NextResponse.json(
        { error: 'Invoice number already exists', code: 'DUPLICATE_INVOICE_NUMBER' },
        { status: 400 }
      );
    }

    // Validate numeric values
    if (isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) < 0) {
      return NextResponse.json(
        { error: 'totalAmount must be a valid positive number', code: 'INVALID_TOTAL_AMOUNT' },
        { status: 400 }
      );
    }

    if (isNaN(parseFloat(dueAmount)) || parseFloat(dueAmount) < 0) {
      return NextResponse.json(
        { error: 'dueAmount must be a valid positive number', code: 'INVALID_DUE_AMOUNT' },
        { status: 400 }
      );
    }

    if (isNaN(parseFloat(paidAmount)) || parseFloat(paidAmount) < 0) {
      return NextResponse.json(
        { error: 'paidAmount must be a valid positive number', code: 'INVALID_PAID_AMOUNT' },
        { status: 400 }
      );
    }

    // Create new fee invoice
    const newInvoice = await db
      .insert(feeInvoices)
      .values({
        studentId: parseInt(studentId),
        invoiceNumber: invoiceNumber.trim(),
        totalAmount: parseFloat(totalAmount),
        paidAmount: parseFloat(paidAmount),
        dueAmount: parseFloat(dueAmount),
        dueDate: dueDate,
        status: status,
        academicYearId: parseInt(academicYearId),
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newInvoice[0], { status: 201 });
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
    const existingInvoice = await db
      .select()
      .from(feeInvoices)
      .where(eq(feeInvoices.id, parseInt(id)))
      .limit(1);

    if (existingInvoice.length === 0) {
      return NextResponse.json(
        { error: 'Fee invoice not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: any = {};

    // Validate and prepare updates
    if (body.studentId !== undefined) {
      const studentExists = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.id, parseInt(body.studentId)))
        .limit(1);

      if (studentExists.length === 0) {
        return NextResponse.json(
          { error: 'Student not found', code: 'STUDENT_NOT_FOUND' },
          { status: 400 }
        );
      }
      updates.studentId = parseInt(body.studentId);
    }

    if (body.invoiceNumber !== undefined) {
      // Check if new invoice number is unique (excluding current record)
      const invoiceExists = await db
        .select({ id: feeInvoices.id })
        .from(feeInvoices)
        .where(
          and(
            eq(feeInvoices.invoiceNumber, body.invoiceNumber.trim()),
            eq(feeInvoices.id, parseInt(id))
          )
        )
        .limit(1);

      if (invoiceExists.length === 0) {
        const duplicateCheck = await db
          .select({ id: feeInvoices.id })
          .from(feeInvoices)
          .where(eq(feeInvoices.invoiceNumber, body.invoiceNumber.trim()))
          .limit(1);

        if (duplicateCheck.length > 0) {
          return NextResponse.json(
            { error: 'Invoice number already exists', code: 'DUPLICATE_INVOICE_NUMBER' },
            { status: 400 }
          );
        }
      }

      updates.invoiceNumber = body.invoiceNumber.trim();
    }

    if (body.totalAmount !== undefined) {
      if (isNaN(parseFloat(body.totalAmount)) || parseFloat(body.totalAmount) < 0) {
        return NextResponse.json(
          { error: 'totalAmount must be a valid positive number', code: 'INVALID_TOTAL_AMOUNT' },
          { status: 400 }
        );
      }
      updates.totalAmount = parseFloat(body.totalAmount);
    }

    if (body.paidAmount !== undefined) {
      if (isNaN(parseFloat(body.paidAmount)) || parseFloat(body.paidAmount) < 0) {
        return NextResponse.json(
          { error: 'paidAmount must be a valid positive number', code: 'INVALID_PAID_AMOUNT' },
          { status: 400 }
        );
      }
      updates.paidAmount = parseFloat(body.paidAmount);
    }

    if (body.dueDate !== undefined) {
      updates.dueDate = body.dueDate;
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { 
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
            code: 'INVALID_STATUS' 
          },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (body.academicYearId !== undefined) {
      const academicYearExists = await db
        .select({ id: academicYears.id })
        .from(academicYears)
        .where(eq(academicYears.id, parseInt(body.academicYearId)))
        .limit(1);

      if (academicYearExists.length === 0) {
        return NextResponse.json(
          { error: 'Academic year not found', code: 'ACADEMIC_YEAR_NOT_FOUND' },
          { status: 400 }
        );
      }
      updates.academicYearId = parseInt(body.academicYearId);
    }

    // Recalculate dueAmount if totalAmount or paidAmount changed
    const currentInvoice = existingInvoice[0];
    const finalTotalAmount = updates.totalAmount ?? currentInvoice.totalAmount;
    const finalPaidAmount = updates.paidAmount ?? currentInvoice.paidAmount;
    updates.dueAmount = finalTotalAmount - finalPaidAmount;

    // Always update timestamp
    updates.updatedAt = new Date().toISOString();

    const updated = await db
      .update(feeInvoices)
      .set(updates)
      .where(eq(feeInvoices.id, parseInt(id)))
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
    const existingInvoice = await db
      .select()
      .from(feeInvoices)
      .where(eq(feeInvoices.id, parseInt(id)))
      .limit(1);

    if (existingInvoice.length === 0) {
      return NextResponse.json(
        { error: 'Fee invoice not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(feeInvoices)
      .where(eq(feeInvoices.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Fee invoice deleted successfully',
        deletedInvoice: deleted[0],
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