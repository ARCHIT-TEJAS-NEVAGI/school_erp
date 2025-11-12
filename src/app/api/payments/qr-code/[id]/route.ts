import { NextRequest, NextResponse } from 'next/server';
import razorpayInstance, { isPaymentConfigured } from '@/lib/razorpay';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if payment gateway is configured
    if (!isPaymentConfigured || !razorpayInstance) {
      return NextResponse.json(
        { 
          error: 'Payment gateway is not configured',
          code: 'PAYMENT_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }

    const { id: qrId } = await params;

    if (!qrId) {
      return NextResponse.json(
        { error: 'QR Code ID is required' },
        { status: 400 }
      );
    }

    const qrCode = await razorpayInstance.qrCode.fetch(qrId);

    // Get payment details if QR code has payments
    const payments = qrCode.payments || [];
    const paymentCount = qrCode.payments_count || 0;
    const amountReceived = qrCode.payments_amount_received 
      ? qrCode.payments_amount_received / 100 
      : 0;

    return NextResponse.json({
      id: qrCode.id,
      imageUrl: qrCode.image_url,
      status: qrCode.status,
      usage: qrCode.usage,
      type: qrCode.type,
      amount: qrCode.payment_amount ? qrCode.payment_amount / 100 : null,
      paymentCount,
      amountReceived,
      payments: payments.map((p: any) => ({
        id: p.id,
        amount: p.amount / 100,
        status: p.status,
        method: p.method,
        createdAt: p.created_at
      })),
      createdAt: qrCode.created_at,
      closedAt: qrCode.closed_at,
    }, { status: 200 });

  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: error.error?.description || error.message || 'Failed to fetch QR code',
        code: 'QR_FETCH_FAILED'
      },
      { status: 500 }
    );
  }
}