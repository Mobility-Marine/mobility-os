import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { companyId, apiKey, env } = await req.json();
  // Redirige al handler principal
  return fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/facturacion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "setup_org", companyId, payload: { apiKey, env } }),
  }).then((r) => r.json()).then((d) => NextResponse.json(d));
}
