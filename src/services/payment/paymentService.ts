import RazorpayCheckout from 'react-native-razorpay';

import { env } from '../../constants/env';

/**
 * Payment SDK foundation (Razorpay).
 *
 * Per the project's payment architecture rule, the mobile app never
 * decides whether a payment succeeded — it only opens the checkout UI and
 * hands the raw result back to the caller, who must send it to the backend
 * for verification. Order creation (amount, currency, order_id) must also
 * come from the backend, never be constructed on-device.
 *
 * Pending external setup: `env.RAZORPAY_KEY_ID` is currently empty — get
 * the live/test Key ID from the Razorpay dashboard. Never put the Key
 * Secret in this app; that stays server-side only.
 *
 * No checkout-flow business logic (order creation call, success/failure
 * screens, retry handling) is implemented yet — that belongs to
 * `features/payment` and `features/checkout`.
 */
export type PaymentOrder = {
  orderId: string;
  amountInPaise: number;
  currency: string;
};

export type PaymentResult = {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
};

export async function openRazorpayCheckout(
  order: PaymentOrder,
  customer: { name?: string; email?: string; contact?: string } = {},
): Promise<PaymentResult> {
  const result = await RazorpayCheckout.open({
    key: env.RAZORPAY_KEY_ID,
    order_id: order.orderId,
    amount: order.amountInPaise,
    currency: order.currency,
    name: 'FreshCart',
    prefill: customer,
  });

  return {
    razorpayPaymentId: result.razorpay_payment_id,
    razorpayOrderId: result.razorpay_order_id,
    razorpaySignature: result.razorpay_signature,
  };
}
