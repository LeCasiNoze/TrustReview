import { NextResponse } from "next/server";
import { getTempSession } from "@/lib/temp-auth";

export async function GET() {
  try {
    const session = await getTempSession();
    
    if (!session) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    return NextResponse.json({
      email: session.email,
      verified: session.verified,
      expires: session.expires
    });

  } catch (error) {
    console.error("Error checking temp session:", error);
    return NextResponse.json({ 
      error: "Failed to check session",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
