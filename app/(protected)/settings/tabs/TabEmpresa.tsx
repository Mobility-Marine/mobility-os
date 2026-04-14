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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {children}
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>{children}</div>;
}

export default function TabEmpresa() {
  const { t }         = useTranslation();
  const { companyId } = useTenant();
  const logoRef       = useRef<HTMLInputElement>(null);

  const [form,          setForm]          = useState<Partial<CompanySettings>>({});
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    fetchCompanySettings(companyId).then((s) => { if (s) setForm(s); });
  }, [companyId]);

  function set(k: keyof CompanySettings, v: any) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;
    setLogoUploading(true);
    setError(null);
    const ext  = file.name.split(".").pop();
    const path = `logos/${companyId}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("company-assets")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      setError(`Error al subir logo: ${uploadError.message}`);
      setLogoUploading(false);
      return;
    }
    const { data } = supabase.storage.from("company-assets").getPublicUrl(path);
    set("logo_url", data.publicUrl);
    setLogoUploading(false);
  }

  async function handleSave() {
    if (!companyId) return;
    setSaving(true);
    setError(null);
    try {
      await upsertCompanySettings(companyId, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>
        {(t.settings as any)?.tabEmpresa ?? "Empresa"}
      </div>

      {/* ── LOGO ── */}
      <Section
        title={(t.settings as any)?.logoTitle ?? "Logo de la empresa"}
        desc="Se usa en cotizaciones, documentos y PDFs."
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "140px", height: "70px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {form.logo_url
              ? <img src={form.logo_url} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} alt="logo" />
              : <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Sin logo</span>
            }
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <button onClick={() => logoRef.current?.click()} disabled={logoUploading} style={{ height: "34px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              {logoUploading ? t.general.loading : "Subir logo"}
            </button>
            <input ref={logoRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" style={{ display: "none" }} onChange={handleLogoUpload} />
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>PNG, SVG o JPG · Fondo transparente recomendado</span>
            {form.logo_url && (
              <button onClick={() => set("logo_url", null)} style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "11px", cursor: "pointer", alignSelf: "start" }}>
                Quitar logo
              </button>
            )}
          </div>
        </div>
      </Section>

      {/* ── COLORES DE MARCA ── */}
      <Section
        title="Colores de marca"
        desc="Definen la paleta de color en los PDFs de cotizaciones."
      >
        <Grid2>
          <div>
            <FieldLabel>Color principal (fondo header)</FieldLabel>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input type="color" value={form.brand_color_dark ?? "#0a1628"} onChange={(e) => set("brand_color_dark" as any, e.target.value)} style={{ width: "40px", height: "38px", padding: "2px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", cursor: "pointer", background: "none" }} />
              <input value={form.brand_color_dark ?? "#0a1628"} onChange={(e) => set("brand_color_dark" as any, e.target.value)} placeholder="#0a1628" style={{ ...INPUT, flex: 1 }} />
            </div>
          </div>
          <div>
            <FieldLabel>Color de acento (dorado, números)</FieldLabel>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input type="color" value={form.brand_accent ?? "#c9a227"} onChange={(e) => set("brand_accent" as any, e.target.value)} style={{ width: "40px", height: "38px", padding: "2px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", cursor: "pointer", background: "none" }} />
              <input value={form.brand_accent ?? "#c9a227"} onChange={(e) => set("brand_accent" as any, e.target.value)} placeholder="#c9a227" style={{ ...INPUT, flex: 1 }} />
            </div>
          </div>
          <div>
            <FieldLabel>Color secundario (botones, links)</FieldLabel>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input type="color" value={form.brand_color ?? "#1d4ed8"} onChange={(e) => set("brand_color" as any, e.target.value)} style={{ width: "40px", height: "38px", padding: "2px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", cursor: "pointer", background: "none" }} />
              <input value={form.brand_color ?? "#1d4ed8"} onChange={(e) => set("brand_color" as any, e.target.value)} placeholder="#1d4ed8" style={{ ...INPUT, flex: 1 }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "22px" }}>
              Vista previa:
            </div>
            <div style={{ marginTop: "22px", display: "flex", gap: "6px" }}>
              {[form.brand_color_dark ?? "#0a1628", form.brand_accent ?? "#c9a227", form.brand_color ?? "#1d4ed8"].map((c, i) => (
                <div key={i} style={{ width: "28px", height: "28px", borderRadius: "var(--radius-sm)", background: c, border: "1px solid var(--color-border-faint)" }} />
              ))}
            </div>
          </div>
        </Grid2>
      </Section>

      {/* ── DATOS FISCALES ── */}
      <Section
        title={(t.settings as any)?.fiscalTitle ?? "Datos fiscales"}
        desc="Aparecen en el encabezado y pie de cada cotización generada."
      >
        <Grid2>
          <div>
            <FieldLabel>Razón social</FieldLabel>
            <input value={form.fiscal_name ?? ""} onChange={(e) => set("fiscal_name", e.target.value)} placeholder="Empresa S.A. de C.V." style={INPUT} />
          </div>
          <div>
            <FieldLabel>RFC</FieldLabel>
            <input value={form.fiscal_rfc ?? ""} onChange={(e) => set("fiscal_rfc", e.target.value.toUpperCase())} placeholder="EMP123456ABC" style={INPUT} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <FieldLabel>Régimen fiscal</FieldLabel>
            <select value={form.fiscal_regime ?? ""} onChange={(e) => set("fiscal_regime", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
              <option value="">Seleccionar…</option>
              {TAX_REGIMES.map((r) => <option key={r.value} value={r.value}>{r.value} — {r.label}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Teléfono</FieldLabel>
            <input value={form.fiscal_phone ?? ""} onChange={(e) => set("fiscal_phone" as any, e.target.value)} placeholder="+52 33 1234 5678" style={INPUT} />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <input type="email" value={form.fiscal_email ?? ""} onChange={(e) => set("fiscal_email" as any, e.target.value)} placeholder="contacto@empresa.com" style={INPUT} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <FieldLabel>Sitio web</FieldLabel>
            <input value={form.fiscal_website ?? ""} onChange={(e) => set("fiscal_website" as any, e.target.value)} placeholder="www.empresa.com" style={INPUT} />
          </div>
        </Grid2>

        <div style={{ borderTop: "1px solid var(--color-border-faint)", paddingTop: "14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Dirección fiscal</div>
          <Grid2>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Calle y número</FieldLabel>
              <input value={form.fiscal_address ?? ""} onChange={(e) => set("fiscal_address", e.target.value)} placeholder="Av. Principal 123, Col. Centro" style={INPUT} />
            </div>
            <div>
              <FieldLabel>Ciudad</FieldLabel>
              <input value={form.fiscal_city ?? ""} onChange={(e) => set("fiscal_city", e.target.value)} placeholder="Aguascalientes" style={INPUT} />
            </div>
            <div>
              <FieldLabel>Estado</FieldLabel>
              <input value={form.fiscal_state ?? ""} onChange={(e) => set("fiscal_state", e.target.value)} placeholder="Aguascalientes" style={INPUT} />
            </div>
            <div>
              <FieldLabel>Código Postal</FieldLabel>
              <input value={form.fiscal_zip ?? ""} onChange={(e) => set("fiscal_zip", e.target.value)} placeholder="20000" style={INPUT} />
            </div>
            <div>
              <FieldLabel>País</FieldLabel>
              <input value={form.fiscal_country ?? "México"} onChange={(e) => set("fiscal_country", e.target.value)} style={INPUT} />
            </div>
          </Grid2>
        </div>
      </Section>

      {/* ── PIE DE PÁGINA PDF ── */}
      <Section title="Pie de página en documentos PDF">
        <div>
          <FieldLabel>Texto adicional del pie de página</FieldLabel>
          <input
            value={form.quote_footer ?? ""}
            onChange={(e) => set("quote_footer", e.target.value)}
            placeholder="Precios en MXN. Vigencia sujeta a confirmación. Términos aplican."
            style={INPUT}
          />
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "5px" }}>
            Siempre se agrega "Powered by Mobility OS" automáticamente al final.
          </div>
        </div>
      </Section>

      {/* ERROR */}
      {error && (
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* GUARDAR */}
      <div>
        <button onClick={handleSave} disabled={saving} style={{ height: "40px", padding: "0 28px", borderRadius: "var(--radius-md)", background: saved ? "var(--color-success-text)" : "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
          {saving ? t.general.loading : saved ? "✓ Guardado" : t.general.save}
        </button>
      </div>
    </div>
  );
}
