import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feeInvoices, feePayments, paymentInstallments, notifications, students } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { WebhookPayload } from '@/lib/types/razorpay';

async function getRawBody(request: NextRequest): Promise<string> {
  const chunks = [];
  const reader = request.body?.getReader();
  if (!reader) throw new Error('No request body');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks).toString('utf-8');
}

function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const generated_signature = hmac.digest('hex');
  return generated_signature === signature;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await getRawBody(request);
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      console.warn('Missing webhook signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ 
        error: 'Webhook secret not configured',
        code: 'MISSING_WEBHOOK_SECRET' 
      }, { status: 500 });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse body
    const payload: WebhookPayload = JSON.parse(rawBody);

    console.log(`Webhook event received: ${payload.event}`);

    // Handle different events
    switch (payload.event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;

      case 'order.paid':
        console.log('Order marked as paid:', payload.payload.order?.entity.id);
        break;

      default:
        console.log(`Unhandled event: ${payload.event}`);
    }

    // Always return 200 to acknowledge webhook
    return NextResponse.json(
      { success: true, message: 'Webhook processed' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent Razorpay retries
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 200 }
    );
  }
}

async function handlePaymentCaptured(payload: WebhookPayload) {
  try {
    const payment = payload.payload.payment.entity;
    const notes = payment.notes;

    const invoiceId = notes.invoiceId ? parseInt(notes.invoiceId) : null;
    const paymentType = notes.paymentType; // 'full' or 'emi'
    const installmentNumber = notes.installmentNumber ? parseInt(notes.installmentNumber) : null;
    const amount = payment.amount / 100; // Convert from paise to rupees

    if (!invoiceId || !paymentType) {
      console.error('Missing required notes:', notes);
      return;
    }

    const invoice = await db.select()
      .from(feeInvoices)
      .where(eq(feeInvoices.id, invoiceId))
      .limit(1);

    if (invoice.length === 0) {
      console.error('Invoice not found:', invoiceId);
      return;
    }

    const invoiceData = invoice[0];

    const newPayment = await db.insert(feePayments)
      .values({
        invoiceId: invoiceId,
        amount: amount,
        paymentMethod: 'online',
        paymentDate: new Date().toISOString(),
        transactionId: payment.id,
        stripePaymentId: payment.id,
        paymentStatus: 'completed',
        createdAt: new Date().toISOString(),
      })
      .returning();

    const paymentId = newPayment[0].id;

    if (paymentType === 'emi' && installmentNumber) {
      const installment = await db.select()
        .from(paymentInstallments)
        .where(
          and(
            eq(paymentInstallments.invoiceId, invoiceId),
            eq(paymentInstallments.installmentNumber, installmentNumber)
          )
        )
        .limit(1);

      if (installment.length > 0) {
        await db.update(paymentInstallments)
          .set({
            paidAmount: amount,
            status: 'paid',
            paymentId: paymentId,
          })
          .where(eq(paymentInstallments.id, installment[0].id));
      }

      const updatedPaidAmount = invoiceData.paidAmount + amount;
      const updatedDueAmount = invoiceData.dueAmount - amount;

      const allInstallments = await db.select()
        .from(paymentInstallments)
        .where(eq(paymentInstallments.invoiceId, invoiceId));

      const allPaid = allInstallments.every(inst => inst.status === 'paid');

      let newStatus = invoiceData.status;
      if (allPaid && updatedDueAmount <= 0) {
        newStatus = 'paid';
      } else if (updatedPaidAmount > 0 && updatedDueAmount > 0) {
        newStatus = 'partial';
      }

      await db.update(feeInvoices)
        .set({
          paidAmount: updatedPaidAmount,
          dueAmount: updatedDueAmount,
          status: newStatus,
        })
        .where(eq(feeInvoices.id, invoiceId));

      const student = await db.select()
        .from(students)
        .where(eq(students.id, invoiceData.studentId))
        .limit(1);

      if (student.length > 0) {
        await db.insert(notifications)
          .values({
            recipientId: student[0].userId,
            title: 'EMI Payment Successful',
            message: `Your installment #${installmentNumber} payment of ₹${amount.toFixed(2)} for invoice ${invoiceData.invoiceNumber} has been processed successfully. Transaction ID: ${payment.id}`,
            type: 'fee',
            isRead: false,
            sentViaWhatsapp: false,
            createdAt: new Date().toISOString(),
          });
      }

    } else if (paymentType === 'full') {
      const updatedPaidAmount = invoiceData.paidAmount + amount;
      const updatedDueAmount = invoiceData.dueAmount - amount;

      let newStatus = invoiceData.status;
      if (updatedDueAmount <= 0) {
        newStatus = 'paid';
      } else if (updatedPaidAmount > 0 && updatedDueAmount > 0) {
        newStatus = 'partial';
      }

      await db.update(feeInvoices)
        .set({
          paidAmount: updatedPaidAmount,
          dueAmount: updatedDueAmount,
          status: newStatus,
        })
        .where(eq(feeInvoices.id, invoiceId));

      const student = await db.select()
        .from(students)
        .where(eq(students.id, invoiceData.studentId))
        .limit(1);

      if (student.length > 0) {
        await db.insert(notifications)
          .values({
            recipientId: student[0].userId,
            title: 'Payment Successful',
            message: `Your payment of ₹${amount.toFixed(2)} for invoice ${invoiceData.invoiceNumber} has been processed successfully. Transaction ID: ${payment.id}`,
            type: 'fee',
            isRead: false,
            sentViaWhatsapp: false,
            createdAt: new Date().toISOString(),
          });
      }
    }

    console.log('Payment captured processed:', payment.id);

  } catch (error: any) {
    console.error('Error handling payment captured:', error);
  }
}

async function handlePaymentFailed(payload: WebhookPayload) {
  try {
    const payment = payload.payload.payment.entity;
    const notes = payment.notes;

    const invoiceId = notes.invoiceId ? parseInt(notes.invoiceId) : null;

    if (!invoiceId) {
      console.error('Missing invoiceId in notes:', notes);
      return;
    }

    const invoice = await db.select()
      .from(feeInvoices)
      .where(eq(feeInvoices.id, invoiceId))
      .limit(1);

    if (invoice.length === 0) {
      console.error('Invoice not found:', invoiceId);
      return;
    }

    const invoiceData = invoice[0];

    await db.insert(feePayments)
      .values({
        invoiceId: invoiceId,
        amount: payment.amount / 100,
        paymentMethod: 'online',
        paymentDate: new Date().toISOString(),
        transactionId: payment.id,
        stripePaymentId: payment.id,
        paymentStatus: 'failed',
        createdAt: new Date().toISOString(),
      });

    const student = await db.select()
      .from(students)
      .where(eq(students.id, invoiceData.studentId))
      .limit(1);

    if (student.length > 0) {
      await db.insert(notifications)
        .values({
          recipientId: student[0].userId,
          title: 'Payment Failed',
          message: `Your payment for invoice ${invoiceData.invoiceNumber} has failed. Please try again or contact support. Transaction ID: ${payment.id}`,
          type: 'fee',
          isRead: false,
          sentViaWhatsapp: false,
          createdAt: new Date().toISOString(),
        });
    }

    console.log('Payment failure processed:', payment.id);

  } catch (error: any) {
    console.error('Error handling payment failure:', error);
  }
}