/**
 * `react-native-razorpay` ships no TypeScript types (no `types`/`typings`
 * field, no `@types/react-native-razorpay` package). This ambient
 * declaration fills that gap using Razorpay's documented checkout options
 * and result shape so the rest of the app gets real type-checking instead
 * of falling back to `any`.
 *
 * Source: https://razorpay.com/docs/payments/payment-gateway/react-native-integration/standard/
 */
declare module 'react-native-razorpay' {
  export interface RazorpayCheckoutOptions {
    key: string;
    order_id: string;
    amount?: number;
    currency?: string;
    name?: string;
    description?: string;
    image?: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    theme?: {
      color?: string;
    };
    [key: string]: unknown;
  }

  export interface RazorpaySuccessResult {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  export interface RazorpayErrorResult {
    code: number;
    description: string;
  }

  const RazorpayCheckout: {
    open(options: RazorpayCheckoutOptions): Promise<RazorpaySuccessResult>;
  };

  export default RazorpayCheckout;
}
