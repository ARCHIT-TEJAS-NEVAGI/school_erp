import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feeInvoices, paymentInstallments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import razorpayInstance, { isPaymentConfigured } from '@/lib/razorpay';
import { RazorpayOrderOptions, CreateOrderResponse } from '@/lib/types/razorpay';

export async function POST(request: NextRequest) {
  try {
    // Check if payment gateway is configured
    if (!isPaymentConfigured || !razorpayInstance) {
      return NextResponse.json(
        { 
          error: 'Payment gateway is not configured. Please contact the administrator.',
          code: 'PAYMENT_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { invoiceId, paymentType } = body;

    // Validate required fields
    if (!invoiceId) {
      return NextResponse.json(
        { 
          error: 'Invoice ID is required',
          code: 'MISSING_INVOICE_ID'
        },
        { status: 400 }
      );
    }

    if (!paymentType) {
      return NextResponse.json(
        { 
          error: 'Payment type is required',
          code: 'MISSING_PAYMENT_TYPE'
        },
        { status: 400 }
      );
    }

    // Validate paymentType
    if (paymentType !== 'full' && paymentType !== 'emi') {
      return NextResponse.json(
        { 
          error: 'Payment type must be either "full" or "emi"',
          code: 'INVALID_PAYMENT_TYPE'
        },
        { status: 400 }
      );
    }

    // Validate invoiceId is a valid integer
    const parsedInvoiceId = parseInt(invoiceId);
    if (isNaN(parsedInvoiceId)) {
      return NextResponse.json(
        { 
          error: 'Invoice ID must be a valid number',
          code: 'INVALID_INVOICE_ID'
        },
        { status: 400 }
      );
    }

    // Fetch invoice details
    const invoice = await db.select()
      .from(feeInvoices)
      .where(eq(feeInvoices.id, parsedInvoiceId))
      .limit(1);

    if (invoice.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const invoiceData = invoice[0];

    // Validate invoice is not already paid
    if (invoiceData.status === 'paid') {
      return NextResponse.json(
        { 
          error: 'Invoice is already paid',
          code: 'INVOICE_ALREADY_PAID'
        },
        { status: 400 }
      );
    }

    // Validate amount is greater than 0
    if (invoiceData.dueAmount <= 0) {
      return NextResponse.json(
        { 
          error: 'No amount due for this invoice',
          code: 'NO_AMOUNT_DUE'
        },
        { status: 400 }
      );
    }

    let paymentAmount: number;
    let installmentDetails: { installmentNumber: number; totalInstallments: number; dueDate: string } | undefined;

    if (paymentType === 'emi') {
      // Check if EMI plan already exists
      const existingInstallments = await db.select()
        .from(paymentInstallments)
        .where(eq(paymentInstallments.invoiceId, parsedInvoiceId))
        .limit(1);

      if (existingInstallments.length > 0) {
        return NextResponse.json(
          { 
            error: 'EMI plan is already set up for this invoice',
            code: 'EMI_ALREADY_EXISTS'
          },
          { status: 400 }
        );
      }

      // Calculate installment amount
      const installmentAmount = invoiceData.totalAmount / 2;
      paymentAmount = installmentAmount;

      // Create installment records
      const today = new Date();
      const firstDueDate = today.toISOString();
      
      const nextMonth = new Date(today);
      nextMonth.setDate(nextMonth.getDate() + 30);
      const secondDueDate = nextMonth.toISOString();

      // Create first installment
      await db.insert(paymentInstallments)
        .values({
          invoiceId: parsedInvoiceId,
          installmentNumber: 1,
          amount: installmentAmount,
          dueDate: firstDueDate,
          paidAmount: 0,
          status: 'pending',
          createdAt: new Date().toISOString()
        });

      // Create second installment
      await db.insert(paymentInstallments)
        .values({
          invoiceId: parsedInvoiceId,
          installmentNumber: 2,
          amount: installmentAmount,
          dueDate: secondDueDate,
          paidAmount: 0,
          status: 'pending',
          createdAt: new Date().toISOString()
        });

      // Update fee invoice with payment type
      await db.update(feeInvoices)
        .set({
          status: 'partial'
        })
        .where(eq(feeInvoices.id, parsedInvoiceId));

      installmentDetails = {
        installmentNumber: 1,
        totalInstallments: 2,
        dueDate: firstDueDate
      };
    } else {
      // Full payment
      paymentAmount = invoiceData.dueAmount;
    }

    // Validate payment amount
    if (paymentAmount <= 0) {
      return NextResponse.json(
        { 
          error: 'Payment amount must be greater than 0',
          code: 'INVALID_AMOUNT'
        },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const orderOptions: RazorpayOrderOptions = {
      amount: Math.round(paymentAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: `receipt_${parsedInvoiceId}_${Date.now()}`,
      payment_capture: 1, // Auto-capture
      notes: {
        invoiceId: parsedInvoiceId.toString(),
        paymentType: paymentType,
        installmentNumber: paymentType === 'emi' ? '1' : '',
        invoiceNumber: invoiceData.invoiceNumber
      }
    };

    const order = await razorpayInstance.orders.create(orderOptions);

    // Prepare response
    const response: CreateOrderResponse & { installmentDetails?: typeof installmentDetails; paymentType: string } = {
      orderId: order.id,
      amount: paymentAmount,
      currency: order.currency,
      paymentType: paymentType
    };

    if (installmentDetails) {
      response.installmentDetails = installmentDetails;
    }

    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('POST error:', error);
    
    // Handle Razorpay-specific errors
    if (error.statusCode) {
      return NextResponse.json(
        { 
          error: 'Razorpay error: ' + error.error?.description || error.message,
          code: 'RAZORPAY_ERROR'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error.message 
      },
      { status: 500 }
    );
  }
}