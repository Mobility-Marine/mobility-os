import { NextRequest, NextResponse } from "next/server";

const FACTURAPI_BASE = "https://www.facturapi.io/v2";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "products" | "units"
  const q    = searchParams.get("q") ?? "";

  if (!type || q.length < 2) return NextResponse.json({ data: [] });

  const apiKey = process.env.FACTURAPI_SECRET_KEY;
  if (!apiKey) return NextResponse.json({ error: "FACTURAPI_SECRET_KEY no configurada" }, { status: 500 });

  const endpoint = type === "units" ? "units" : "products";

  const res = await fetch(
    `${FACTURAPI_BASE}/catalogs/${endpoint}?q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );

  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data.message ?? "Error en catálogo SAT" }, { status: res.status });

  return NextResponse.json(data);
}
