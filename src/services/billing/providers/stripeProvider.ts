import type { BillingProviderInterface, SubscriptionCatalogItem, PurchaseSession, RestorePurchasesResult, EntitlementState } from '@/types/billing';
import { SUBSCRIPTION_CATALOG, STRIPE_PUBLISHABLE_KEY, STRIPE_CUSTOMER_PORTAL_URL } from '@/config/subscriptions';

const isConfigured = () => !!STRIPE_PUBLISHABLE_KEY;

const STRIPE_API_URL = import.meta.env.VITE_STRIPE_API_URL || '';

export const stripeProvider: BillingProviderInterface = {
  provider: 'stripe',
  get isAvailable() { return isConfigured(); },

  async loadProducts(): Promise<SubscriptionCatalogItem[]> {
    return SUBSCRIPTION_CATALOG;
  },

  async startPurchase(planId: string): Promise<PurchaseSession> {
    const catalog = SUBSCRIPTION_CATALOG.find(p => p.planType === planId);
    if (!catalog) throw new Error('Piano non trovato.');

    const priceId = catalog.providerProductIds.stripe;
    if (!priceId) throw new Error('Price ID Stripe non configurato.');

    const session: PurchaseSession = {
      id: Date.now().toString(),
      provider: 'stripe',
      planType: planId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    if (STRIPE_API_URL) {
      const response = await fetch(`${STRIPE_API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          successUrl: window.location.origin + '/billing/success',
          cancelUrl: window.location.origin + '/pricing',
        }),
      });

      if (!response.ok) throw new Error('Errore nella creazione della sessione di pagamento.');

      const { url } = await response.json();
      window.location.href = url;
    } else {
      const { loadStripe } = await import('@stripe/stripe-js');
      const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
      if (!stripe) throw new Error('Errore nel caricamento di Stripe.');

      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        successUrl: window.location.origin + '/billing/success',
        cancelUrl: window.location.origin + '/pricing',
      });

      if (error) throw new Error(error.message || 'Errore durante il checkout.');
    }

    return session;
  },

  async restorePurchases(): Promise<RestorePurchasesResult> {
    return { success: false, provider: 'stripe', message: 'Il ripristino acquisti non è necessario per Stripe. Lo stato è sincronizzato automaticamente.' };
  },

  async cancelSubscription(): Promise<boolean> {
    const portalUrl = await this.getCustomerPortalUrl();
    if (portalUrl) {
      window.location.href = portalUrl;
      return true;
    }
    throw new Error('Utilizza il Customer Portal di Stripe per gestire il tuo abbonamento.');
  },

  async getEntitlements(): Promise<EntitlementState> {
    if (STRIPE_API_URL) {
      try {
        const response = await fetch(`${STRIPE_API_URL}/entitlements`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (response.ok) return await response.json();
      } catch { /* fall through to default */ }
    }
    return { isPremium: false, planType: 'free', provider: 'stripe', isTrialing: false };
  },

  async getCustomerPortalUrl(): Promise<string | null> {
    return STRIPE_CUSTOMER_PORTAL_URL || null;
  },
};
