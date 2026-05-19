// Bundle CTA web component.
// Adds N variant IDs (currently 5) to the cart atomically via /cart/add.js, tags the cart
// with a bundle_id attribute, and dispatches 'cart:update' (CartAddEvent shape) so
// cart-drawer-component auto-opens and cart-icon updates. The 20% discount is applied
// by the bundle-discount Shopify Function — not here.

type AddPayload = {
  items: Array<{ id: number; quantity: number }>;
};

type CartAddResponse = {
  status?: number;
  description?: string;
  items?: unknown[];
};

type CartObject = {
  item_count?: number;
  [key: string]: unknown;
};

type CartSections = Record<string, string>;

// CartAddEvent shape (mirrors assets/events.js CartAddEvent):
// detail.resource = cart object, detail.sourceId = string, detail.data.sections = Record<string,string>
type CartAddEventDetail = {
  resource: CartObject | null;
  sourceId: string;
  data: {
    sections: CartSections;
    source: string;
    itemCount: number;
  };
};

const CART_UPDATE_EVENT: string = 'cart:update';
const CART_SECTIONS: string = 'cart-drawer,cart-icon-bubble';

const parseVariantIds: (raw: string | null) => number[] = (raw: string | null): number[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => (typeof v === 'number' ? v : Number(v)))
      .filter((n) => Number.isFinite(n) && n > 0);
  } catch {
    return [];
  }
};

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res: Response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data: T & CartAddResponse = (await res.json()) as T & CartAddResponse;
  if (!res.ok) {
    const description: string = data.description ?? `Request to ${url} failed`;
    throw new Error(description);
  }
  return data;
}

async function fetchCartSections(sections: string): Promise<CartSections> {
  const res: Response = await fetch(`/cart.js?sections=${sections}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return {};
  const data: unknown = await res.json();
  if (typeof data !== 'object' || data === null) return {};
  const cart: CartObject & { sections?: CartSections } = data as CartObject & { sections?: CartSections };
  return cart.sections ?? {};
}

export class BundleCtaComponent extends HTMLElement {
  private busy: boolean = false;

  connectedCallback(): void {
    this.setAttribute('data-state', 'idle');
    const button: HTMLButtonElement | null = this.querySelector('button');
    if (button === null) return;
    button.addEventListener('click', this.onClick);
  }

  disconnectedCallback(): void {
    const button: HTMLButtonElement | null = this.querySelector('button');
    if (button === null) return;
    button.removeEventListener('click', this.onClick);
  }

  private readonly onClick: (event: Event) => void = (event: Event): void => {
    event.preventDefault();
    void this.addBundle();
  };

  private setErrorMessage(message: string): void {
    const errorEl: HTMLElement | null = this.querySelector('.bundle-section__error-message');
    if (errorEl === null) return;
    errorEl.textContent = message;
    errorEl.removeAttribute('hidden');
  }

  private clearErrorMessage(): void {
    const errorEl: HTMLElement | null = this.querySelector('.bundle-section__error-message');
    if (errorEl === null) return;
    errorEl.textContent = '';
    errorEl.setAttribute('hidden', '');
  }

  private async addBundle(): Promise<void> {
    if (this.busy) return;

    const variants: number[] = parseVariantIds(this.getAttribute('data-variants'));
    if (variants.length === 0) {
      console.warn('[bundle-cta] no variants configured');
      return;
    }

    const bundleId: string = this.getAttribute('data-bundle-id') ?? 'hero-bundle';
    const button: HTMLButtonElement | null = this.querySelector('button');

    this.busy = true;
    this.setAttribute('data-state', 'busy');
    this.clearErrorMessage();
    if (button !== null) button.setAttribute('disabled', '');

    const drawer: (HTMLElement & { open?: () => void }) | null =
      document.querySelector('cart-drawer-component');
    if (drawer !== null) {
      drawer.setAttribute('data-bundle-loading', 'true');
      if (typeof drawer.open === 'function') drawer.open();
    }

    try {
      const payload: AddPayload = {
        items: variants.map((id) => ({ id, quantity: 1 })),
      };
      const cartAdd: CartAddResponse = await postJSON<CartAddResponse>('/cart/add.js', payload);

      await postJSON<unknown>('/cart/update.js', {
        attributes: { bundle_id: bundleId },
      });

      // Fetch updated cart with section rendering API so cart-drawer-component re-renders.
      const sections: CartSections = await fetchCartSections(CART_SECTIONS);

      // Get item_count from add response or fallback to 0.
      const cartObj: CartObject = cartAdd as CartObject;
      const itemCount: number = typeof cartObj.item_count === 'number' ? cartObj.item_count : 0;

      // Dispatch CartAddEvent-shaped event ('cart:update') so cart-drawer-component
      // auto-opens and cart-icon updates its bubble count.
      const detail: CartAddEventDetail = {
        resource: cartObj,
        sourceId: bundleId,
        data: {
          sections,
          source: 'bundle-cta',
          itemCount,
        },
      };

      document.dispatchEvent(
        new CustomEvent<CartAddEventDetail>(CART_UPDATE_EVENT, {
          bubbles: true,
          detail,
        })
      );

      // Backward-compat event (no consumers today, cheap to keep).
      document.dispatchEvent(
        new CustomEvent('cart:updated', { detail: { source: 'bundle-cta', bundleId } })
      );

      this.setAttribute('data-state', 'idle');
    } catch (err) {
      const message: string = err instanceof Error ? err.message : 'Unable to add bundle';
      console.error('[bundle-cta]', message);

      this.setAttribute('data-state', 'error');
      this.setErrorMessage(message);

      this.dispatchEvent(
        new CustomEvent('bundle-cta:error', { detail: { message }, bubbles: true })
      );
    } finally {
      this.busy = false;
      if (button !== null) button.removeAttribute('disabled');
      if (drawer !== null) drawer.removeAttribute('data-bundle-loading');
    }
  }
}

export default BundleCtaComponent;
