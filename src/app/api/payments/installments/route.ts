import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feeInvoices, paymentInstallments, feePayments } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');

    // Validate invoiceId parameter
    if (!invoiceId) {
      return NextResponse.json(
        { 
          error: 'invoiceId parameter is required',
          code: 'MISSING_INVOICE_ID'
        },
        { status: 400 }
      );
    }

    // Validate invoiceId is valid integer
    const parsedInvoiceId = parseInt(invoiceId);
    if (isNaN(parsedInvoiceId)) {
      return NextResponse.json(
        { 
          error: 'invoiceId must be a valid integer',
          code: 'INVALID_INVOICE_ID'
        },
        { status: 400 }
      );
    }

    // Fetch invoice details
    const invoice = await db
      .select({
        id: feeInvoices.id,
        invoiceNumber: feeInvoices.invoiceNumber,
        totalAmount: feeInvoices.totalAmount,
        status: feeInvoices.status,
      })
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

    // Fetch all installments for this invoice
    const installmentsData = await db
      .select({
        id: paymentInstallments.id,
        installmentNumber: paymentInstallments.installmentNumber,
        amount: paymentInstallments.amount,
        dueDate: paymentInstallments.dueDate,
        paidAmount: paymentInstallments.paidAmount,
        status: paymentInstallments.status,
        paymentId: paymentInstallments.paymentId,
      })
      .from(paymentInstallments)
      .where(eq(paymentInstallments.invoiceId, parsedInvoiceId))
      .orderBy(asc(paymentInstallments.installmentNumber));

    // For each installment with paymentId, fetch payment details
    const installmentsWithPayments = await Promise.all(
      installmentsData.map(async (installment) => {
        if (installment.paymentId) {
          const payment = await db
            .select({
              id: feePayments.id,
              paymentDate: feePayments.paymentDate,
              stripePaymentId: feePayments.stripePaymentId,
              transactionId: feePayments.transactionId,
            })
            .from(feePayments)
            .where(eq(feePayments.id, installment.paymentId))
            .limit(1);

          return {
            id: installment.id,
            installmentNumber: installment.installmentNumber,
            amount: installment.amount,
            dueDate: installment.dueDate,
            paidAmount: installment.paidAmount,
            status: installment.status,
            payment: payment.length > 0 ? payment[0] : undefined,
          };
        }

        return {
          id: installment.id,
          installmentNumber: installment.installmentNumber,
          amount: installment.amount,
          dueDate: installment.dueDate,
          paidAmount: installment.paidAmount,
          status: installment.status,
        };
      })
    );

    // Calculate summary statistics
    const totalInstallments = installmentsWithPayments.length;
    const paidInstallments = installmentsWithPayments.filter(
      (inst) => inst.status === 'paid'
    ).length;
    const pendingInstallments = installmentsWithPayments.filter(
      (inst) => inst.status === 'pending' || inst.status === 'overdue'
    ).length;
    const totalPaid = installmentsWithPayments.reduce(
      (sum, inst) => sum + (inst.paidAmount || 0),
      0
    );
    const totalPending = installmentsWithPayments.reduce(
      (sum, inst) => sum + (inst.amount - (inst.paidAmount || 0)),
      0
    );

    // Return response
    return NextResponse.json({
      invoice: {
        id: invoiceData.id,
        invoiceNumber: invoiceData.invoiceNumber,
        totalAmount: invoiceData.totalAmount,
        status: invoiceData.status,
      },
      installments: installmentsWithPayments,
      summary: {
        totalInstallments,
        paidInstallments,
        pendingInstallments,
        totalPaid,
        totalPending,
      },
    });
  } catch (error) {
    console.error('GET installments error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}