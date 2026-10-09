import axios from 'axios';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  addCartItemApi,
  clearCartApi,
  getCartApi,
  removeCartItemApi,
  updateCartItemQuantityApi,
  type CartViewApi,
} from '@/features/cart/api/cartApi';
// Cart's one exception to "store/ doesn't depend on features/" - same
// justification as ProductCard.tsx's own note on this: reconciling an
// orphan server-side cart line (see `hydrateFromServer` below) needs
// real product display data, and that lookup/shape belongs to the
// product-catalogue domain, not duplicated here. Uses the variants
// endpoint, not the single-product detail endpoint - the backend doesn't
// implement that one (see ProductDetailsScreen.tsx's own note on using
// this same endpoint for the same reason).
import {
  getProductVariantsApi,
  resolveOptionsMode,
  type CustomerQuantityRule,
} from '@/features/product/api/productApi';
import { mapCustomerVariantsToProduct } from '@/features/categories/utils/mapCatalogueData';
import { getErrorMessage } from '@/features/checkout/utils/getErrorMessage';
import { mmkvStorage } from '../services/storage/mmkv';

/**
 * One cart line. Display data (`name`/`imageUri`/`price`/`originalPrice`/
 * `unit`) is captured directly from the catalogue product/variant the
 * shopper picked, at add-time - this used to be resolved via a separate
 * `CART_CATALOG` lookup table (`features/cart/data/catalog.ts`), which
 * only ever covered Home's hardcoded dummy ids and silently dropped any
 * real catalogue product added from Categories/Search. Denormalizing here
 * removes that whole failure mode.
 *
 * Every mutation below ALSO calls the real `/orders/cart/...` API (see
 * `apiVariantId`/`apiBaseQty`/`serverCartItemId` just below) - this store
 * stays the app's local, always-available source of truth for what's
 * shown (so the UI never blocks on a network round trip), and best-effort
 * mirrors every change to the server in the background. A failed sync
 * call is logged, not surfaced/rolled back - see this file's own note on
 * why that's the deliberate tradeoff for now.
 */
export type CartItem = {
  /** Unique per line - see `addVariantLine`/`setCustomQuantityLine` below
   * for how it's built. Used by `updateQuantity`/`removeItem`. */
  id: string;
  productId: string;
  /** Set only for a real pack-size variant - absent for a custom-quantity
   * (loose/bulk, sold by weight) line, which is always exactly one line
   * per product regardless of which quantity was picked. */
  variantId?: string;
  quantity: number;
  name: string;
  imageUri: string;
  price: number;
  originalPrice?: number;
  unit: string;

  // ── Server-sync fields ────────────────────────────────────────────
  /** The REAL backend `variant_id` this line prices against - for a
   * pack-size variant this is just `Number(variantId)`; for a
   * custom-quantity product it's that product's single UNIT_RATE
   * `defaultVariant.variantId` (there's no separate SKU per amount
   * picked - see `core/services/catalogue/customer_product_service.py`'s
   * `product()`/`quantity_choices()`, where `unitRate` IS that variant's
   * own `sellingPrice`). Missing for a dummy/legacy product (Home) that
   * has no live catalogue row - those lines stay local-only, same as
   * before, since there's nothing real to sync to.
   */
  apiVariantId?: number;
  /** Custom-quantity lines ONLY: the backend prices these as
   * `unit_price(=per-unit rate) * quantity`, where `quantity` has to be
   * the actual root-unit amount (e.g. `0.5` for "500 g" on a kg-priced
   * product) - not this line's local `quantity` (a plain selection
   * COUNT, same "1, 2, 3..." meaning the stepper already uses for every
   * other line). `apiBaseQty` is "how much product ONE local count
   * represents", captured once at add-time from whichever quantity
   * choice(s) were actually picked; the API quantity sent on every
   * add/update is always `quantity * apiBaseQty`. A real pack-size
   * variant doesn't need this (1 count IS 1 backend unit), so it's left
   * `undefined` and treated as `1`.
   */
  apiBaseQty?: number;
  /** Custom-quantity lines ONLY: the backend's own min/max/step rule for
   * this product (from `/quantity-choices/`), snapshotted at add-time -
   * lets the cart screen's own +/- stepper step `apiBaseQty` by this
   * product's real `stepQty` (clamped to `minQty..maxQty`) instead of
   * the generic ±1-pack logic every other line uses (see
   * `updateCustomQuantityAmount` below, and this file's own history: that
   * generic logic used to run on EVERY line, which for a custom-quantity
   * line meant "+" multiplied the whole weight instead of stepping it).
   * Undefined for a real pack-size variant (no such rule applies), or for
   * an orphan line reconciled from another device in `hydrateFromServer`
   * (no live fetch is done for those, so there's nothing to snapshot). */
  quantityRule?: CustomerQuantityRule;
  /** Custom-quantity lines ONLY: the short unit code `apiBaseQty` is
   * measured in (e.g. "kg"), so the cart row can relabel the line (e.g.
   * "3 kg" -> "3.25 kg") after its own stepper changes the amount,
   * instead of freezing whatever text was true at add-time. */
  pricingUnitLabel?: string;
  /** This line's `cart_item_id` on the server, once the add/sync call
   * that created it succeeds - `updateQuantity`/`removeItem` need this to
   * PATCH/DELETE the right row. Left unset until then (or if that first
   * sync failed), in which case a later update just retries with a fresh
   * add rather than erroring. */
  serverCartItemId?: number;
};

type AddVariantLineInput = {
  productId: string;
  variantId: string;
  quantity?: number;
  name: string;
  imageUri: string;
  price: number;
  originalPrice?: number;
  unit: string;
  apiVariantId?: number;
};

type SetCustomQuantityLineInput = {
  productId: string;
  quantity: number;
  name: string;
  imageUri: string;
  price: number;
  originalPrice?: number;
  unit: string;
  apiVariantId?: number;
  apiBaseQty?: number;
  quantityRule?: CustomerQuantityRule;
  pricingUnitLabel?: string;
};

type CartState = {
  items: CartItem[];
  /**
   * A real pack-size variant (e.g. Tomato "500 g" vs "1 kg") - two
   * different variants of the same product are always two separate
   * lines/order entries, never merged. `quantity` is the ABSOLUTE target
   * for this line (same "set, not delta" contract as `updateQuantity`),
   * not an amount to add on top of whatever's already there - every
   * caller (the options sheet's "Done", which seeds its rows from the
   * real cart quantity and lets the shopper adjust to a new total; the
   * product-details quick-add, which only ever calls this when the line
   * doesn't exist yet) already resolves to the exact value this line
   * should end up at. This used to be additive, which silently
   * double-counted once the options sheet started seeding from the real
   * cart (cart=1, seeded to 1, tap "+" once -> sheet shows 2, old code
   * computed 1+2=3 instead of just setting it to 2). Also calls the real
   * cart API (an update if this line already synced, otherwise a fresh
   * add).
   */
  addVariantLine: (input: AddVariantLineInput) => Promise<void>;
  /**
   * A custom-quantity (loose/bulk, sold-by-weight) selection - a product
   * like this can only ever have ONE cart line. Re-picking a different
   * quantity from the slider REPLACES that line's quantity/price outright
   * (it's "how much of this am I buying", not "add another one") rather
   * than summing onto a stale previous selection. Also syncs to the
   * server, same as `addVariantLine`.
   */
  setCustomQuantityLine: (input: SetCustomQuantityLineInput) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  /**
   * Sets a line's quantity exactly (used by the cart screen's +/- stepper,
   * which already knows the next value it wants rather than a delta).
   * `quantity <= 0` removes the line, same as tapping "-" down to zero.
   */
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  /**
   * Custom-quantity lines ONLY: sets this line's real weight/amount
   * directly (`apiBaseQty`) - `quantity` stays exactly as it already was
   * (always `1` - see `CartItem.apiBaseQty`'s own comment). This is what
   * the cart screen's +/- stepper calls for these lines instead of
   * `updateQuantity`, since "step this line" means "change the WEIGHT by
   * one `stepQty`", not "change the pack COUNT by one" - calling
   * `updateQuantity` here is exactly the bug this action replaces (it
   * multiplied the whole weight instead of stepping it). `nextAmount <=
   * 0` removes the line, same convention as `updateQuantity`.
   */
  updateCustomQuantityAmount: (id: string, nextAmount: number) => Promise<void>;
  clearCart: () => Promise<void>;
  /**
   * Pulls the real server cart (`GET /orders/cart/`) and reconciles it
   * into local state - see this function's own comment below for why
   * this closes a real gap (the app used to never read the server cart
   * back at all). Called once per session from `RootNavigator.tsx` when
   * `isAuthenticated` becomes true.
   */
  hydrateFromServer: () => Promise<void>;
  /**
   * A plain-language note about a cart change the server refused or could
   * not receive (e.g. "Mango: out of stock") - `CartScreen` shows it as a
   * banner. `null` when there's nothing to say. Not persisted.
   */
  syncNotice: string | null;
  dismissSyncNotice: () => void;
  /**
   * Wipes the local cart, the cached server snapshot and all sync
   * bookkeeping. Called when the session ends (logout / expiry) so the
   * next account never sees this one's cart, and after an order is placed
   * (the server cart was converted into the order).
   */
  resetCart: () => void;
  /**
   * The raw server cart view (`GET/POST/PATCH/DELETE .../orders/cart/...`
   * all return this same shape) from whichever sync call last succeeded -
   * `null` until the first one completes. This is the authoritative
   * source for anything money-shaped (subtotal, delivery fee, discounts,
   * grand total, applied offers) - `items` above stays the source of
   * truth for WHAT'S in the cart (so the UI never blocks on a network
   * round trip), but the actual numbers should come from here whenever
   * it's populated, not be re-derived client-side. See `useCartItems.ts`.
   */
  serverCart: CartViewApi | null;
  /**
   * True until the ONE `hydrateFromServer()` call `RootNavigator.tsx`
   * fires per session (right when `isAuthenticated` becomes true) has
   * resolved - lets `CartScreen` show a real skeleton instead of either a
   * blank/empty state or stale local-only numbers while that first sync
   * is in flight. Deliberately excluded from persistence (see this
   * store's own `partialize`) so every fresh app launch starts at `true`
   * again rather than replaying whatever was last written to disk.
   */
  isHydrating: boolean;
};

/** `quantity * apiBaseQty` - see `CartItem.apiBaseQty`'s own comment.
 * `apiBaseQty` is `undefined` for a real pack-size variant, where 1 local
 * count IS 1 backend unit. Rounded to 3 decimals: `3 * 0.1` is
 * `0.30000000000000004` in floating point, which the backend's decimal
 * quantity validation can reject. */
function toApiQuantity(item: Pick<CartItem, 'quantity' | 'apiBaseQty'>): number {
  return Math.round(item.quantity * (item.apiBaseQty ?? 1) * 1000) / 1000;
}

/** Unpacks an AxiosError into the pieces that actually explain a failed
 * sync call - `console.error('...', error)` alone prints an AxiosError
 * whose useful part (`response.data`, the server's own error body) is
 * nested and easy to miss in the Metro/logcat output, especially for a
 * 500 where axios's own `error.message` is just "Request failed with
 * status code 500" and tells you nothing about WHY. This logs, in one
 * call: the HTTP method/URL/payload that was actually sent, the status
 * code that came back, and the response body (which - for a DRF error -
 * usually carries the real message, or at least enough to search server
 * logs by timestamp when it doesn't). */
function logSyncError(label: string, error: unknown): void {
  if (axios.isAxiosError(error)) {
    console.error(`[cartStore] ${label} failed:`, {
      url: error.config?.url,
      method: error.config?.method,
      requestPayload: error.config?.data,
      status: error.response?.status,
      responseData: error.response?.data,
      message: error.message,
    });
    return;
  }
  console.error(`[cartStore] ${label} failed (non-Axios error):`, error);
}

// ─────────────────────────────────────────────────────────────────────────
// Server sync - SERIALIZED
//
// Every local cart change is applied to the screen immediately
// (optimistic), then mirrored to `/orders/cart/...` through ONE ordered
// queue. This replaces fire-and-forget calls that raced each other:
//   - two quick taps on a line that hadn't synced yet each saw "no server
//     id" and each POSTed an add - the backend MERGES adds for the same
//     variant, so the shopper ended up with double the quantity;
//   - responses arriving out of order left `serverCart` (and so every
//     money figure on screen) showing a stale snapshot;
//   - a remove issued before its add had finished never reached the
//     server, leaving a ghost line that was then ordered.
// Each queued job re-reads the LATEST local state when it actually runs
// (`reconcileLine`), so rapid taps collapse into the final quantity.
// ─────────────────────────────────────────────────────────────────────────

/** Bumped by `resetCart` (logout / order placed) so a response that lands
 * after the reset is ignored instead of leaking into the next session. */
let syncEpoch = 0;
let syncChain: Promise<void> = Promise.resolve();
/** Lines with a job queued but not started yet - a second change to the
 * same line before that job runs needs no second job (it reads the latest
 * state anyway). Also tells hydrate which local lines it must not clobber. */
const queuedLines = new Set<string>();
/** line id -> server `cart_item_id`, kept apart from `CartItem` so a line
 * removed locally can still be removed on the server. */
const serverIds = new Map<string, number>();
/** Server rows whose DELETE failed - retried by `flushCartSync`. */
const failedRemovals = new Set<number>();
let syncHadFailure = false;

function enqueue(task: () => Promise<void>): Promise<void> {
  syncChain = syncChain
    .then(() => task())
    .catch(error => {
      syncHadFailure = true;
      logSyncError('queued sync task', error);
    });
  return syncChain;
}

type SyncFailure = { ok: false; status?: number; message: string };

function toFailure(label: string, error: unknown): SyncFailure {
  syncHadFailure = true;
  logSyncError(label, error);
  return {
    ok: false,
    status: axios.isAxiosError(error) ? error.response?.status : undefined,
    message: getErrorMessage(error),
  };
}

function applyServerCart(view: CartViewApi, epoch: number): void {
  if (epoch === syncEpoch) useCartStore.setState({ serverCart: view });
}

async function syncAdd(
  apiVariantId: number,
  apiQuantity: number,
): Promise<{ ok: true; cartItemId?: number; serverQuantity?: number } | SyncFailure> {
  const epoch = syncEpoch;
  try {
    console.log('[cartStore] syncAdd ->', { apiVariantId, apiQuantity });
    const view = await addCartItemApi({ variantId: apiVariantId, quantity: apiQuantity });
    console.log('[cartStore] syncAdd <- response:', view);
    applyServerCart(view, epoch);
    const row = view.items.find(i => i.variant_id === apiVariantId);
    console.log('[cartStore] syncAdd <- cart_item_id:', row?.cart_item_id);
    return { ok: true, cartItemId: row?.cart_item_id, serverQuantity: row?.quantity };
  } catch (error) {
    return toFailure('add-item sync', error);
  }
}

async function syncUpdate(
  serverCartItemId: number,
  apiQuantity: number,
): Promise<{ ok: true } | SyncFailure> {
  const epoch = syncEpoch;
  try {
    console.log('[cartStore] syncUpdate ->', { serverCartItemId, apiQuantity });
    const view = await updateCartItemQuantityApi(serverCartItemId, apiQuantity);
    console.log('[cartStore] syncUpdate <- response:', view);
    applyServerCart(view, epoch);
    return { ok: true };
  } catch (error) {
    return toFailure('update-quantity sync', error);
  }
}

async function syncRemove(serverCartItemId: number): Promise<{ ok: true } | SyncFailure> {
  const epoch = syncEpoch;
  try {
    console.log('[cartStore] syncRemove ->', { serverCartItemId });
    const view = await removeCartItemApi(serverCartItemId);
    console.log('[cartStore] syncRemove <- response:', view);
    applyServerCart(view, epoch);
    return { ok: true };
  } catch (error) {
    return toFailure('remove-item sync', error);
  }
}

function setLineServerId(lineId: string, serverCartItemId: number | undefined): void {
  useCartStore.setState(state => ({
    items: state.items.map(item =>
      item.id === lineId ? { ...item, serverCartItemId } : item,
    ),
  }));
}

/** The server refused a change (stock, limits, validation - a 4xx) or the
 * network failed. A refusal means the optimistic local line is now a lie,
 * so re-read the server cart and let it win; a network failure keeps the
 * local line (it's retried by the next change / checkout's flush). Either
 * way the shopper is told, instead of the failure only reaching a log. */
async function handleRejected(name: string, failure: SyncFailure): Promise<void> {
  const refused =
    failure.status != null &&
    failure.status >= 400 &&
    failure.status < 500 &&
    failure.status !== 401;
  if (refused) {
    useCartStore.setState({ syncNotice: `${name}: ${failure.message}` });
    await hydrateImpl();
  } else if (failure.status !== 401) {
    useCartStore.setState({
      syncNotice: "Couldn't update your cart on the server. Check your connection - we'll retry.",
    });
  }
}

/** Brings ONE line's server state in line with its current local state
 * (add / update / remove, whichever applies right now). */
async function reconcileLine(lineId: string): Promise<void> {
  const item = useCartStore.getState().items.find(i => i.id === lineId);
  const knownId = item?.serverCartItemId ?? serverIds.get(lineId);

  if (!item) {
    if (knownId == null) return; // never reached the server - nothing to undo
    const result = await syncRemove(knownId);
    if (result.ok || result.status === 404) serverIds.delete(lineId);
    else failedRemovals.add(knownId);
    return;
  }
  if (item.apiVariantId == null) return; // no live catalogue row - local only
  const apiQuantity = toApiQuantity(item);

  if (knownId != null) {
    const result = await syncUpdate(knownId, apiQuantity);
    if (result.ok) return;
    if (result.status === 404) {
      // The server row is gone (cart cleared elsewhere / order placed) -
      // forget the stale id and recreate the line.
      serverIds.delete(lineId);
      setLineServerId(lineId, undefined);
      await reconcileLine(lineId);
      return;
    }
    await handleRejected(item.name, result);
    return;
  }

  const added = await syncAdd(item.apiVariantId, apiQuantity);
  if (!added.ok) {
    await handleRejected(item.name, added);
    return;
  }
  if (added.cartItemId == null) return;
  serverIds.set(lineId, added.cartItemId);
  setLineServerId(lineId, added.cartItemId);
  // The backend MERGES an add into an existing row for the same variant
  // (e.g. one this device hadn't hydrated yet) - if the stored quantity
  // isn't what was asked for, set it exactly.
  if (added.serverQuantity != null && Math.abs(added.serverQuantity - apiQuantity) > 1e-9) {
    await syncUpdate(added.cartItemId, apiQuantity);
  }
}

function enqueueLineSync(lineId: string): Promise<void> {
  if (!queuedLines.has(lineId)) {
    queuedLines.add(lineId);
    enqueue(async () => {
      queuedLines.delete(lineId);
      await reconcileLine(lineId);
    });
  }
  return syncChain;
}

/**
 * Waits for every pending cart change to reach the server, re-sending
 * anything that failed earlier (lines whose update/add failed, deletes
 * that failed). Call before checkout: an order is built from the SERVER
 * cart, so any local change that never arrived would silently be missing
 * from - or left in - the order. Resolves `true` only if everything is
 * confirmed in sync.
 */
export async function flushCartSync(): Promise<boolean> {
  syncHadFailure = false;
  for (const serverId of [...failedRemovals]) {
    enqueue(async () => {
      const result = await syncRemove(serverId);
      if (result.ok || result.status === 404) failedRemovals.delete(serverId);
    });
  }
  for (const item of useCartStore.getState().items) {
    if (item.apiVariantId != null) enqueueLineSync(item.id);
  }
  await syncChain;
  return !syncHadFailure && failedRemovals.size === 0;
}

/** Real server cart -> local lines. Always runs inside the sync queue. */
async function hydrateImpl(): Promise<void> {
  const epoch = syncEpoch;
  try {
    console.log('[cartStore] hydrateFromServer -> fetching server cart');
    const view = await getCartApi();
    console.log('[cartStore] hydrateFromServer <- server cart:', view);
    if (epoch !== syncEpoch) return;
    useCartStore.setState({ serverCart: view });
    const localItems = useCartStore.getState().items;
    const nextItems: CartItem[] = [];

    for (const apiItem of view.items) {
      // Combo/bundle sub-lines aren't a top-level cart row - see
      // `CartItemApi.is_component`'s own comment in cartApi.ts.
      if (apiItem.is_component) continue;

      const existing = localItems.find(
        item =>
          item.serverCartItemId === apiItem.cart_item_id ||
          item.apiVariantId === apiItem.variant_id,
      );

      if (existing) {
        // Already known on this device - keep its display data
        // (name/image/unit), just refresh the numbers from the server.
        // A custom-quantity line (no `variantId`) keeps its fixed local
        // count of 1 with the real amount in `apiBaseQty`; a pack-size
        // line's count IS the server quantity.
        const isCustomLine = existing.variantId == null;
        nextItems.push({
          ...existing,
          quantity: isCustomLine ? 1 : apiItem.quantity,
          apiBaseQty: isCustomLine ? apiItem.quantity : existing.apiBaseQty,
          price: apiItem.unit_price,
          originalPrice: apiItem.base_price ?? existing.originalPrice,
          serverCartItemId: apiItem.cart_item_id,
        });
        serverIds.set(existing.id, apiItem.cart_item_id);
        continue;
      }

      // Orphan line - synced from another device/session, or from
      // before this device ever had local storage for it. There's
      // no display data (name/image/unit) in the cart response
      // itself (see CartItemSerializer - deliberately transactional
      // data only), so fetch the product to backfill it.
      // Best-effort: if that fails (offline, product since
      // removed, endpoint not reachable, ...), fall back to a
      // plain placeholder rather than dropping the line - the
      // shopper should still see SOMETHING is in their cart.
      let name = `Item #${apiItem.product_id}`;
      let imageUri = '';
      let unit = '';
      let isCustomQuantityProduct = false;

      try {
        const detail = await getProductVariantsApi(apiItem.product_id);
        const mapped = mapCustomerVariantsToProduct(detail);
        name = mapped.name;
        imageUri = mapped.imageUri;
        unit = mapped.unit;
        isCustomQuantityProduct =
          resolveOptionsMode({
            isCustomQty: detail.isCustomQty,
            isVariableWeight: detail.isVariableWeight,
            pricingMethod: detail.pricingMethod,
          }) === 'quantity-choices';
      } catch (error) {
        console.warn(
          '[cartStore] hydrate: could not enrich orphan cart item for product',
          apiItem.product_id,
          error,
        );
      }

      if (isCustomQuantityProduct) {
        // One line per product, no variant suffix - matches
        // `setCustomQuantityLine`'s id. `quantity` stays the fixed
        // local "count" of 1, with the real amount carried in
        // `apiBaseQty` (see `CartItem.apiBaseQty`'s own comment).
        const id = String(apiItem.product_id);
        nextItems.push({
          id,
          productId: String(apiItem.product_id),
          quantity: 1,
          name,
          imageUri,
          price: apiItem.unit_price,
          originalPrice: apiItem.base_price ?? apiItem.unit_price,
          unit,
          apiVariantId: apiItem.variant_id,
          apiBaseQty: apiItem.quantity,
          serverCartItemId: apiItem.cart_item_id,
        });
        serverIds.set(id, apiItem.cart_item_id);
      } else {
        const id = `${apiItem.product_id}:${apiItem.variant_id}`;
        nextItems.push({
          id,
          productId: String(apiItem.product_id),
          variantId: String(apiItem.variant_id),
          quantity: apiItem.quantity,
          name,
          imageUri,
          price: apiItem.unit_price,
          originalPrice: apiItem.base_price ?? apiItem.unit_price,
          unit,
          apiVariantId: apiItem.variant_id,
          serverCartItemId: apiItem.cart_item_id,
        });
        serverIds.set(id, apiItem.cart_item_id);
      }
    }

    // The server response is the truth for every line EXCEPT ones the
    // shopper changed while this fetch was in flight: those still have a
    // queued sync job whose result the server hasn't seen yet, so their
    // (newer) local state is kept - overwriting it here would make the
    // line vanish from the screen, and its queued job would then read
    // "no local line" and delete it on the server too.
    const current = useCartStore.getState().items;
    const pendingLocal = current.filter(item => queuedLines.has(item.id));
    const merged = [
      ...nextItems.filter(item => !queuedLines.has(item.id)),
      ...pendingLocal,
    ];
    // Lines with no live catalogue row (`apiVariantId == null`) can't
    // exist on the server and can never be ordered - they were only ever
    // legacy demo entries, so they're dropped rather than left to look
    // orderable.
    console.log('[cartStore] hydrateFromServer <- reconciled:', {
      fromServer: nextItems,
      localOnly: [],
    });
    if (epoch === syncEpoch) useCartStore.setState({ items: merged });
  } catch (error) {
    syncHadFailure = true;
    logSyncError('hydrate cart', error);
  } finally {
    // Flips exactly once per session, success or failure alike -
    // CartScreen's skeleton is about "has the first sync attempt
    // finished", not "did it succeed" (a failed hydrate still
    // leaves something sensible to show, same as every other
    // best-effort sync in this store).
    if (epoch === syncEpoch) useCartStore.setState({ isHydrating: false });
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      serverCart: null,
      isHydrating: true,
      syncNotice: null,

      addVariantLine: async ({ quantity = 1, apiVariantId, ...rest }) => {
        const id = `${rest.productId}:${rest.variantId}`;
        const existing = get().items.find(item => item.id === id);
        // ABSOLUTE target, not a delta - see this action's own doc comment
        // above for why (this is the fix for the "shows as 3" bug).
        const nextQuantity = quantity;
        console.log('[cartStore] addVariantLine ->', {
          id,
          previousQuantity: existing?.quantity ?? 0,
          targetQuantity: nextQuantity,
        });

        if (existing) {
          set({
            items: get().items.map(item =>
              item.id === id ? { ...item, ...rest, quantity: nextQuantity } : item,
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              { id, ...rest, quantity: nextQuantity, apiVariantId },
            ],
          });
        }

        if (apiVariantId == null) return; // no live catalogue row - nothing to sync
        await enqueueLineSync(id);
      },

      setCustomQuantityLine: async ({ apiVariantId, apiBaseQty, ...input }) => {
        // No `variantId` - the id is the bare product id, so there is only
        // ever one line for this product, and this always REPLACES it
        // (not merges) with whatever the shopper most recently picked.
        const id = input.productId;
        const items = get().items;
        const existingIndex = items.findIndex(item => item.id === id);
        const existing = existingIndex === -1 ? undefined : items[existingIndex];
        console.log('[cartStore] setCustomQuantityLine ->', {
          id,
          incomingQuantity: input.quantity,
          existingQuantity: existing?.quantity,
          apiBaseQty,
        });
        const nextItem: CartItem = {
          id,
          ...input,
          apiVariantId,
          apiBaseQty,
          serverCartItemId: existing?.serverCartItemId,
        };
        set({
          items:
            existingIndex === -1
              ? [...items, nextItem]
              : items.map((item, index) => (index === existingIndex ? nextItem : item)),
        });

        if (apiVariantId == null) return; // no live catalogue row - nothing to sync
        await enqueueLineSync(id);
      },

      removeItem: async (id: string) => {
        const item = get().items.find(i => i.id === id);
        console.log('[cartStore] removeItem ->', { id, serverCartItemId: item?.serverCartItemId });
        // Remember the server row so the queued job can still delete it
        // after the local line is gone.
        if (item?.serverCartItemId != null) serverIds.set(id, item.serverCartItemId);
        set({ items: get().items.filter(i => i.id !== id) });
        await enqueueLineSync(id);
      },

      updateQuantity: async (id: string, quantity: number) => {
        const item = get().items.find(i => i.id === id);
        if (!item) return;
        console.log('[cartStore] updateQuantity ->', {
          id,
          currentQuantity: item.quantity,
          requestedQuantity: quantity,
        });

        if (quantity <= 0) {
          if (item.serverCartItemId != null) serverIds.set(id, item.serverCartItemId);
          set({ items: get().items.filter(i => i.id !== id) });
          await enqueueLineSync(id);
          return;
        }

        set({
          items: get().items.map(i => (i.id === id ? { ...i, quantity } : i)),
        });

        if (item.apiVariantId == null) return; // no live catalogue row
        await enqueueLineSync(id);
      },

      updateCustomQuantityAmount: async (id: string, nextAmount: number) => {
        const item = get().items.find(i => i.id === id);
        if (!item) return;
        console.log('[cartStore] updateCustomQuantityAmount ->', {
          id,
          currentAmount: item.apiBaseQty,
          requestedAmount: nextAmount,
        });

        if (nextAmount <= 0) {
          if (item.serverCartItemId != null) serverIds.set(id, item.serverCartItemId);
          set({ items: get().items.filter(i => i.id !== id) });
          await enqueueLineSync(id);
          return;
        }

        set({
          items: get().items.map(i =>
            i.id === id ? { ...i, apiBaseQty: nextAmount } : i,
          ),
        });

        if (item.apiVariantId == null) return; // no live catalogue row
        await enqueueLineSync(id);
      },

      clearCart: async () => {
        console.log('[cartStore] clearCart -> clearing all local items + server cart');
        set({ items: [] });
        const epoch = syncEpoch;
        await enqueue(async () => {
          try {
            const view = await clearCartApi();
            console.log('[cartStore] clearCart <- response:', view);
            serverIds.clear();
            failedRemovals.clear();
            applyServerCart(view, epoch);
          } catch (error) {
            syncHadFailure = true;
            logSyncError('clear-cart sync', error);
          }
        });
      },

      hydrateFromServer: () => enqueue(hydrateImpl),

      dismissSyncNotice: () => set({ syncNotice: null }),

      resetCart: () => {
        // Logout / account change / order placed: nothing from the old
        // cart may survive - local lines, the cached server snapshot, the
        // sync queue's bookkeeping, or a response still in flight.
        syncEpoch += 1;
        queuedLines.clear();
        serverIds.clear();
        failedRemovals.clear();
        syncHadFailure = false;
        syncChain = Promise.resolve();
        set({ items: [], serverCart: null, isHydrating: true, syncNotice: null });
      },
    }),
    {
      name: 'freshcart-cart-v2',
      storage: createJSONStorage(() => mmkvStorage),
      // `isHydrating` deliberately excluded - see its own comment on
      // `CartState`. Only the actual cart data should survive a restart;
      // the in-flight-sync flag should always start fresh at `true`.
      partialize: state => ({ items: state.items, serverCart: state.serverCart }),
    },
  ),
);
