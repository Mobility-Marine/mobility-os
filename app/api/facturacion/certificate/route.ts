import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FACTURAPI_BASE = "https://www.facturapi.io/v2";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const companyId  = formData.get("companyId")  as string;
    const cerFile    = formData.get("cer")         as File | null;
    const keyFile    = formData.get("key")         as File | null;
    const password   = formData.get("password")   as string;
    const orgId      = formData.get("orgId")       as string | null;

    if (!companyId || !cerFile || !keyFile || !password) {
      return NextResponse.json(
        { error: "Se requieren los archivos .cer, .key y la contraseña." },
        { status: 400 }
      );
    }

    // Determinar qué key usar y a qué endpoint
    const userKey = process.env.FACTURAPI_USER_KEY;
    const liveKey = process.env.FACTURAPI_LIVE_KEY ?? process.env.FACTURAPI_SECRET_KEY;

    let apiKey:  string;
    let endpoint: string;

    if (orgId && userKey) {
      // Modo SaaS — subir CSD a una org de cliente con User Key
      apiKey   = userKey;
      endpoint = `${FACTURAPI_BASE}/organizations/${orgId}/certificate`;
    } else {
      // Modo directo — subir CSD a la org propia con Live Key
      apiKey   = liveKey!;
      endpoint = `${FACTURAPI_BASE}/organization/certificate`;
    }

    // Construir multipart para Facturapi
    const upload = new FormData();
    upload.append("cer",      cerFile);
    upload.append("key",      keyFile);
    upload.append("password", password);

    const res = await fetch(endpoint, {
      method:  "PUT",
      headers: { Authorization: `Bearer ${apiKey}` },
      body:    upload,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? data.error ?? "Error subiendo certificado");

    // Marcar que la org tiene CSD activo
    await supabaseAdmin
      .from("company_settings")
      .update({
        cer_file_url: `uploaded_${new Date().toISOString().slice(0, 10)}`,
        updated_at:   new Date().toISOString(),
      })
      .eq("company_id", companyId);

    return NextResponse.json({ success: true, organization: data });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
