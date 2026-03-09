import { NextResponse } from "next/server";
import { createStripeCustomer } from "@/lib/stripe";
import { getRequestIdentity, getSupabaseForIdentity } from "@/lib/request-identity";

export async function POST(req: Request) {
  try {
    const identity = await getRequestIdentity();
    
    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Plus de sessions temporaires - uniquement Supabase
    const { email, name } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Créer le client Stripe
    const customer = await createStripeCustomer(email, name);

    // Mettre à jour la table subscriptions avec le stripe_customer_id
    const supabase = await getSupabaseForIdentity(identity);
    
    await supabase
      .from('subscriptions')
      .update({ stripe_customer_id: customer.id })
      .eq('user_id', identity.userId);

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
