import { NextRequest, NextResponse } from "next/server";
import { getEmailAccountsWithAuth, resendEmailVerificationWithAuth, createEmailAccountWithAuth, makePrimaryEmailAccountWithAuth, disconnectEmailAccountWithAuth } from "@/lib/talent-api-client";

export async function GET(req: NextRequest) {
  const userAuthToken = req.headers.get("x-talent-auth-token") || "";
  return getEmailAccountsWithAuth(userAuthToken);
}

export async function POST(req: NextRequest) {
  const userAuthToken = req.headers.get("x-talent-auth-token") || "";
  try {
    const body = await req.json();
    // If email provided, create; otherwise, expect resend with id
    if (typeof body?.email === "string") {
      const redirect_to_url = body?.redirect_to_url;
      return createEmailAccountWithAuth(userAuthToken, body.email, redirect_to_url);
    }
    const id = body?.email_account_id;
    if (id) {
      const redirect_to_url = body?.redirect_to_url;
      return resendEmailVerificationWithAuth(userAuthToken, id, redirect_to_url);
    }
    return NextResponse.json({ error: "Missing email_address or email_account_id" }, { status: 400 });
  } catch (e) {
    console.error("/api/talent-email-accounts POST error:", e);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  const userAuthToken = req.headers.get("x-talent-auth-token") || "";
  try {
    const body = await req.json();
    const id = body?.email_account_id;
    if (!id) {
      return NextResponse.json(
        { error: "Missing email_account_id" },
        { status: 400 },
      );
    }
    return makePrimaryEmailAccountWithAuth(userAuthToken, id);
  } catch (e) {
    console.error("/api/talent-email-accounts PUT error:", e);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const userAuthToken = req.headers.get("x-talent-auth-token") || "";
  try {
    const body = await req.json();
    const id = body?.email_account_id;
    if (!id) {
      return NextResponse.json(
        { error: "Missing email_account_id" },
        { status: 400 },
      );
    }
    // Safety check: block primary removal
    const currentResp = await getEmailAccountsWithAuth(userAuthToken);
    if (!currentResp.ok) {
      const err = await currentResp.text();
      return NextResponse.json({ error: err || "Failed to fetch email accounts" }, { status: 502 });
    }
    const currentData = await currentResp.json();
    type EmailAccountApi = {
      id?: number | string;
      primary?: boolean;
      is_primary?: boolean;
      kind?: string;
      confirmed?: boolean;
      is_confirmed?: boolean;
      email_address?: string;
    };
    const rawList: unknown = Array.isArray(currentData?.email_accounts)
      ? currentData.email_accounts
      : Array.isArray(currentData)
      ? currentData
      : [];
    const list: EmailAccountApi[] = (Array.isArray(rawList) ? rawList : []) as EmailAccountApi[];
    const target = list.find((a) => String(a?.id) === String(id));
    if (!target) {
      return NextResponse.json({ error: "Email account not found" }, { status: 404 });
    }
    const isPrimary = Boolean(target?.primary) || Boolean(target?.is_primary) || target?.kind === "primary";
    if (isPrimary) {
      return NextResponse.json({ error: "Cannot remove primary email" }, { status: 400 });
    }
    // Unverified secondary emails are allowed to be removed

    // Upstream uses PUT /email_accounts/:id/disconnect
    return disconnectEmailAccountWithAuth(userAuthToken, id);
  } catch (e) {
    console.error("/api/talent-email-accounts DELETE error:", e);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}


