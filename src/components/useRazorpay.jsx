import { paymentApi } from '../services/api';
import toast from 'react-hot-toast';

export function useRazorpay() {

  // overrideAmount — optional, in RUPEES (not paise).
  // When provided, Razorpay will charge exactly this amount instead of
  // recalculating from cartItems server-side.
  // Used by AdminNewSale for SPLIT (UPI portion only) and partial Khata UPI payments.
 const pay = async ({ cartItems, customerDetails, onSuccess, onFailure, overrideAmount, cashPaid, upiPaid,paymentMode, role,isKhata }) => {


    try {
      // 1. Create order on backend
      //    Pass overrideAmount (rupees) so backend skips item-sum and uses it directly.
      const order = await paymentApi.createOrder({
        customerName:   customerDetails.name,
        customerMobile: customerDetails.mobile,
        customerEmail:  customerDetails.email,
        notes:          customerDetails.notes,
        items: cartItems.map(({ product, qty }) => ({
          productId: product.id,
          qty,
        })),
        // If present, backend should use this as the Razorpay order amount (in rupees).
        // Backend must convert to paise: Math.round(overrideAmount * 100)
     ...(overrideAmount != null && overrideAmount > 0 && { amount: overrideAmount }),
      // ── payment context ──
      cashPaid:    Math.round(cashPaid)    ?? 0,
      upiPaid:    Math.round( upiPaid )    ?? 0,
      paymentMode: paymentMode ?? 'UPI',
      role:        role        ?? 'CUSTOMER',
      isKhata: isKhata
      });

      // 2. Open Razorpay checkout
      const options = {
        key:         order.keyId,
        amount:      order.amount,   // always comes from backend (already in paise)
        currency:    order.currency,
        name:        'RS Royal Meat Mart',
        description: 'Fresh Meat Order',
        image:       '/logo.png',
        order_id:    order.orderId,

        prefill: {
          name:    customerDetails.name,
          contact: customerDetails.mobile,
          email:   customerDetails.email || '',
        },

        theme: { color: '#e05c2a' },

          handler: async (response) => {
            try {
              const result = await paymentApi.verifyPayment({
                razorpayOrderId:   response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                customerName:      customerDetails.name,
                customerMobile:    customerDetails.mobile,
                customerEmail:     customerDetails.email,
                notes:             customerDetails.notes,
                items: cartItems.map(({ product, qty }) => ({
                  productId: product.id,
                  qty,
                })),
                ...(overrideAmount != null && overrideAmount > 0 && { amount: overrideAmount }),
                cashPaid:    cashPaid    ?? 0,
                upiPaid:     upiPaid     ?? 0,
                paymentMode: paymentMode ?? 'UPI',
                role:        role        ?? 'CUSTOMER',
                isKhata:     isKhata     ?? false,
              });

              // result = { verified: true, razorpayPaymentId: "pay_xxx" }
              toast.success('Payment verified!');
              onSuccess(result);   // → finalizeSale(result) → pos-sale saves ONCE

            } catch (err) {
              toast.error('Payment verification failed. Contact support.');
              onFailure?.(err);
            }
          },

        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled');
            onFailure?.('dismissed');
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
        onFailure?.(response.error);
      });

      rzp.open();

    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initiate payment');
      onFailure?.(err);
    }
  };

  return { pay };
}