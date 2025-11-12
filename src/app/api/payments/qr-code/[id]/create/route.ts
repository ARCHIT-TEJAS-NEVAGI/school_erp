import { NextRequest, NextResponse } from 'next/server';
import razorpayInstance, { isPaymentConfigured } from '@/lib/razorpay';

interface CreateQRRequest {
  type?: 'upi_qr' | 'bharat_qr';
  usage?: 'single_use' | 'multiple_use';
  fixed_amount?: boolean;
  amount?: number;
  name?: string;
  description?: string;
  notes?: Record<string, string>;
}

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

    const body: CreateQRRequest = await request.json();

    // Single-use QR codes require fixed_amount: true
    if (body.usage === 'single_use' && !body.fixed_amount) {
      return NextResponse.json(
        { error: 'single_use QR codes must have fixed_amount: true' },
        { status: 400 }
      );
    }

    const params: any = {
      type: body.type || 'upi_qr',
      usage: body.usage || 'multiple_use',
      fixed_amount: body.fixed_amount ?? false,
    };

    if (body.amount) {
      params.payment_amount = Math.round(body.amount * 100); // Convert to paise
    }

    if (body.name) {
      params.name = body.name;
    }

    if (body.description) {
      params.description = body.description;
    }

    if (body.notes) {
      params.notes = body.notes;
    }

    const qrCode = await razorpayInstance.qrCode.create(params);

    return NextResponse.json({
      id: qrCode.id,
      imageUrl: qrCode.image_url,
      status: qrCode.status,
      usage: qrCode.usage,
      type: qrCode.type,
      amount: qrCode.payment_amount ? qrCode.payment_amount / 100 : null,
      createdAt: qrCode.created_at,
    }, { status: 201 });

  } catch (error: any) {
    console.error('QR Code creation error:', error);
    return NextResponse.json(
      { 
        error: error.error?.description || error.message || 'Failed to create QR code',
        code: 'QR_CREATION_FAILED'
      },
      { status: 500 }
    );
  }
}