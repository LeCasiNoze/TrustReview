import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createSupabaseServer } from "@/lib/supabase-server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createSupabaseServer();

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, supabase);
        break;
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        await handlePaymentSucceeded(invoice, supabase);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        await handlePaymentFailed(failedInvoice, supabase);
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription, supabase);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        await handleSubscriptionDeleted(deletedSubscription, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: any, supabase: any) {
  try {
    const { user_id, plan_id, billing_cycle } = session.metadata;
    
    // Mettre à jour l'abonnement en base
    const { error } = await supabase
      .from('subscriptions')
      .update({
        plan_id: plan_id,
        stripe_subscription_id: session.subscription,
        status: 'active',
        trial_end: null, // Fin de l'essai
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id);

    if (error) {
      console.error('Error updating subscription after checkout:', error);
    } else {
      console.log('Subscription updated after checkout:', user_id, plan_id);
    }
  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: any, supabase: any) {
  console.log('Payment succeeded for invoice:', invoice.id);
  
  // Envoyer une notification de succès
  await sendNotification(invoice.customer_email, 'payment_succeeded', {
    amount: invoice.amount_paid / 100,
    nextBillingDate: new Date(invoice.period_end * 1000).toLocaleDateString()
  });
}

async function handlePaymentFailed(invoice: any, supabase: any) {
  console.log('Payment failed for invoice:', invoice.id);
  
  // Mettre à jour le statut de l'abonnement
  await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', invoice.subscription);

  // Envoyer une notification d'échec
  await sendNotification(invoice.customer_email, 'payment_failed', {
    amount: invoice.amount_due / 100,
    nextRetryDate: new Date(invoice.next_payment_attempt * 1000).toLocaleDateString()
  });
}

async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  console.log('Subscription updated:', subscription.id);
  
  // Trouver le plan correspondant
  const priceId = subscription.items.data[0].price.id;
  let planSlug = 'starter';
  
  // Déterminer le plan selon le priceId (à adapter selon vos prix Stripe)
  if (priceId.includes('pro')) planSlug = 'pro';
  if (priceId.includes('agency')) planSlug = 'agency';

  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('id')
    .eq('slug', planSlug)
    .single();

  if (plan) {
    await supabase
      .from('subscriptions')
      .update({
        plan_id: plan.id,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
  }

  // Envoyer une notification de mise à jour
  if (subscription.status === 'active') {
    await sendNotification(subscription.customer_email, 'subscription_updated', {
      status: subscription.status,
      nextBillingDate: new Date(subscription.current_period_end * 1000).toLocaleDateString()
    });
  }
}

async function handleSubscriptionDeleted(subscription: any, supabase: any) {
  console.log('Subscription deleted:', subscription.id);
  
  // Mettre à jour le statut en base
  await supabase
    .from('subscriptions')
    .update({ 
      status: 'canceled',
      stripe_subscription_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  // Envoyer une notification d'annulation
  await sendNotification(subscription.customer_email, 'subscription_canceled', {
    endDate: new Date(subscription.ended_at * 1000).toLocaleDateString()
  });
}

async function sendNotification(email: string, type: string, data: any) {
  try {
    // Notification email
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        to: email,
        type,
        data
      })
    });

    // Notification in-app (stockée en base)
    const supabase = await createSupabaseServer();
    await supabase
      .from('notifications')
      .insert({
        user_email: email,
        type,
        data,
        created_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Error sending notification:', error);
  }
}
