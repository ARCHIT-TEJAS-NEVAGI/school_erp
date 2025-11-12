import Razorpay from 'razorpay';

// Check if Razorpay credentials are configured
const isRazorpayConfigured = 
  process.env.RAZORPAY_KEY_ID && 
  process.env.RAZORPAY_KEY_SECRET &&
  process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id_here' &&
  process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret_here';

let razorpayInstance: Razorpay | null = null;

if (isRazorpayConfigured) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
  });
} else {
  console.warn('⚠️ Razorpay credentials not configured. Payment features will be disabled.');
}

export const isPaymentConfigured = isRazorpayConfigured;
export default razorpayInstance as Razorpay;