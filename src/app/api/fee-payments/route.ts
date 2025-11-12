import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feePayments, feeInvoices } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const VALID_PAYMENT_METHODS = ['cash', 'card', 'online', 'cheque'];
const VALID_PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'];

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

      const payment = await db
        .select()
        .from(feePayments)
        .where(eq(feePayments.id, parseInt(id)))
        .limit(1);

      if (payment.length === 0) {
        return NextResponse.json(
          { error: 'Fee payment not found', code: 'PAYMENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(payment[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const invoiceId = searchParams.get('invoiceId');
    const paymentMethod = searchParams.get('paymentMethod');
    const paymentStatus = searchParams.get('paymentStatus');

    let query = db.select().from(feePayments);

    // Build filter conditions
    const conditions = [];
    
    if (invoiceId) {
      if (isNaN(parseInt(invoiceId))) {
        return NextResponse.json(
          { error: 'Valid invoiceId is required', code: 'INVALID_INVOICE_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(feePayments.invoiceId, parseInt(invoiceId)));
    }

    if (paymentMethod) {
      if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
        return NextResponse.json(
          { error: 'Invalid payment method', code: 'INVALID_PAYMENT_METHOD' },
          { status: 400 }
        );
      }
      conditions.push(eq(feePayments.paymentMethod, paymentMethod));
    }

    if (paymentStatus) {
      if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
        return NextResponse.json(
          { error: 'Invalid payment status', code: 'INVALID_PAYMENT_STATUS' },
          { status: 400 }
        );
      }
      conditions.push(eq(feePayments.paymentStatus, paymentStatus));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(feePayments.createdAt))
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
    const { invoiceId, amount, paymentMethod, paymentDate, paymentStatus, transactionId, stripePaymentId } = body;

    // Validate required fields
    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required', code: 'MISSING_INVOICE_ID' },
        { status: 400 }
      );
    }

    if (!amount || isNaN(parseFloat(amount))) {
      return NextResponse.json(
        { error: 'Valid amount is required', code: 'INVALID_AMOUNT' },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required', code: 'MISSING_PAYMENT_METHOD' },
        { status: 400 }
      );
    }

    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        { error: `Payment method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`, code: 'INVALID_PAYMENT_METHOD' },
        { status: 400 }
      );
    }

    if (!paymentDate) {
      return NextResponse.json(
        { error: 'Payment date is required', code: 'MISSING_PAYMENT_DATE' },
        { status: 400 }
      );
    }

    if (!paymentStatus) {
      return NextResponse.json(
        { error: 'Payment status is required', code: 'MISSING_PAYMENT_STATUS' },
        { status: 400 }
      );
    }

    if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return NextResponse.json(
        { error: `Payment status must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`, code: 'INVALID_PAYMENT_STATUS' },
        { status: 400 }
      );
    }

    // Validate invoiceId exists
    const invoice = await db
      .select()
      .from(feeInvoices)
      .where(eq(feeInvoices.id, parseInt(invoiceId)))
      .limit(1);

    if (invoice.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found', code: 'INVOICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Create payment
    const newPayment = await db
      .insert(feePayments)
      .values({
        invoiceId: parseInt(invoiceId),
        amount: parseFloat(amount),
        paymentMethod: paymentMethod.trim(),
        paymentDate: paymentDate.trim(),
        paymentStatus: paymentStatus.trim(),
        transactionId: transactionId?.trim() || null,
        stripePaymentId: stripePaymentId?.trim() || null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    // If payment is completed, update the invoice
    if (paymentStatus === 'completed') {
      const currentInvoice = invoice[0];
      const newPaidAmount = (currentInvoice.paidAmount || 0) + parseFloat(amount);
      const newDueAmount = currentInvoice.totalAmount - newPaidAmount;

      let newStatus = currentInvoice.status;
      if (newDueAmount <= 0) {
        newStatus = 'paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'partial';
      }

      await db
        .update(feeInvoices)
        .set({
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          status: newStatus,
        })
        .where(eq(feeInvoices.id, parseInt(invoiceId)));
    }

    return NextResponse.json(newPayment[0], { status: 201 });
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

    // Check if payment exists
    const existingPayment = await db
      .select()
      .from(feePayments)
      .where(eq(feePayments.id, parseInt(id)))
      .limit(1);

    if (existingPayment.length === 0) {
      return NextResponse.json(
        { error: 'Fee payment not found', code: 'PAYMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: any = {};

    // Validate and add fields to update
    if (body.invoiceId !== undefined) {
      if (isNaN(parseInt(body.invoiceId))) {
        return NextResponse.json(
          { error: 'Valid invoice ID is required', code: 'INVALID_INVOICE_ID' },
          { status: 400 }
        );
      }

      // Validate invoiceId exists
      const invoice = await db
        .select()
        .from(feeInvoices)
        .where(eq(feeInvoices.id, parseInt(body.invoiceId)))
        .limit(1);

      if (invoice.length === 0) {
        return NextResponse.json(
          { error: 'Invoice not found', code: 'INVOICE_NOT_FOUND' },
          { status: 404 }
        );
      }

      updates.invoiceId = parseInt(body.invoiceId);
    }

    if (body.amount !== undefined) {
      if (isNaN(parseFloat(body.amount))) {
        return NextResponse.json(
          { error: 'Valid amount is required', code: 'INVALID_AMOUNT' },
          { status: 400 }
        );
      }
      updates.amount = parseFloat(body.amount);
    }

    if (body.paymentMethod !== undefined) {
      if (!VALID_PAYMENT_METHODS.includes(body.paymentMethod)) {
        return NextResponse.json(
          { error: `Payment method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`, code: 'INVALID_PAYMENT_METHOD' },
          { status: 400 }
        );
      }
      updates.paymentMethod = body.paymentMethod.trim();
    }

    if (body.paymentDate !== undefined) {
      updates.paymentDate = body.paymentDate.trim();
    }

    if (body.paymentStatus !== undefined) {
      if (!VALID_PAYMENT_STATUSES.includes(body.paymentStatus)) {
        return NextResponse.json(
          { error: `Payment status must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`, code: 'INVALID_PAYMENT_STATUS' },
          { status: 400 }
        );
      }
      updates.paymentStatus = body.paymentStatus.trim();
    }

    if (body.transactionId !== undefined) {
      updates.transactionId = body.transactionId?.trim() || null;
    }

    if (body.stripePaymentId !== undefined) {
      updates.stripePaymentId = body.stripePaymentId?.trim() || null;
    }

    const updated = await db
      .update(feePayments)
      .set(updates)
      .where(eq(feePayments.id, parseInt(id)))
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

    // Check if payment exists
    const existingPayment = await db
      .select()
      .from(feePayments)
      .where(eq(feePayments.id, parseInt(id)))
      .limit(1);

    if (existingPayment.length === 0) {
      return NextResponse.json(
        { error: 'Fee payment not found', code: 'PAYMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(feePayments)
      .where(eq(feePayments.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Fee payment deleted successfully',
        deletedPayment: deleted[0],
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