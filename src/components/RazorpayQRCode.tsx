'use client';

import { useEffect, useState } from 'react';
import { Loader2, QrCode as QrIcon, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RazorpayQRCodeProps {
  amount?: number;
  description?: string;
  onClose?: () => void;
}

interface QRCodeData {
  id: string;
  imageUrl: string;
  status: string;
  usage: string;
  type: string;
  amount: number | null;
  paymentCount: number;
  amountReceived: number;
  createdAt: number;
}

export default function RazorpayQRCode({ 
  amount = 100, 
  description = 'School ERP Payment',
  onClose 
}: RazorpayQRCodeProps) {
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [paymentNotConfigured, setPaymentNotConfigured] = useState(false);

  useEffect(() => {
    const createQRCode = async () => {
      try {
        const res = await fetch('/api/payments/qr-code/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'upi_qr',
            usage: 'single_use',
            fixed_amount: true,
            amount: amount,
            name: 'School ERP',
            description: description,
            notes: {
              purpose: 'fee_payment',
              timestamp: new Date().toISOString()
            }
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          
          // Check if payment gateway is not configured
          if (errorData.code === 'PAYMENT_NOT_CONFIGURED') {
            setPaymentNotConfigured(true);
            setError(errorData.error);
          } else {
            throw new Error(errorData.error || 'Failed to create QR code');
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        setQrData(data);
        setPolling(true);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    createQRCode();
  }, [amount, description]);

  // Poll for payment status
  useEffect(() => {
    if (!polling || !qrData?.id) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/qr-code/${qrData.id}`);
        if (res.ok) {
          const data = await res.json();
          
          // Check if payment received
          if (data.paymentCount > 0 || data.amountReceived > 0) {
            setPolling(false);
            setQrData(data);
            
            if (onClose) {
              setTimeout(() => {
                onClose();
              }, 2000);
            }
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [polling, qrData?.id, onClose]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Generating QR Code...</p>
      </div>
    );
  }

  if (paymentNotConfigured) {
    return (
      <div className="flex flex-col items-center p-6">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Payment Gateway Not Configured</strong>
            <p className="text-sm mt-2">
              The Razorpay payment gateway is currently not configured. Please contact the school administrator to set up payment integration.
            </p>
            <p className="text-sm mt-2 font-medium">
              Administrator: Add your Razorpay API keys (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) to the environment configuration to enable QR code payments.
            </p>
          </AlertDescription>
        </Alert>
        {onClose && (
          <Button 
            variant="outline" 
            onClick={onClose}
            className="mt-2"
          >
            Close
          </Button>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center p-6 bg-destructive/10 rounded-lg">
        <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-sm text-destructive text-center">{error}</p>
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
          {onClose && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!qrData) return null;

  return (
    <div className="relative flex flex-col items-center gap-4 p-6 bg-card rounded-lg border">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 hover:bg-accent rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="flex items-center gap-2 text-primary">
        <QrIcon className="h-5 w-5" />
        <h3 className="font-semibold">Scan to Pay</h3>
      </div>

      {/* QR Code Display */}
      <div className="bg-white p-4 rounded-lg border-2 border-dashed">
        <img 
          src={qrData.imageUrl} 
          alt="Razorpay QR Code" 
          className="w-64 h-64 object-contain"
        />
      </div>

      {/* Payment Details */}
      <div className="w-full space-y-2 text-center">
        {qrData.amount && (
          <p className="text-2xl font-bold text-primary">
            ₹{qrData.amount}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Scan with any UPI app to pay
        </p>
        
        {polling && (
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Waiting for payment...</span>
          </div>
        )}

        {qrData.paymentCount > 0 && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              ✓ Payment Received: ₹{qrData.amountReceived}
            </p>
          </div>
        )}
      </div>

      <div className="w-full pt-4 border-t space-y-1 text-xs text-muted-foreground">
        <p>• Supports all UPI apps (Google Pay, PhonePe, Paytm, etc.)</p>
        <p>• Payment is processed instantly</p>
        <p>• Single-use QR code (expires after payment)</p>
      </div>
    </div>
  );
}