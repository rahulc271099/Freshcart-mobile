/**
 * Field-name set this app's backend treats as "money" - the SAME list as
 * `core/domain/monetary_payload.py`'s `MONEY_KEYS` on the server. The
 * backend's global `MoneyJSONRenderer` (`REST_FRAMEWORK.
 * DEFAULT_RENDERER_CLASSES`, see `config/settings/base.py`) walks EVERY
 * API response and stringifies any Decimal under one of these key names
 * to a fixed 2-decimal string (e.g. `"547.50"`) - regardless of which
 * endpoint/serializer produced it. That means every money-shaped field in
 * this app's API (mrp, sellingPrice, grandTotal, deliveryFee, ...) is
 * actually a STRING on the wire, never a JSON number - even though every
 * frontend type in this app declares it as `number` (correctly, as far
 * as the UI's intent goes - these really are numbers, just transmitted as
 * text). Confirmed directly against a real response: `defaultVariant.mrp`
 * and `.sellingPrice` both come back quoted (`"30.00"`, `"20.00"`), not as
 * bare numbers.
 *
 * `denormalizeMoney` below (wired into `api.ts`'s response interceptor)
 * converts them back to real numbers ONCE, centrally, right after the raw
 * HTTP response lands - so every existing `number`-typed field across the
 * app's API types finally receives what it already claims to, instead of
 * every call site needing its own `Number(...)`/`parseFloat(...)`
 * workaround (and instead of silently relying on JS's loose `*`/`-`
 * coercion to paper over a string where a number was expected, which is
 * what let this go unnoticed - string concatenation only shows up on a
 * bare `+`, which this app's code happens to avoid almost everywhere).
 *
 * This list MUST be kept in sync with the backend's own `MONEY_KEYS` -
 * see that file's own comment if a new monetary field is ever added
 * there and not reflected here.
 */
const MONEY_FIELD_NAMES = new Set([
  'mrp', 'sellingprice', 'finalsellingprice', 'wholesaleprice', 'costprice',
  'rate', 'wholesalerate', 'unitrate', 'finalunitrate', 'flatdiscount',
  'unitprice', 'baseprice', 'baseunitprice', 'actualunitprice', 'subtotal',
  'itemssubtotal', 'savedsubtotal', 'linetotal', 'actuallinetotal',
  'discountamount', 'productdiscount', 'cartdiscount', 'coupondiscount',
  'itemdiscountamount', 'cartdiscountamount', 'coupondiscountamount',
  'deliveryfee', 'deliverydiscount', 'effectivedeliveryfee', 'taxamount',
  'grandtotal', 'finaltotal', 'totalamount', 'paidamount', 'amount',
  'collectedamount', 'expectedpaidamount', 'cogsperunit', 'totalcogs',
  'oldprice', 'newprice', 'changeamount', 'minorderamount',
  'maxdiscountamount', 'eligiblesubtotal', 'totalafterdiscount',
  'finalprice', 'discount', 'totalcost', 'othercost', 'sales', 'revenue',
  'cogs', 'grossprofit', 'netprofit', 'averagesales', 'averageorder',
  'averageordervalue', 'outstandingamount', 'finalpayableamount',
  'codpayableamount', 'estimatedprice', 'actualprice', 'price',
  'purchasecost',
]);

/** Normalizes a key the same way the backend does before matching it
 * against `MONEY_FIELD_NAMES` - strip underscores, lowercase - so this
 * works against both this app's usual camelCase payloads (catalogue/
 * orders) and the occasional snake_case one. */
function normalizedKey(key: string): string {
  return key.replace(/_/g, '').toLowerCase();
}

/** Mirrors `normalize_money`'s `discountValue`/`getDiscountValue` special
 * case exactly - a PERCENT-type discount's `discountValue` is a plain
 * percentage, not a currency amount, so it's excluded even though its own
 * name isn't literally in `MONEY_FIELD_NAMES`. A FLAT-type discount's
 * `discountValue` IS a currency amount, so it's included. */
function isMonetaryKey(
  name: string,
  record: Record<string, unknown>,
  inheritedDiscountType: unknown,
): boolean {
  if (name === 'discountvalue' || name === 'getdiscountvalue') {
    const discountType =
      name === 'getdiscountvalue'
        ? (record.get_discount_type ?? record.getDiscountType)
        : inheritedDiscountType;
    return discountType !== 'PERCENT';
  }
  return MONEY_FIELD_NAMES.has(name);
}

/**
 * Recursively walks a parsed JSON value and converts every money-string
 * field (per `MONEY_FIELD_NAMES`) back into a real number - the exact
 * reverse of the backend's `normalize_money()`, including its
 * `discountType`-aware handling of `discountValue`. Called once on every
 * response body via `api.ts`'s response interceptor - feature `*Api.ts`
 * files don't need to (and shouldn't) call this themselves.
 */
export function denormalizeMoney(
  data: unknown,
  inheritedDiscountType: unknown = undefined,
): unknown {
  if (Array.isArray(data)) {
    return data.map(item => denormalizeMoney(item, inheritedDiscountType));
  }
  if (data !== null && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const discountType =
      record.discount_type ?? record.discountType ?? inheritedDiscountType;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      const name = normalizedKey(key);
      const monetary = isMonetaryKey(name, record, discountType);
      if (monetary && typeof value === 'string') {
        const parsed = Number(value);
        // Fall back to the raw string on anything that doesn't actually
        // parse (e.g. an error-message field that happens to share a
        // money-ish name) rather than silently turning it into NaN.
        result[key] = Number.isNaN(parsed) ? value : parsed;
      } else {
        result[key] = denormalizeMoney(value, discountType);
      }
    }
    return result;
  }
  return data;
}
