/** Keeps digits only. */
const digitsOnly = (value: string): string => value.replace(/\D/g, '');

/**
 * Groups a (partial) 10-digit Indian mobile number as `XXXXX XXXXX` for
 * display. Presentation only - callers keep and submit the raw digits.
 *
 * @example formatMobileNumber('9876543210') // '98765 43210'
 */
export function formatMobileNumber(value: string): string {
  const digits = digitsOnly(value).slice(0, 10);
  return digits.length > 5
    ? `${digits.slice(0, 5)} ${digits.slice(5)}`
    : digits;
}

/**
 * Formats a stored E.164-ish number (e.g. `+919876543210`) for display as
 * `+91 98765 43210`. Anything that doesn't look like a +91 number is
 * returned untouched rather than mangled.
 */
export function formatInternationalMobile(phoneNumber: string): string {
  const digits = digitsOnly(phoneNumber);
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${formatMobileNumber(digits.slice(2))}`;
  }
  return phoneNumber;
}
