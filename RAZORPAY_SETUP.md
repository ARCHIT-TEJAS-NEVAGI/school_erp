# Razorpay Payment Integration Setup Guide

This guide will help you set up Razorpay payment gateway for the School ERP system.

## 🚀 Quick Start

### 1. Create Razorpay Account

1. Go to [https://razorpay.com/](https://razorpay.com/)
2. Sign up for a free account
3. Complete the verification process

### 2. Get API Keys (Test Mode)

1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **API Keys** (under Website and app settings)
3. Select **Test Mode** toggle at the top
4. Click **Generate Key** button
5. Copy the following:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret** (shown only once - save it immediately!)

### 3. Configure Environment Variables

Open your `.env` file and update the following values:

```env
# Replace these with your actual Razorpay Test Keys
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

**Important:** The `NEXT_PUBLIC_RAZORPAY_KEY_ID` must be the same as `RAZORPAY_KEY_ID` for test mode.

### 4. Setup Webhook (For Production)

Webhooks are used to receive real-time payment notifications from Razorpay.

#### For Local Development (Optional):

1. Install ngrok: `npm install -g ngrok`
2. Run ngrok: `ngrok http 3000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

#### Configure Webhook in Dashboard:

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **Webhooks**
3. Click **+ Add New Webhook**
4. Enter webhook URL:
   - For local testing: `https://your-ngrok-url.ngrok.io/api/payments/webhook`
   - For production: `https://yourdomain.com/api/payments/webhook`
5. Set a strong custom secret (any random string)
6. Select the following events:
   - ✅ `payment.captured`
   - ✅ `payment.failed`
   - ✅ `order.paid`
7. Click **Create Webhook**
8. Copy the webhook secret and add to `.env`:

```env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### 5. Test Payment Integration

#### Test Card Details:

Use these test card details for testing payments:

| Card Number | CVV | Expiry | OTP |
|-------------|-----|--------|-----|
| 4111 1111 1111 1111 | Any 3 digits | Any future date | Any 6 digits |
| 5555 5555 5555 4444 | Any 3 digits | Any future date | Any 6 digits |

#### Test Workflow:

1. Login to the application (use demo accounts from login page)
2. Go to **Fees** page (Student or Parent portal)
3. Click **Pay Now** on any pending invoice
4. Choose payment type:
   - **Full Payment**: Pay entire amount at once
   - **EMI**: Split payment into 2 installments
5. Click **Proceed to Payment**
6. Razorpay checkout will open
7. Enter test card details
8. Complete payment
9. Verify payment success notification

## 📋 Features Supported

✅ **Full Payment**: Pay entire invoice amount at once  
✅ **EMI Support**: Split payments into 2 installments  
✅ **Payment Verification**: Secure signature verification  
✅ **Webhooks**: Real-time payment status updates  
✅ **Invoice Generation**: Download payment receipts  
✅ **Transaction History**: Track all payments  

## 🔐 Security Best Practices

1. **Never expose Key Secret**: Keep `RAZORPAY_KEY_SECRET` server-side only
2. **Use HTTPS**: Always use HTTPS for webhook URLs in production
3. **Verify Signatures**: All webhook payloads are verified using HMAC-SHA256
4. **Environment Variables**: Never commit `.env` file to version control

## 🚀 Going Live (Production)

### 1. Complete KYC Verification

1. Go to Razorpay Dashboard → **Settings** → **Business Settings**
2. Complete all KYC documents
3. Wait for approval (usually 24-48 hours)

### 2. Generate Live API Keys

1. Toggle to **Live Mode** in dashboard
2. Go to **Settings** → **API Keys**
3. Click **Generate Key**
4. Copy Live Key ID and Secret

### 3. Update Environment Variables

Update `.env` with live credentials:

```env
# Production Keys
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_live_secret_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=your_live_webhook_secret
```

### 4. Update Webhook URL

1. Go to **Settings** → **Webhooks** in Live Mode
2. Create new webhook with production URL
3. Update `RAZORPAY_WEBHOOK_SECRET` with new secret

### 5. Test Live Payments

1. Make a small real payment (₹1-10) to test
2. Verify payment appears in dashboard
3. Check webhook notifications are received
4. Verify invoice generation works

## 🛠️ Troubleshooting

### Payment Creation Fails

**Error:** "Failed to create order"

**Solution:**
- Check if `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are correct
- Verify you're using the correct mode (Test/Live)
- Check server logs for detailed error message

### Razorpay Checkout Doesn't Open

**Error:** Checkout modal doesn't appear

**Solution:**
- Ensure Razorpay script is loaded: Check browser console for errors
- Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set correctly
- Clear browser cache and reload

### Payment Verification Failed

**Error:** "Payment signature verification failed"

**Solution:**
- Ensure `RAZORPAY_KEY_SECRET` matches the Key ID being used
- Check if payment was completed successfully in Razorpay dashboard
- Verify signature verification logic in `/api/payments/confirm`

### Webhooks Not Working

**Error:** Webhooks not triggering

**Solution:**
- Verify webhook URL is publicly accessible (use ngrok for local testing)
- Check webhook signature verification in `/api/payments/webhook`
- Ensure `RAZORPAY_WEBHOOK_SECRET` is correct
- Check Razorpay dashboard → Webhooks → View Logs for failed attempts

### EMI Plan Already Exists

**Error:** "EMI plan is already set up for this invoice"

**Solution:**
- This means installments were already created for this invoice
- User should pay the next pending installment instead
- Check installment status in database

## 📞 Support

- **Razorpay Documentation**: [https://razorpay.com/docs/](https://razorpay.com/docs/)
- **Razorpay Support**: [https://razorpay.com/support/](https://razorpay.com/support/)
- **Test Cards**: [https://razorpay.com/docs/payments/payments/test-card-details/](https://razorpay.com/docs/payments/payments/test-card-details/)

## 🎉 Success!

If you can successfully complete a test payment and see it reflected in both the application and Razorpay dashboard, your integration is working correctly!

---

**Next Steps:**
1. Complete KYC for live payments
2. Configure webhook URL for production
3. Test with real payment before launch
4. Monitor transaction logs regularly
