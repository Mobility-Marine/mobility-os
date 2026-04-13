"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import { fetchCompanySettings, upsertCompanySettings } from "@/app/(protected)/comercial/cotizaciones/services/quotations.service";
import type { CompanySettings } from "@/app/(protected)/comercial/cotizaciones/types/quotations.types";
import { TAX_REGIMES } from "@/app/(protected)/comercial/clientes/types/clients.types";

const INPUT: React.CSSProperties = {
  width: "100%", height: "38px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};
const SELECT: React.CSSProperties = { ...INPUT, cursor: "pointer" };

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 24px", display: "grid", gap: "14px" }}>
      <div style={{ paddingBottom: "10px", borderBottom: "1px solid var(--color-border-faint)" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</div>
        {desc && <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, cols = "160px 1fr" }: { label: string; children: React.ReactNode; cols?: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, gap: "12px", alignItems: "center" }}>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

export default function TabEmpresa() {
  const { t }         = useTranslation();
  const { companyId } = useTenant();
  const logoRef       = useRef<HTMLInputElement>(null);

  const [form,   setForm]   = useState<Partial<CompanySettings>>({});
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    fetchCompanySettings(companyId).then((s) => {
      if (s) setForm(s);
    });
  }, [companyId]);

  function set(k: keyof CompanySettings, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;
    setLogoUploading(true);
    const ext  = file.name.split(".").pop();
    const path = `logos/${companyId}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true });
    if (uploadError) { setError(uploadError.message); setLogoUploading(false); return; }
    const { data } = supabase.storage.from("company-assets").getPublicUrl(path);
    set("logo_url", data.publicUrl);
    setLogoUploading(false);
  }

  async function handleSave() {
    if (!companyId) return;
    setSaving(true); setError(null);
    try {
      await upsertCompanySettings(companyId, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>
        {(t.settings as any)?.tabEmpresa ?? "Empresa"}
      </div>

      {/* LOGO */}
      <Section title={(t.settings as any)?.logoTitle ?? "Logo de la empresa"} desc={(t.settings as any)?.logoDesc ?? "Se usa en cotizaciones, documentos y cabeceras de PDF."}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{
            width: "120px", height: "60px", borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          }}>
            {form.logo_url
              ? <img src={form.logo_url} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} alt="logo" />
              : <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Sin logo</span>
            }
          </div>
          <div>
            <button onClick={() => logoRef.current?.click()} disabled={logoUploading} style={{
              height: "34px", padding: "0 14px", borderRadius: "var(--radius-md)",
              background: "var(--color-brand-blue)", color: "#fff", border: "none",
              fontSize: "12px", fontWeight: 600, cursor: "pointer",
            }}>
              {logoUploading ? t.general.loading : (t.settings as any)?.uploadLogo ?? "Subir logo"}
            </button>
            <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} />
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>PNG, SVG o JPG. Fondo transparente recomendado.</div>
          </div>
        </div>
      </Section>

      {/* DATOS FISCALES */}
      <Section title={(t.settings as any)?.fiscalTitle ?? "Datos fiscales"} desc={(t.settings as any)?.fiscalDesc ?? "Aparecen en el pie de página de cada cotización y factura."}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Razón social</div>
            <input value={form.fiscal_name ?? ""} onChange={(e) => set("fiscal_name", e.target.value)} placeholder="Empresa S.A. de C.V." style={INPUT} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>RFC</div>
            <input value={form.fiscal_rfc ?? ""} onChange={(e) => set("fiscal_rfc", e.target.value.toUpperCase())} placeholder="EMP123456ABC" style={INPUT} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Régimen fiscal</div>
            <select value={form.fiscal_regime ?? ""} onChange={(e) => set("fiscal_regime", e.target.value)} style={SELECT}>
              <option value="">Seleccionar…</option>
              {TAX_REGIMES.map((r) => <option key={r.value} value={r.value}>{r.value} — {r.label}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Calle</div>
            <input value={form.fiscal_address ?? ""} onChange={(e) => set("fiscal_address", e.target.value)} placeholder="Av. Principal 123" style={INPUT} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ciudad</div>
            <input value={form.fiscal_city ?? ""} onChange={(e) => set("fiscal_city", e.target.value)} placeholder="Guadalajara" style={INPUT} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Estado</div>
            <input value={form.fiscal_state ?? ""} onChange={(e) => set("fiscal_state", e.target.value)} placeholder="Jalisco" style={INPUT} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Código Postal</div>
            <input value={form.fiscal_zip ?? ""} onChange={(e) => set("fiscal_zip", e.target.value)} placeholder="44100" style={INPUT} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>País</div>
            <input value={form.fiscal_country ?? "México"} onChange={(e) => set("fiscal_country", e.target.value)} style={INPUT} />
          </div>
        </div>
      </Section>

      {/* FOOTER PDF */}
      <Section title={(t.settings as any)?.pdfFooterTitle ?? "Pie de página en documentos PDF"}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Texto del pie de página</div>
          <input
            value={form.quote_footer ?? ""}
            onChange={(e) => set("quote_footer", e.target.value)}
            placeholder="Precios en MXN. Vigencia sujeta a confirmación. Términos aplican."
            style={INPUT}
          />
        </div>
      </Section>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
          {error}
        </div>
      )}

      <div>
        <button onClick={handleSave} disabled={saving} style={{
          height: "40px", padding: "0 28px", borderRadius: "var(--radius-md)",
          background: saved ? "var(--color-success-text)" : "var(--color-brand-blue)",
          color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer",
        }}>
          {saving ? t.general.loading : saved ? "✓ Guardado" : t.general.save}
        </button>
      </div>
    </div>
  );
}
