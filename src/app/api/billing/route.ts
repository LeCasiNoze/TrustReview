import { NextResponse } from "next/server";
import { getBillingDataServer } from "@/lib/subscription.server";

export async function GET() {
  try {
    const billingData = await getBillingDataServer();
    
    if (!billingData.info) {
      return NextResponse.json({ error: "Unable to fetch billing information" }, { status: 500 });
    }

    return NextResponse.json(billingData);
  } catch (error) {
    console.error("Error fetching billing data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
