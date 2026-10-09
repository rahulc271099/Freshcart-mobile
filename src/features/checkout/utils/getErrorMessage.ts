import axios from 'axios';

/** First message inside a DRF `errors` object (`{field: ["msg"]}` or
 * `{field: {nested: ["msg"]}}`), prefixed with the field name. */
function firstFieldMessage(errors: unknown): string | undefined {
  if (!errors || typeof errors !== 'object') return undefined;
  for (const [field, value] of Object.entries(errors as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return field === 'non_field_errors' ? value[0] : `${field}: ${value[0]}`;
    }
    if (typeof value === 'string') return `${field}: ${value}`;
    const nested = firstFieldMessage(value);
    if (nested) return nested;
  }
  return undefined;
}

/** The backend's machine-readable `code` (e.g. `STORE_CLOSED`,
 * `OUTSIDE_DELIVERY_AREA`, `MINIMUM_ORDER_AMOUNT`, `DELIVERY_UNAVAILABLE`)
 * when the error carries one. */
export function getErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const data = error.response?.data as { code?: unknown } | undefined;
  return typeof data?.code === 'string' ? data.code : undefined;
}

/** HTTP status of a failed request, `undefined` for a network error
 * (no response at all) or a non-Axios error. */
export function getErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

/** Pulls a human-readable message out of an API error - prefers the
 * backend's own `detail`/`message`/first validation error over Axios's
 * generic "Request failed with status code 400". Used anywhere a failed
 * mutation needs to show the shopper something more useful than that. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      if (typeof record.detail === 'string') return record.detail;
      // The backend's own envelope (`{success, message, errors}`): a
      // validation failure's `message` is just "Validation error." - the
      // useful text is the first field message inside `errors`.
      const fieldMessage = firstFieldMessage(record.errors);
      if (fieldMessage) return fieldMessage;
      if (typeof record.message === 'string') return record.message;
      // DRF validation errors come back as {field: [messages]} - surface
      // the first one rather than the raw object.
      const firstKey = Object.keys(record)[0];
      const firstValue = firstKey ? record[firstKey] : undefined;
      if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') {
        return firstValue[0];
      }
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
