"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Download, CreditCard, AlertCircle, QrCode, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import RazorpayQRCode from '@/components/RazorpayQRCode';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  status: string;
}

export default function ParentFeesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentType, setPaymentType] = useState<'full' | 'emi'>('full');
  const [paymentMethod, setPaymentMethod] = useState<'checkout' | 'qr'>('checkout');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentConfigured, setPaymentConfigured] = useState(true);

  useEffect(() => {
    fetchInvoices();
    loadRazorpayScript();
    checkPaymentConfiguration();
  }, []);

  const checkPaymentConfiguration = () => {
    // Check if Razorpay public key is configured
    const isConfigured = 
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && 
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID !== 'your_razorpay_key_id_here';
    setPaymentConfigured(!!isConfigured);
  };

  const loadRazorpayScript = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/fee-invoices?studentId=1&limit=20');
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = (invoice: Invoice) => {
    if (!paymentConfigured) {
      toast.error('Payment gateway is not configured. Please contact the administrator.');
      return;
    }
    setSelectedInvoice(invoice);
    setShowPaymentDialog(true);
  };

  const handleDownloadInvoice = async (invoiceId: number) => {
    try {
      const response = await fetch(`/api/payments/invoice-pdf?invoiceId=${invoiceId}`);
      
      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to download invoice');
        return;
      }

      const html = await response.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const handlePayment = async () => {
    if (!selectedInvoice) return;

    if (!paymentConfigured) {
      toast.error('Payment gateway is not configured. Please contact the administrator.');
      return;
    }

    // If QR payment method selected, show QR dialog
    if (paymentMethod === 'qr') {
      setShowPaymentDialog(false);
      setShowQRDialog(true);
      return;
    }

    // Otherwise proceed with Razorpay checkout
    try {
      setProcessing(true);
      
      // Create Razorpay order
      const orderResponse = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          paymentType: paymentType,
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        toast.error(error.error || 'Failed to create order');
        setProcessing(false);
        return;
      }

      const { orderId, amount, installmentDetails } = await orderResponse.json();

      if (paymentType === 'emi' && installmentDetails) {
        toast.info(`EMI Plan: First installment of ₹${amount.toFixed(2)} due on ${new Date(installmentDetails.dueDate).toLocaleDateString()}`);
      }

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh the page and try again.');
        setProcessing(false);
        return;
      }

      // Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: orderId,
        amount: amount * 100,
        currency: 'INR',
        name: 'School ERP',
        description: `Payment for ${selectedInvoice.invoiceNumber}`,
        image: 'https://img.icons8.com/ios-filled/100/000000/school.png',
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payments/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                invoiceId: selectedInvoice.id,
              }),
            });

            if (!verifyResponse.ok) {
              const error = await verifyResponse.json();
              toast.error(error.error || 'Payment verification failed');
              return;
            }

            toast.success('Payment successful! Dashboard will update shortly.');
            // Refresh invoices to show updated data
            await fetchInvoices();
            setShowPaymentDialog(false);
          } catch (err) {
            console.error('Payment verification error:', err);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#3399cc',
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled');
            setProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setProcessing(false);

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const handleQRPaymentClose = async () => {
    setShowQRDialog(false);
    // Refresh invoices to check if payment was received
    await fetchInvoices();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'partial':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const pendingAmount = invoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + inv.dueAmount, 0);

  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Fee Management</h1>
          <p className="text-muted-foreground">Manage and pay your child's fees</p>
        </div>

        {/* Payment Configuration Warning */}
        {!paymentConfigured && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Payment gateway is not configured. Please contact the school administrator to set up Razorpay payment integration.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">₹{pendingAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">To be paid</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{totalPaid.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No invoices found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{invoice.invoiceNumber}</h3>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Amount</p>
                          <p className="font-medium">₹{invoice.totalAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Paid Amount</p>
                          <p className="font-medium text-green-600">₹{invoice.paidAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Due Amount</p>
                          <p className="font-medium text-red-600">₹{invoice.dueAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Due Date</p>
                          <p className="font-medium">
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {invoice.status === 'paid' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Receipt
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handlePayNow(invoice)}
                          disabled={!paymentConfigured}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Choose your payment option for invoice {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Amount Due</p>
              <p className="text-3xl font-bold">₹{selectedInvoice?.dueAmount.toFixed(2)}</p>
            </div>

            <div className="space-y-3">
              <Label>Payment Type</Label>
              <RadioGroup value={paymentType} onValueChange={(val) => setPaymentType(val as 'full' | 'emi')}>
                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">Pay Full Amount</p>
                      <p className="text-sm text-muted-foreground">
                        Pay ₹{selectedInvoice?.dueAmount.toFixed(2)} now
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="emi" id="emi" />
                  <Label htmlFor="emi" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">Pay in 2 Installments</p>
                      <p className="text-sm text-muted-foreground">
                        2 payments of ₹{selectedInvoice ? (selectedInvoice.dueAmount / 2).toFixed(2) : '0.00'} each
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Payment Method</Label>
              {!paymentConfigured ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Payment Gateway Not Configured</strong>
                    <p className="text-sm mt-1">
                      The payment system is currently unavailable. Please contact the school administrator to configure Razorpay payment gateway.
                    </p>
                    <p className="text-sm mt-2 font-medium">
                      Administrator: Add your Razorpay API keys to the environment configuration to enable payments.
                    </p>
                  </AlertDescription>
                </Alert>
              ) : (
                <RadioGroup value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as 'checkout' | 'qr')}>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="checkout" id="checkout" />
                    <Label htmlFor="checkout" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <div>
                          <p className="font-medium">Online Payment</p>
                          <p className="text-sm text-muted-foreground">
                            UPI, Cards, Net Banking
                          </p>
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="qr" id="qr" />
                    <Label htmlFor="qr" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        <div>
                          <p className="font-medium">UPI QR Code</p>
                          <p className="text-sm text-muted-foreground">
                            Scan & pay with any UPI app
                          </p>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                className="flex-1"
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                className="flex-1"
                disabled={processing || !paymentConfigured}
              >
                {processing ? 'Processing...' : 'Proceed to Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Payment Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay with UPI QR Code</DialogTitle>
            <DialogDescription>
              Scan the QR code with any UPI app to complete payment
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <RazorpayQRCode
              amount={paymentType === 'full' ? selectedInvoice.dueAmount : selectedInvoice.dueAmount / 2}
              description={`Payment for ${selectedInvoice.invoiceNumber}`}
              onClose={handleQRPaymentClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}