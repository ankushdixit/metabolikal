/**
 * Facebook Pixel tracking utilities
 * https://developers.facebook.com/docs/meta-pixel/reference
 */

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
  }
}

/**
 * Check if Facebook Pixel is loaded
 */
function isPixelLoaded(): boolean {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

/**
 * Track a standard Facebook Pixel event
 * https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 */
export function trackEvent(eventName: string, parameters?: Record<string, unknown>) {
  if (isPixelLoaded()) {
    window.fbq("track", eventName, parameters);
  }
}

/**
 * Track a custom Facebook Pixel event
 */
export function trackCustomEvent(eventName: string, parameters?: Record<string, unknown>) {
  if (isPixelLoaded()) {
    window.fbq("trackCustom", eventName, parameters);
  }
}

// Standard Facebook Pixel Events

/**
 * Track when a user adds an item to cart
 */
export function trackAddToCart(params: {
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  contents?: Array<{ id: string; quantity: number }>;
  currency?: string;
  value?: number;
}) {
  trackEvent("AddToCart", params);
}

/**
 * Track when a user adds payment info
 */
export function trackAddPaymentInfo(params?: {
  content_category?: string;
  content_ids?: string[];
  contents?: Array<{ id: string; quantity: number }>;
  currency?: string;
  value?: number;
}) {
  trackEvent("AddPaymentInfo", params);
}

/**
 * Track when a user completes registration
 */
export function trackCompleteRegistration(params?: {
  content_name?: string;
  currency?: string;
  status?: boolean;
  value?: number;
}) {
  trackEvent("CompleteRegistration", params);
}

/**
 * Track when a user contacts you
 */
export function trackContact() {
  trackEvent("Contact");
}

/**
 * Track when a user customizes a product
 */
export function trackCustomizeProduct() {
  trackEvent("CustomizeProduct");
}

/**
 * Track when a user donates
 */
export function trackDonate() {
  trackEvent("Donate");
}

/**
 * Track when a user finds a location
 */
export function trackFindLocation() {
  trackEvent("FindLocation");
}

/**
 * Track when a user initiates checkout
 */
export function trackInitiateCheckout(params?: {
  content_category?: string;
  content_ids?: string[];
  contents?: Array<{ id: string; quantity: number }>;
  currency?: string;
  num_items?: number;
  value?: number;
}) {
  trackEvent("InitiateCheckout", params);
}

/**
 * Track when a user generates a lead
 */
export function trackLead(params?: {
  content_category?: string;
  content_name?: string;
  currency?: string;
  value?: number;
}) {
  trackEvent("Lead", params);
}

/**
 * Track a purchase event
 */
export function trackPurchase(params: {
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  contents?: Array<{ id: string; quantity: number }>;
  currency: string;
  num_items?: number;
  value: number;
}) {
  trackEvent("Purchase", params);
}

/**
 * Track when a user schedules an appointment
 */
export function trackSchedule() {
  trackEvent("Schedule");
}

/**
 * Track a search event
 */
export function trackSearch(params?: {
  content_category?: string;
  content_ids?: string[];
  contents?: Array<{ id: string; quantity: number }>;
  currency?: string;
  search_string?: string;
  value?: number;
}) {
  trackEvent("Search", params);
}

/**
 * Track when a user starts a trial
 */
export function trackStartTrial(params?: {
  currency?: string;
  predicted_ltv?: number;
  value?: number;
}) {
  trackEvent("StartTrial", params);
}

/**
 * Track when a user submits an application
 */
export function trackSubmitApplication() {
  trackEvent("SubmitApplication");
}

/**
 * Track when a user subscribes
 */
export function trackSubscribe(params?: {
  currency?: string;
  predicted_ltv?: number;
  value?: number;
}) {
  trackEvent("Subscribe", params);
}

/**
 * Track when a user views content
 */
export function trackViewContent(params?: {
  content_ids?: string[];
  content_category?: string;
  content_name?: string;
  content_type?: string;
  contents?: Array<{ id: string; quantity: number }>;
  currency?: string;
  value?: number;
}) {
  trackEvent("ViewContent", params);
}
