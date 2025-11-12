import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feeInvoices, students, users, sections, classes, academicYears, feePayments, paymentInstallments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const invoiceId = searchParams.get('invoiceId');

    // Validate invoiceId
    if (!invoiceId || isNaN(parseInt(invoiceId))) {
      return NextResponse.json({ 
        error: "Valid invoice ID is required",
        code: "INVALID_INVOICE_ID" 
      }, { status: 400 });
    }

    const parsedInvoiceId = parseInt(invoiceId);

    // Fetch invoice details with joins
    const invoiceResult = await db.select({
      // Invoice fields
      invoiceId: feeInvoices.id,
      invoiceNumber: feeInvoices.invoiceNumber,
      totalAmount: feeInvoices.totalAmount,
      paidAmount: feeInvoices.paidAmount,
      dueAmount: feeInvoices.dueAmount,
      status: feeInvoices.status,
      invoiceCreatedAt: feeInvoices.createdAt,
      dueDate: feeInvoices.dueDate,
      // Student fields
      studentId: students.id,
      admissionNumber: students.admissionNumber,
      rollNumber: students.rollNumber,
      // User fields
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      // Section fields
      sectionName: sections.sectionName,
      // Class fields
      className: classes.className,
      // Academic year fields
      yearName: academicYears.yearName,
    })
      .from(feeInvoices)
      .innerJoin(students, eq(feeInvoices.studentId, students.id))
      .innerJoin(users, eq(students.userId, users.id))
      .leftJoin(sections, eq(students.sectionId, sections.id))
      .leftJoin(classes, eq(sections.classId, classes.id))
      .leftJoin(academicYears, eq(feeInvoices.academicYearId, academicYears.id))
      .where(eq(feeInvoices.id, parsedInvoiceId))
      .limit(1);

    if (invoiceResult.length === 0) {
      return NextResponse.json({ 
        error: 'Invoice not found',
        code: "INVOICE_NOT_FOUND" 
      }, { status: 404 });
    }

    const invoice = invoiceResult[0];

    // Validate invoice status
    if (invoice.status !== 'paid') {
      return NextResponse.json({ 
        error: "Invoice must be fully paid to download receipt",
        code: "INVOICE_NOT_PAID" 
      }, { status: 400 });
    }

    // Fetch all payments for this invoice
    const payments = await db.select()
      .from(feePayments)
      .where(eq(feePayments.invoiceId, parsedInvoiceId));

    // Validate all payments are completed
    const hasIncompletePayments = payments.some(p => p.paymentStatus !== 'completed');
    if (hasIncompletePayments) {
      return NextResponse.json({ 
        error: "All payments must be completed to download receipt",
        code: "INCOMPLETE_PAYMENTS" 
      }, { status: 400 });
    }

    // Fetch installments if any
    const installments = await db.select()
      .from(paymentInstallments)
      .where(eq(paymentInstallments.invoiceId, parsedInvoiceId));

    // Generate HTML invoice
    const html = generateInvoiceHTML(invoice, payments, installments);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

function generateInvoiceHTML(invoice: any, payments: any[], installments: any[]): string {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const paymentsHTML = payments.map(payment => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${formatDate(payment.paymentDate)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-transform: capitalize;">${payment.paymentMethod}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${payment.transactionId || 'N/A'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${formatCurrency(payment.amount)}</td>
    </tr>
  `).join('');

  const installmentsSection = installments.length > 0 ? `
    <div style="margin-top: 40px;">
      <h3 style="color: #333; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">Installment Breakdown</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Installment #</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Due Date</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Amount</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${installments.map(inst => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">Installment ${inst.installmentNumber}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${formatDate(inst.dueDate)}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${formatCurrency(inst.amount)}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
                <span style="padding: 4px 12px; border-radius: 12px; background-color: ${inst.status === 'paid' ? '#4CAF50' : '#ff9800'}; color: white; font-size: 12px; text-transform: capitalize;">
                  ${inst.status}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fee Receipt - ${invoice.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px 20px;
      background-color: #f9f9f9;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      background-color: white;
      padding: 40px;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
      border-radius: 8px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 20px;
    }
    
    .logo-placeholder {
      width: 80px;
      height: 80px;
      background-color: #4CAF50;
      margin: 0 auto 15px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 32px;
      font-weight: bold;
    }
    
    .school-name {
      font-size: 28px;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    
    .invoice-title {
      font-size: 24px;
      color: #4CAF50;
      margin-top: 20px;
      font-weight: bold;
    }
    
    .invoice-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 5px;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 18px;
      color: #333;
      margin-bottom: 15px;
      font-weight: bold;
      border-bottom: 2px solid #4CAF50;
      padding-bottom: 10px;
    }
    
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .detail-item {
      padding: 10px;
      background-color: #fafafa;
      border-radius: 4px;
    }
    
    .detail-label {
      font-weight: bold;
      color: #666;
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .detail-value {
      color: #333;
      font-size: 16px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    th {
      background-color: #4CAF50;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .amount-summary {
      margin-top: 30px;
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 5px;
    }
    
    .amount-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 16px;
    }
    
    .amount-row.total {
      font-size: 20px;
      font-weight: bold;
      border-top: 2px solid #4CAF50;
      margin-top: 10px;
      padding-top: 15px;
      color: #4CAF50;
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      background-color: #4CAF50;
      color: white;
      font-weight: bold;
      font-size: 14px;
      text-transform: uppercase;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 30px;
      border-top: 2px solid #e0e0e0;
    }
    
    .terms {
      margin-bottom: 30px;
      padding: 15px;
      background-color: #f9f9f9;
      border-left: 4px solid #4CAF50;
      font-size: 14px;
      color: #666;
    }
    
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
    }
    
    .signature-box {
      text-align: center;
      padding: 20px;
      border-top: 2px solid #333;
      width: 250px;
    }
    
    .contact-info {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 5px;
      font-size: 14px;
      color: #666;
    }
    
    @media print {
      body {
        padding: 0;
        background-color: white;
      }
      
      .container {
        box-shadow: none;
        padding: 20px;
      }
      
      @page {
        margin: 1cm;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-placeholder">🎓</div>
      <div class="school-name">School Management System</div>
      <div style="color: #666; margin-top: 5px;">Excellence in Education</div>
      <div class="invoice-title">Fee Receipt</div>
    </div>
    
    <div class="invoice-meta">
      <div>
        <div style="font-weight: bold; color: #666;">Invoice Number</div>
        <div style="font-size: 18px; color: #333; margin-top: 5px;">${invoice.invoiceNumber}</div>
      </div>
      <div>
        <div style="font-weight: bold; color: #666;">Invoice Date</div>
        <div style="font-size: 18px; color: #333; margin-top: 5px;">${formatDate(invoice.invoiceCreatedAt)}</div>
      </div>
      <div>
        <div style="font-weight: bold; color: #666;">Status</div>
        <div style="margin-top: 5px;">
          <span class="status-badge">Paid</span>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h3 class="section-title">Student Details</h3>
      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-label">Student Name</div>
          <div class="detail-value">${invoice.fullName}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Admission Number</div>
          <div class="detail-value">${invoice.admissionNumber}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Class</div>
          <div class="detail-value">${invoice.className || 'N/A'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Section</div>
          <div class="detail-value">${invoice.sectionName || 'N/A'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Roll Number</div>
          <div class="detail-value">${invoice.rollNumber || 'N/A'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Academic Year</div>
          <div class="detail-value">${invoice.yearName || 'N/A'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Email</div>
          <div class="detail-value">${invoice.email}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Phone</div>
          <div class="detail-value">${invoice.phone || 'N/A'}</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h3 class="section-title">Fee Summary</h3>
      <div class="amount-summary">
        <div class="amount-row">
          <span>Total Amount:</span>
          <span style="font-weight: bold;">${formatCurrency(invoice.totalAmount)}</span>
        </div>
        <div class="amount-row">
          <span>Paid Amount:</span>
          <span style="color: #4CAF50; font-weight: bold;">${formatCurrency(invoice.paidAmount)}</span>
        </div>
        <div class="amount-row">
          <span>Balance:</span>
          <span style="font-weight: bold;">${formatCurrency(invoice.dueAmount)}</span>
        </div>
        <div class="amount-row total">
          <span>Final Status:</span>
          <span>FULLY PAID</span>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h3 class="section-title">Payment History</h3>
      <table>
        <thead>
          <tr>
            <th>Payment Date</th>
            <th>Payment Method</th>
            <th>Transaction ID</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${paymentsHTML}
        </tbody>
      </table>
    </div>
    
    ${installmentsSection}
    
    <div class="footer">
      <div class="terms">
        <strong>Terms & Conditions:</strong><br>
        1. This is a computer-generated receipt and does not require a signature.<br>
        2. Please preserve this receipt for future reference.<br>
        3. For any queries, please contact the accounts department.<br>
        4. Fees once paid are non-refundable except in cases as per school policy.
      </div>
      
      <div class="signature-section">
        <div class="signature-box">
          <div style="margin-bottom: 10px;">Received By</div>
          <div style="font-size: 12px; color: #666;">Accounts Department</div>
        </div>
        <div class="signature-box">
          <div style="margin-bottom: 10px;">Authorized Signature</div>
          <div style="font-size: 12px; color: #666;">School Authority</div>
        </div>
      </div>
      
      <div class="contact-info">
        <strong>School Contact Information</strong><br>
        Email: accounts@school.edu | Phone: +91-XXXXXXXXXX<br>
        Address: School Address Line 1, City, State - PIN Code<br>
        Website: www.school.edu
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        Generated on ${formatDate(new Date().toISOString())}<br>
        Thank you for your payment!
      </div>
    </div>
  </div>
  
  <script>
    // Auto-print dialog option (commented out by default)
    // window.onload = function() { window.print(); }
  </script>
</body>
</html>
  `;
}