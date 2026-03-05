import Stripe from 'stripe';

// Configuration Stripe - À remplacer avec vos vraies clés
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...', {
  apiVersion: '2026-02-25.clover',
});

// Plans Stripe - IDs réels
export const STRIPE_PLANS = {
  pro_monthly: 'prod_U5llyx37kYtWbK', // Pro mensuel
  pro_yearly: 'prod_U5lmxddH8BdIfd',   // Pro annuel
  agency_monthly: 'prod_U5lnBQGk10yELL', // Agence mensuel
  agency_yearly: 'prod_U5loCUvGjrvfu5',   // Agence annuel
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

export async function createStripeSubscription(customerId: string, priceId: string) {
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
