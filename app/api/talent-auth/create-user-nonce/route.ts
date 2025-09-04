import { NextRequest, NextResponse } from "next/server";
import { createUserNonceWithAuth } from "@/lib/talent-api-client";

export async function POST(req: NextRequest) {
  try {
    const userAuthToken = req.headers.get("x-talent-auth-token") || "";
    const resp = await createUserNonceWithAuth(userAuthToken);
    return resp;
  } catch (error) {
    console.error("Error in talent-auth/create-user-nonce route:", error);
    return NextResponse.json(
      { error: "Failed to create user nonce" },
      { status: 500 },
    );
  }
}


