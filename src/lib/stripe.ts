import Stripe from 'stripe';

// Configuration Stripe - À remplacer avec vos vraies clés
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...', {
  apiVersion: '2024-11-20.acacia',
} as any);

// Plans Stripe - Price IDs depuis variables d'environnement
export const STRIPE_PLANS = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  agency_monthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY,
  agency_yearly: process.env.STRIPE_PRICE_AGENCY_YEARLY,
};

// Validation des Price IDs au démarrage
const requiredPriceIds = [
  'STRIPE_PRICE_PRO_MONTHLY',
  'STRIPE_PRICE_PRO_YEARLY', 
  'STRIPE_PRICE_AGENCY_MONTHLY',
  'STRIPE_PRICE_AGENCY_YEARLY'
];

const missingPriceIds = requiredPriceIds.filter(key => !process.env[key]);

if (missingPriceIds.length > 0) {
  console.error(`❌ Variables d'environnement manquantes pour les Price IDs: ${missingPriceIds.join(', ')}`);
  console.error(`❌ Ajoutez ces variables dans Vercel Environment Variables avec vos vrais Price IDs (price_...)`);
}

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
