import Stripe from 'stripe';

// Configuration Stripe - À remplacer avec vos vraies clés
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...', {
  apiVersion: '2024-11-20.acacia',
} as any);

// Plans Stripe - Price IDs réels
export const STRIPE_PLANS = {
  // STARTER (gratuit avec essai)
  starter_monthly: 'price_1T8Pd7Cs7QihwvO39gMZnAGr',
  starter_yearly: 'price_1T8Pd7Cs7QihwvO389ZmeGjU',
  
  // PRO
  pro_monthly: 'price_1T8PdzCs7QihwvO3E0IlaJwB',
  pro_yearly: 'price_1T8PdzCs7QihwvO3z5PmAJqb',
  
  // AGENCY
  agency_monthly: 'price_1T8PeqCs7QihwvO3vlLvxxD2',
  agency_yearly: 'price_1T8Pf7Cs7QihwvO3RoUmrpmG',
};

// Quotas par plan
export const PLAN_QUOTAS = {
  starter: {
    max_businesses: 1,
    max_qr_codes: 5,
  },
  pro: {
    max_businesses: 3,
    max_qr_codes: 50,
  },
  agency: {
    max_businesses: 10,
    max_qr_codes: null, // Illimité
  },
};

export async function createStripeCustomer(email: string, name?: string) {
  try {
    const customer = await stripe.customers.create({
      email,
      name: name || email,
      metadata: {
        source: 'trustreview'
      }
    });
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

export async function createStripeSubscription(customerId: string, priceId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  } catch (error) {
    console.error('Error creating Stripe subscription:', error);
    throw error;
  }
}

export async function cancelStripeSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error canceling Stripe subscription:', error);
    throw error;
  }
}
