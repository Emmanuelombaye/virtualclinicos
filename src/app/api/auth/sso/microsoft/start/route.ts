import { NextResponse } from "next/server";

/** Microsoft / Entra ID OIDC start — stub until Azure app registration is configured. */
export async function GET() {
  return NextResponse.json(
    {
      error: "SSO coming soon — configure Azure AD / Entra OIDC",
      status: 501,
      docs: "Set AZURE_AD_CLIENT_ID + AZURE_AD_TENANT_ID in a later release",
    },
    { status: 501 },
  );
}
