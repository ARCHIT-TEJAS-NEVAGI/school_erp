# Payment System Setup Guide

## Overview
This School ERP system includes a comprehensive payment gateway with EMI (installment) support using Stripe. Students and parents can pay fees either in full or split into 2 equal installments.

## Features Implemented

### 1. Payment Options
- **Full Payment**: Pay the entire amount at once
- **EMI (2 Installments)**: Split payment into 2 equal parts with 30 days between installments

### 2. Invoice Generation
- Automatic HTML invoice generation after full payment
- Professional invoice design with school branding
- Downloadable receipt for completed payments
- Installment breakdown for EMI payments

### 3. Payment Tracking
- Real-time payment status updates
- Installment tracking for EMI payments
- Payment history with transaction IDs
- Webhook integration for automatic updates

## Stripe Configuration

### Step 1: Get Your Stripe API Keys

1. **Create a Stripe Account**
   - Go to https://stripe.com
   - Sign up for a free account

2. **Get Test API Keys**
   - Go to Dashboard → Developers → API keys
   - Copy your **Secret key** (starts with `sk_test_`)
   - Copy your **Publishable key** (starts with `pk_test_`)

3. **Setup Webhook**
   - Go to Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - Enter your webhook URL: `https://yourdomain.com/api/payments/webhook`
   - Select events to listen to:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
   - Copy the **Webhook signing secret** (starts with `whsec_`)

### Step 2: Add Environment Variables

Add these to your `.env` file:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# For production, use live keys:
# STRIPE_SECRET_KEY=sk_live_your_live_key_here
# STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here
```

### Step 3: Test the Integration

1. **Use Test Card Numbers**
   - Success: `4242 4242 4242 4242`
   - Declined: `4000 0000 0000 0002`
   - Requires Auth: `4000 0025 0000 3155`
   - Any future expiry date, any 3-digit CVC

2. **Test Webhook Locally**
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe
   
   # Login
   stripe login
   
   # Forward webhooks to local server
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

## API Endpoints

### 1. Create Payment Intent
**POST** `/api/payments/create-intent`

Creates a Stripe payment intent for full or EMI payment.

**Request Body:**
```json
{
  "invoiceId": 1,
  "paymentType": "emi" // or "full"
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 3750.00,
  "paymentType": "emi",
  "installmentDetails": {
    "installmentNumber": 1,
    "totalInstallments": 2,
    "dueDate": "2024-02-15T10:30:00.000Z"
  }
}
```

### 2. Confirm Payment
**POST** `/api/payments/confirm`

Confirms a payment and updates database records.

**Request Body:**
```json
{
  "paymentIntentId": "pi_xxx",
  "invoiceId": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "payment": {
    "id": 1,
    "amount": 3750.00,
    "status": "completed"
  },
  "invoice": {
    "id": 1,
    "status": "partial",
    "paidAmount": 3750.00,
    "dueAmount": 3750.00
  },
  "nextInstallment": {
    "installmentNumber": 2,
    "amount": 3750.00,
    "dueDate": "2024-03-15T10:30:00.000Z"
  }
}
```

### 3. Get Installments
**GET** `/api/payments/installments?invoiceId=1`

Retrieves all installments for an invoice.

**Response:**
```json
{
  "invoice": {
    "id": 1,
    "invoiceNumber": "INV-2024-001",
    "totalAmount": 7500.00,
    "status": "partial"
  },
  "installments": [
    {
      "id": 1,
      "installmentNumber": 1,
      "amount": 3750.00,
      "dueDate": "2024-02-15T10:30:00.000Z",
      "paidAmount": 3750.00,
      "status": "paid",
      "payment": {
        "id": 1,
        "paymentDate": "2024-02-15T10:35:00.000Z",
        "transactionId": "pi_xxx"
      }
    },
    {
      "id": 2,
      "installmentNumber": 2,
      "amount": 3750.00,
      "dueDate": "2024-03-15T10:30:00.000Z",
      "paidAmount": 0,
      "status": "pending"
    }
  ],
  "summary": {
    "totalInstallments": 2,
    "paidInstallments": 1,
    "pendingInstallments": 1,
    "totalPaid": 3750.00,
    "totalPending": 3750.00
  }
}
```

### 4. Generate Invoice
**POST** `/api/payments/generate-invoice`

Generates invoice HTML after full payment completion.

**Request Body:**
```json
{
  "invoiceId": 1
}
```

**Response:** Returns HTML invoice document

### 5. Download Invoice PDF
**GET** `/api/payments/invoice-pdf?invoiceId=1`

Downloads invoice as HTML file (can be printed to PDF).

**Response:** HTML document with print-optimized styles

### 6. Webhook Handler
**POST** `/api/payments/webhook`

Handles Stripe webhook events automatically.

Supported events:
- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.payment_failed` - Payment failed
- `payment_intent.canceled` - Payment canceled

## Payment Flow

### Full Payment Flow
1. User selects "Pay Full Amount"
2. System creates payment intent with full due amount
3. User completes payment with Stripe
4. Webhook confirms payment automatically
5. Invoice status updated to "paid"
6. Invoice PDF becomes available for download

### EMI Payment Flow
1. User selects "Pay in 2 Installments"
2. System creates 2 installment records (30 days apart)
3. Payment intent created for first installment only
4. User pays first installment
5. Webhook confirms first payment
6. Invoice status updated to "partial"
7. After 30 days, user pays second installment
8. Webhook confirms second payment
9. Invoice status updated to "paid"
10. Invoice PDF becomes available for download

## Database Schema

### payment_installments Table
```sql
CREATE TABLE payment_installments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  installment_number INTEGER NOT NULL,
  amount REAL NOT NULL,
  due_date TEXT NOT NULL,
  paid_amount REAL DEFAULT 0,
  status TEXT NOT NULL, -- 'pending', 'paid', 'overdue'
  payment_id INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES fee_invoices(id),
  FOREIGN KEY (payment_id) REFERENCES fee_payments(id)
);
```

## User Interface

### Pages Created

1. **Student Fee Page** (`/student/fees`)
   - View all invoices
   - Pay fees with EMI option
   - Download completed invoices

2. **Parent Fee Page** (`/parent/fees`)
   - View children's invoices
   - Pay fees on behalf of children
   - Download receipts

3. **Admin Timetable Management** (`/admin/timetable`)
   - Add/edit/delete class schedules
   - Day-wise schedule view
   - Room and subject management

4. **Student Timetable** (`/student/timetable`)
   - Weekly class schedule
   - Today's classes highlighted
   - Room and timing information

5. **Teacher Pages**
   - `/teacher/students` - View student list
   - `/teacher/timetable` - Weekly teaching schedule

6. **Parent Pages**
   - `/parent/attendance` - Child's attendance records
   - `/parent/marks` - Academic performance
   - `/parent/children` - Children profiles

## Security Considerations

1. **Webhook Verification**
   - All webhooks are verified using Stripe signature
   - Invalid signatures are rejected

2. **Payment Validation**
   - Invoice status checked before payment
   - Amount validation before processing
   - Duplicate payment prevention

3. **Environment Variables**
   - API keys stored securely in `.env`
   - Never expose in client-side code
   - Different keys for test/production

## Testing Checklist

- [ ] Add Stripe API keys to `.env`
- [ ] Test full payment flow
- [ ] Test EMI payment flow
- [ ] Test webhook integration
- [ ] Test invoice generation
- [ ] Test invoice download
- [ ] Verify installment tracking
- [ ] Test payment failure scenarios
- [ ] Check email notifications (if configured)
- [ ] Verify database updates

## Troubleshooting

### Payment Intent Creation Fails
- Check if `STRIPE_SECRET_KEY` is set correctly
- Verify invoice exists and has due amount > 0
- Check invoice is not already paid

### Webhook Not Working
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check webhook URL is accessible
- Use Stripe CLI to forward webhooks locally
- Check webhook event types are configured

### Invoice Generation Fails
- Ensure invoice status is "paid"
- Verify all payments are completed
- Check all installments are paid (for EMI)

### Database Errors
- Run migrations: `npm run db:push`
- Check database connection
- Verify schema is up to date

## Production Deployment

1. **Replace Test Keys with Live Keys**
   ```bash
   STRIPE_SECRET_KEY=sk_live_your_live_key
   STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
   ```

2. **Configure Production Webhook**
   - Update webhook URL to production domain
   - Verify SSL certificate is valid
   - Test webhook delivery

3. **Enable Stripe Radar** (optional)
   - Fraud prevention
   - Risk assessment
   - 3D Secure authentication

4. **Setup Email Notifications** (recommended)
   - Payment confirmation emails
   - Invoice receipt emails
   - Payment failure alerts

## Support

For issues or questions:
- Check Stripe Dashboard for payment details
- Review webhook logs for failed events
- Check application logs for errors
- Contact Stripe support for payment issues

## Database Management

You can manage your database through the **Database Studio** tab located at the top right of the page next to the "Analytics" tab. This allows you to:
- View all tables and data
- Edit records directly
- Run SQL queries
- Monitor payment records
- Track installment status
