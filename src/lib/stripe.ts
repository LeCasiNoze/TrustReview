import Stripe from 'stripe';

// Configuration Stripe - À remplacer avec vos vraies clés
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...', {
  apiVersion: '2024-06-20',
});

// Plans Stripe - À créer dans votre dashboard Stripe
export const STRIPE_PLANS = {
  pro_monthly: 'price_pro_monthly_id', // À remplacer
  pro_yearly: 'price_pro_yearly_id',   // À remplacer  
  agency_monthly: 'price_agency_monthly_id', // À remplacer
  agency_yearly: 'price_agency_yearly_id',   // À remplacer
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
