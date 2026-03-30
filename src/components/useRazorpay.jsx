import { paymentApi } from '../services/api';
import toast from 'react-hot-toast';

export function useRazorpay() {

  const pay = async ({ cartItems, customerDetails, onSuccess }) => {

    try {
      // 1. Create order on backend — amount calculated server side
      const order = await paymentApi.createOrder({
        customerName:   customerDetails.name,
        customerMobile: customerDetails.mobile,
        customerEmail:  customerDetails.email,
        notes:          customerDetails.notes,
        items: cartItems.map(({ product, qty }) => ({
          productId: product.id,
          qty,
        })),
      });

      // 2. Open Razorpay checkout
      const options = {
        key:      order.keyId,
        amount:   order.amount,
        currency: order.currency,
        name:     'RS Royal Meat Mart',
        description: 'Fresh Meat Order',
        image:    '/logo.png',
        order_id: order.orderId,

        prefill: {
          name:    customerDetails.name,
          contact: customerDetails.mobile,
          email:   customerDetails.email || '',
        },

        theme: { color: '#e05c2a' },

        handler: async (response) => {
          // 3. Verify payment on backend
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
            });

            toast.success('Payment successful!');
            onSuccess(result);

          } catch (err) {
            toast.error('Payment verification failed. Contact support.');
          }
        },

        modal: {
          ondismiss: () => toast.error('Payment cancelled'),
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
      });

      rzp.open();

    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initiate payment');
    }
  };

  return { pay };
}