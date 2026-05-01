// ═══════════════════════════════════════════════════════════════════════
// GET /api/sat/catalogs?name=<catalog_name>
// 
// Sirve catálogos SAT desde la tabla sat_catalogs.
// 
// Query params:
//   - name (requerido):  nombre del catálogo (ej: "tipo_figura")
//   - search (opcional): texto para filtrar por code o label
//   - limit (opcional):  máximo a retornar (default 500)
// 
// Multi-catálogo: si name es lista separada por comas, devuelve un objeto
// con cada catálogo como key. Ej: ?name=tipo_figura,tipo_carga
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type CatalogRow = {
  code:       string;
  label:      string;
  metadata:   any;
  sort_order: number;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const nameParam = searchParams.get("name");
    const search    = searchParams.get("search")?.trim() ?? "";
    const limit     = Math.min(Number(searchParams.get("limit") ?? 500), 2000);

    if (!nameParam) {
      return NextResponse.json(
        { error: "Parámetro 'name' es requerido. Ej: ?name=tipo_figura" },
        { status: 400 }
      );
    }

    const names = nameParam.split(",").map((n) => n.trim()).filter(Boolean);

    for (const n of names) {
      if (!/^[a-z0-9_]+$/i.test(n)) {
        return NextResponse.json(
          { error: `Nombre de catálogo inválido: '${n}'` },
          { status: 400 }
        );
      }
    }

    let query = supabaseAdmin
      .from("sat_catalogs")
      .select("catalog_name, code, label, metadata, sort_order")
      .in("catalog_name", names)
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .limit(limit);

    if (search) {
      query = query.or(`code.ilike.%${search}%,label.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[/api/sat/catalogs] db error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (names.length === 1) {
      const items: CatalogRow[] = (data ?? []).map((r: any) => ({
        code:       r.code,
        label:      r.label,
        metadata:   r.metadata,
        sort_order: r.sort_order,
      }));

      return NextResponse.json(
        { name: names[0], items, count: items.length },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
          },
        }
      );
    }

    const grouped: Record<string, CatalogRow[]> = {};
    for (const n of names) grouped[n] = [];
    for (const r of data ?? []) {
      const item: CatalogRow = {
        code:       r.code,
        label:      r.label,
        metadata:   r.metadata,
        sort_order: r.sort_order,
      };
      if (grouped[r.catalog_name]) grouped[r.catalog_name].push(item);
    }

    return NextResponse.json(
      { catalogs: grouped },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (err: any) {
    console.error("[/api/sat/catalogs] catch:", err);
    return NextResponse.json(
      { error: err.message ?? "Error inesperado" },
      { status: 500 }
    );
  }
}
