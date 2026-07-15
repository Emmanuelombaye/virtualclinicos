export async function GET() {
  return Response.json(
    {
      error: "SSO coming soon — configure OIDC provider in a later release",
      status: 501,
    },
    { status: 501 },
  );
}
