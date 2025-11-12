import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feeInvoices, students, users, academicYears, feePayments, paymentInstallments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json();

    // Validate required fields
    if (!invoiceId) {
      return NextResponse.json({ 
        error: "Invoice ID is required",
        code: "MISSING_INVOICE_ID" 
      }, { status: 400 });
    }

    // Validate invoiceId is a valid integer
    if (isNaN(parseInt(invoiceId))) {
      return NextResponse.json({ 
        error: "Valid invoice ID is required",
        code: "INVALID_INVOICE_ID" 
      }, { status: 400 });
    }

    const parsedInvoiceId = parseInt(invoiceId);

    // Fetch invoice details with joins
    const invoiceResult = await db.select({
      invoiceId: feeInvoices.id,
      invoiceNumber: feeInvoices.invoiceNumber,
      totalAmount: feeInvoices.totalAmount,
      paidAmount: feeInvoices.paidAmount,
      dueAmount: feeInvoices.dueAmount,
      status: feeInvoices.status,
      dueDate: feeInvoices.dueDate,
      invoiceCreatedAt: feeInvoices.createdAt,
      studentId: students.id,
      admissionNumber: students.admissionNumber,
      rollNumber: students.rollNumber,
      dateOfBirth: students.dateOfBirth,
      gender: students.gender,
      bloodGroup: students.bloodGroup,
      address: students.address,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      yearName: academicYears.yearName,
      academicYearStartDate: academicYears.startDate,
      academicYearEndDate: academicYears.endDate,
    })
      .from(feeInvoices)
      .innerJoin(students, eq(feeInvoices.studentId, students.id))
      .innerJoin(users, eq(students.userId, users.id))
      .leftJoin(academicYears, eq(feeInvoices.academicYearId, academicYears.id))
      .where(eq(feeInvoices.id, parsedInvoiceId))
      .limit(1);

    if (invoiceResult.length === 0) {
      return NextResponse.json({ 
        error: 'Invoice not found' 
      }, { status: 404 });
    }

    const invoice = invoiceResult[0];

    // Validate invoice is paid
    if (invoice.status !== 'paid') {
      return NextResponse.json({ 
        error: "Invoice must be fully paid to generate PDF",
        code: "INVOICE_NOT_PAID",
        currentStatus: invoice.status
      }, { status: 400 });
    }

    // Fetch all payments for this invoice
    const payments = await db.select({
      id: feePayments.id,
      amount: feePayments.amount,
      paymentMethod: feePayments.paymentMethod,
      paymentDate: feePayments.paymentDate,
      transactionId: feePayments.transactionId,
      stripePaymentId: feePayments.stripePaymentId,
      paymentStatus: feePayments.paymentStatus,
    })
      .from(feePayments)
      .where(eq(feePayments.invoiceId, parsedInvoiceId));

    // Validate all payments are completed
    const incompletedPayments = payments.filter(p => p.paymentStatus !== 'completed');
    if (incompletedPayments.length > 0) {
      return NextResponse.json({ 
        error: "All payments must be completed to generate PDF",
        code: "INCOMPLETE_PAYMENTS",
        incompletedCount: incompletedPayments.length
      }, { status: 400 });
    }

    // Fetch installments if any
    const installments = await db.select({
      id: paymentInstallments.id,
      installmentNumber: paymentInstallments.installmentNumber,
      amount: paymentInstallments.amount,
      dueDate: paymentInstallments.dueDate,
      paidAmount: paymentInstallments.paidAmount,
      status: paymentInstallments.status,
      paymentId: paymentInstallments.paymentId,
    })
      .from(paymentInstallments)
      .where(eq(paymentInstallments.invoiceId, parsedInvoiceId));

    // If EMI, validate all installments are paid
    if (installments.length > 0) {
      const unpaidInstallments = installments.filter(i => i.status !== 'paid');
      if (unpaidInstallments.length > 0) {
        return NextResponse.json({ 
          error: "All installments must be paid to generate PDF",
          code: "UNPAID_INSTALLMENTS",
          unpaidCount: unpaidInstallments.length
        }, { status: 400 });
      }
    }

    // Format dates for display
    const formatDate = (dateString: string | null) => {
      if (!dateString) return 'N/A';
      try {
        return new Date(dateString).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      } catch {
        return dateString;
      }
    };

    const formatCurrency = (amount: number | null) => {
      if (amount === null || amount === undefined) return '₹0.00';
      return `₹${amount.toFixed(2)}`;
    };

    // Generate HTML invoice
    const htmlInvoice = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${invoice.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 20px;
    }
    
    .invoice-container {
      max-width: 900px;
      margin: 0 auto;
      background: #fff;
      border: 2px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .header p {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .invoice-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      padding: 30px;
      background: #f8f9fa;
      border-bottom: 2px solid #ddd;
    }
    
    .detail-box {
      background: white;
      padding: 20px;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .detail-box h3 {
      color: #667eea;
      font-size: 16px;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px solid #667eea;
      padding-bottom: 8px;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    
    .detail-row:last-child {
      border-bottom: none;
    }
    
    .detail-label {
      font-weight: 600;
      color: #666;
      font-size: 14px;
    }
    
    .detail-value {
      color: #333;
      font-size: 14px;
      text-align: right;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status-paid {
      background: #d4edda;
      color: #155724;
    }
    
    .content-section {
      padding: 30px;
    }
    
    .section-title {
      color: #667eea;
      font-size: 20px;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-radius: 6px;
      overflow: hidden;
    }
    
    thead {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    th {
      padding: 15px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 13px;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 15px;
      border-bottom: 1px solid #eee;
    }
    
    tbody tr:hover {
      background: #f8f9fa;
    }
    
    tbody tr:last-child td {
      border-bottom: none;
    }
    
    .amount-summary {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 25px;
      border-radius: 8px;
      margin-top: 30px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 16px;
    }
    
    .summary-total {
      border-top: 3px solid #667eea;
      padding-top: 15px;
      margin-top: 10px;
      font-weight: 700;
      font-size: 20px;
      color: #667eea;
    }
    
    .footer {
      background: #f8f9fa;
      padding: 30px;
      margin-top: 30px;
      border-top: 2px solid #ddd;
    }
    
    .footer-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 20px;
    }
    
    .signature-box {
      text-align: center;
      padding: 20px;
      background: white;
      border-radius: 6px;
      border: 2px dashed #ddd;
    }
    
    .signature-line {
      border-top: 2px solid #333;
      margin: 40px 0 10px 0;
    }
    
    .terms {
      font-size: 12px;
      color: #666;
      line-height: 1.8;
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin-top: 20px;
    }
    
    .terms h4 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 14px;
      text-transform: uppercase;
    }
    
    .terms ul {
      margin-left: 20px;
    }
    
    .generated-at {
      text-align: center;
      color: #999;
      font-size: 12px;
      padding: 20px 0;
      border-top: 1px solid #ddd;
      margin-top: 20px;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .invoice-container {
        border: none;
        box-shadow: none;
      }
      
      @page {
        margin: 1cm;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <h1>Payment Receipt</h1>
      <p>School Management System - Official Invoice</p>
    </div>
    
    <!-- Invoice & Student Details -->
    <div class="invoice-details">
      <div class="detail-box">
        <h3>Invoice Information</h3>
        <div class="detail-row">
          <span class="detail-label">Invoice Number:</span>
          <span class="detail-value"><strong>${invoice.invoiceNumber}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Invoice Date:</span>
          <span class="detail-value">${formatDate(invoice.invoiceCreatedAt)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Due Date:</span>
          <span class="detail-value">${formatDate(invoice.dueDate)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value">
            <span class="status-badge status-paid">${invoice.status}</span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Academic Year:</span>
          <span class="detail-value">${invoice.yearName || 'N/A'}</span>
        </div>
      </div>
      
      <div class="detail-box">
        <h3>Student Information</h3>
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value"><strong>${invoice.fullName}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Admission No:</span>
          <span class="detail-value">${invoice.admissionNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Roll Number:</span>
          <span class="detail-value">${invoice.rollNumber || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${invoice.email}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value">${invoice.phone || 'N/A'}</span>
        </div>
      </div>
    </div>
    
    <!-- Payment Details -->
    <div class="content-section">
      <h2 class="section-title">Payment Details</h2>
      <table>
        <thead>
          <tr>
            <th>Payment Date</th>
            <th>Payment Method</th>
            <th>Transaction ID</th>
            <th style="text-align: right;">Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${payments.map(payment => `
            <tr>
              <td>${formatDate(payment.paymentDate)}</td>
              <td style="text-transform: capitalize;">${payment.paymentMethod}</td>
              <td><code>${payment.transactionId || payment.stripePaymentId || 'N/A'}</code></td>
              <td style="text-align: right;"><strong>${formatCurrency(payment.amount)}</strong></td>
              <td><span class="status-badge status-paid">${payment.paymentStatus}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      ${installments.length > 0 ? `
        <h2 class="section-title">Installment Details</h2>
        <table>
          <thead>
            <tr>
              <th>Installment #</th>
              <th>Due Date</th>
              <th style="text-align: right;">Amount</th>
              <th style="text-align: right;">Paid Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${installments.map(inst => `
              <tr>
                <td><strong>Installment ${inst.installmentNumber}</strong></td>
                <td>${formatDate(inst.dueDate)}</td>
                <td style="text-align: right;">${formatCurrency(inst.amount)}</td>
                <td style="text-align: right;"><strong>${formatCurrency(inst.paidAmount)}</strong></td>
                <td><span class="status-badge status-paid">${inst.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
      
      <!-- Amount Summary -->
      <div class="amount-summary">
        <div class="summary-row">
          <span>Total Amount:</span>
          <span><strong>${formatCurrency(invoice.totalAmount)}</strong></span>
        </div>
        <div class="summary-row">
          <span>Amount Paid:</span>
          <span><strong>${formatCurrency(invoice.paidAmount)}</strong></span>
        </div>
        <div class="summary-row">
          <span>Due Amount:</span>
          <span><strong>${formatCurrency(invoice.dueAmount)}</strong></span>
        </div>
        <div class="summary-row summary-total">
          <span>Final Amount:</span>
          <span>${formatCurrency(invoice.totalAmount)}</span>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-content">
        <div class="signature-box">
          <div class="signature-line"></div>
          <strong>Authorized Signature</strong>
          <p style="font-size: 12px; color: #666; margin-top: 5px;">School Authority</p>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <strong>Student/Parent Signature</strong>
          <p style="font-size: 12px; color: #666; margin-top: 5px;">Acknowledgment</p>
        </div>
      </div>
      
      <div class="terms">
        <h4>Terms & Conditions:</h4>
        <ul>
          <li>This is a computer-generated invoice and does not require a physical signature.</li>
          <li>Please keep this invoice for your records.</li>
          <li>All fees once paid are non-refundable except under special circumstances.</li>
          <li>For any queries, please contact the school administration office.</li>
          <li>Payment confirmation may take 2-3 business days to reflect in your account.</li>
        </ul>
      </div>
      
      <div class="generated-at">
        Generated on: ${new Date().toLocaleString('en-IN', { 
          dateStyle: 'full', 
          timeStyle: 'medium' 
        })}
      </div>
    </div>
  </div>
  
  <script>
    // Auto-print functionality
    window.onload = function() {
      // Uncomment the line below to enable auto-print
      // window.print();
    };
  </script>
</body>
</html>
    `;

    // Return HTML with proper headers for rendering/printing
    return new NextResponse(htmlInvoice, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="invoice-${invoice.invoiceNumber}.html"`,
      },
    });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}