import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { companyId } = await req.json();
    if (!companyId) return NextResponse.json({ error: "companyId requerido" }, { status: 400 });

    const { data, error } = await supabaseAdmin.rpc("sync_cfdis_to_ar", {
      p_company_id: companyId,
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ synced: data as number });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
