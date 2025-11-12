import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feeInvoices, feePayments, paymentInstallments, students, users, notifications } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import crypto from 'crypto';
import razorpayInstance from '@/lib/razorpay';
import { PaymentVerificationPayload } from '@/lib/types/razorpay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId }: PaymentVerificationPayload & { invoiceId: string } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification details', code: 'MISSING_VERIFICATION_DETAILS' },
        { status: 400 }
      );
    }

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required', code: 'MISSING_INVOICE_ID' },
        { status: 400 }
      );
    }

    // Validate invoice ID is a valid integer
    const parsedInvoiceId = parseInt(String(invoiceId));
    if (isNaN(parsedInvoiceId)) {
      return NextResponse.json(
        { error: 'Valid invoice ID is required', code: 'INVALID_INVOICE_ID' },
        { status: 400 }
      );
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Payment signature verification failed', code: 'SIGNATURE_VERIFICATION_FAILED' },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay to double-verify
    let payment: any;
    try {
      payment = await razorpayInstance.payments.fetch(razorpay_payment_id);
    } catch (error: any) {
      console.error('Razorpay payment fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment details from Razorpay: ' + error.message, code: 'RAZORPAY_FETCH_ERROR' },
        { status: 400 }
      );
    }

    // Verify payment succeeded
    if (payment.status !== 'captured') {
      return NextResponse.json(
        { 
          error: `Payment not completed. Current status: ${payment.status}`, 
          code: 'PAYMENT_NOT_CAPTURED' 
        },
        { status: 400 }
      );
    }

    // Fetch invoice details with student information
    const invoiceWithStudent = await db.select({
      invoice: feeInvoices,
      student: students,
      user: users
    })
      .from(feeInvoices)
      .innerJoin(students, eq(feeInvoices.studentId, students.id))
      .innerJoin(users, eq(students.userId, users.id))
      .where(eq(feeInvoices.id, parsedInvoiceId))
      .limit(1);

    if (invoiceWithStudent.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found', code: 'INVOICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const invoiceData = invoiceWithStudent[0].invoice;
    const studentData = invoiceWithStudent[0].student;
    const userData = invoiceWithStudent[0].user;
    const paymentAmount = payment.amount / 100; // Convert from paise to rupees

    // Create payment record
    const newPayment = await db.insert(feePayments)
      .values({
        invoiceId: parsedInvoiceId,
        amount: paymentAmount,
        paymentMethod: 'online',
        paymentDate: new Date().toISOString(),
        stripePaymentId: razorpay_payment_id,
        paymentStatus: 'completed',
        transactionId: razorpay_payment_id,
        createdAt: new Date().toISOString(),
      })
      .returning();

    const createdPayment = newPayment[0];

    let updatedInvoice;
    let updatedInstallment = null;
    let nextInstallment = null;

    // Check if invoice has installments (EMI payment)
    const installments = await db.select()
      .from(paymentInstallments)
      .where(eq(paymentInstallments.invoiceId, parsedInvoiceId))
      .orderBy(asc(paymentInstallments.installmentNumber));

    const isEmiPayment = installments.length > 0;

    if (isEmiPayment) {
      // EMI PAYMENT LOGIC
      const pendingInstallment = installments.find(inst => inst.status === 'pending');

      if (!pendingInstallment) {
        return NextResponse.json(
          { error: 'No pending installments found for this invoice', code: 'NO_PENDING_INSTALLMENTS' },
          { status: 400 }
        );
      }

      // Update installment
      const updatedInstallmentResult = await db.update(paymentInstallments)
        .set({
          paidAmount: paymentAmount,
          status: 'paid',
          paymentId: createdPayment.id,
        })
        .where(eq(paymentInstallments.id, pendingInstallment.id))
        .returning();

      updatedInstallment = updatedInstallmentResult[0];

      // Update invoice paidAmount and dueAmount
      const newPaidAmount = (invoiceData.paidAmount || 0) + paymentAmount;
      const newDueAmount = invoiceData.totalAmount - newPaidAmount;

      // Check if all installments are paid
      const remainingPendingInstallments = installments.filter(
        inst => inst.id !== pendingInstallment.id && inst.status === 'pending'
      );

      const allInstallmentsPaid = remainingPendingInstallments.length === 0;
      const invoiceStatus = allInstallmentsPaid ? 'paid' : 'partial';

      // Update invoice
      const updatedInvoiceResult = await db.update(feeInvoices)
        .set({
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          status: invoiceStatus,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(feeInvoices.id, parsedInvoiceId))
        .returning();

      updatedInvoice = updatedInvoiceResult[0];

      // Get next pending installment if exists
      const nextPendingInstallment = installments.find(
        inst => inst.id !== pendingInstallment.id && inst.status === 'pending'
      );

      if (nextPendingInstallment) {
        nextInstallment = {
          installmentNumber: nextPendingInstallment.installmentNumber,
          amount: nextPendingInstallment.amount,
          dueDate: nextPendingInstallment.dueDate,
        };
      }
    } else {
      // FULL PAYMENT LOGIC
      const newPaidAmount = (invoiceData.paidAmount || 0) + paymentAmount;
      const newDueAmount = invoiceData.totalAmount - newPaidAmount;

      // Determine invoice status
      const invoiceStatus = newDueAmount <= 0 ? 'paid' : 'partial';

      // Update invoice
      const updatedInvoiceResult = await db.update(feeInvoices)
        .set({
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          status: invoiceStatus,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(feeInvoices.id, parsedInvoiceId))
        .returning();

      updatedInvoice = updatedInvoiceResult[0];
    }

    // Create notification for all admin users
    try {
      const adminUsers = await db.select()
        .from(users)
        .where(eq(users.role, 'admin'));

      for (const admin of adminUsers) {
        await db.insert(notifications).values({
          recipientId: admin.id,
          title: 'Fee Payment Received',
          message: `${userData.fullName} (${studentData.admissionNumber}) has paid ₹${paymentAmount.toFixed(2)} for invoice ${invoiceData.invoiceNumber}. Payment status: ${updatedInvoice.status}`,
          type: 'fee',
          isRead: false,
          sentViaWhatsapp: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the payment if notification creation fails
    }

    if (isEmiPayment) {
      return NextResponse.json(
        {
          success: true,
          message: 'Payment confirmed successfully',
          payment: {
            id: createdPayment.id,
            amount: createdPayment.amount,
            status: createdPayment.paymentStatus,
          },
          invoice: {
            id: updatedInvoice.id,
            status: updatedInvoice.status,
            paidAmount: updatedInvoice.paidAmount,
            dueAmount: updatedInvoice.dueAmount,
          },
          installment: {
            installmentNumber: updatedInstallment.installmentNumber,
            status: updatedInstallment.status,
          },
          nextInstallment,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: true,
          message: 'Payment confirmed successfully',
          payment: {
            id: createdPayment.id,
            amount: createdPayment.amount,
            status: createdPayment.paymentStatus,
          },
          invoice: {
            id: updatedInvoice.id,
            status: updatedInvoice.status,
            paidAmount: updatedInvoice.paidAmount,
            dueAmount: updatedInvoice.dueAmount,
          },
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}