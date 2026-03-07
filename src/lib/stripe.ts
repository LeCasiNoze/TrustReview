import Stripe from 'stripe';

// Configuration Stripe - À remplacer avec vos vraies clés
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...', {
  apiVersion: '2024-11-20.acacia',
} as any);

// Plans Stripe - Price IDs (à remplacer avec vos vrais IDs)
export const STRIPE_PLANS = {
  // Remplacez ces IDs par vos vrais Price IDs depuis Stripe Dashboard
  // Format: price_xxxxxxxxxxxxxx
  pro_monthly: 'price_1OQx7Z2eZvKYlo2C7Z6K8m7J',    // Pro mensuel - 19.99€
  pro_yearly: 'price_1OQx8J2eZvKYlo2C7Z6K8n8K',      // Pro annuel - 49.99€
  agency_monthly: 'price_1OQx8J2eZvKYlo2C7Z6K8n8K',  // Agence mensuel - 19.99€
  agency_yearly: 'price_1OQx8J2eZvKYlo2C7Z6K8n8K',    // Agence annuel - 49.99€
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
