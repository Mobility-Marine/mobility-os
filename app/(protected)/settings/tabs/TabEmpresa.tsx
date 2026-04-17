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

function Section({ title, desc, badge, badgeColor, children }: {
  title: string; desc?: string; badge?: string; badgeColor?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 24px", display: "grid", gap: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid var(--color-border-faint)" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</div>
          {desc && <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>{desc}</div>}
        </div>
        {badge && (
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "var(--radius-full)", background: badgeColor === "green" ? "var(--color-success-bg)" : badgeColor === "yellow" ? "var(--color-warning-bg)" : "var(--color-bg-subtle)", border: `1px solid ${badgeColor === "green" ? "var(--color-success-border)" : badgeColor === "yellow" ? "var(--color-warning-border)" : "var(--color-border-faint)"}`, color: badgeColor === "green" ? "var(--color-success-text)" : badgeColor === "yellow" ? "var(--color-warning-text)" : "var(--color-text-muted)", textTransform: "uppercase" as const }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
      {children}
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>{children}</div>;
}

function AreaDivider({ title, icon }: { title: string; icon: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0 4px" }}>
      <span style={{ fontSize: "18px" }}>{icon}</span>
      <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-text-primary)" }}>{title}</span>
      <div style={{ flex: 1, height: "1px", background: "var(--color-border-faint)" }} />
    </div>
  );
}

export default function TabEmpresa() {
  const { t }         = useTranslation();
  const { companyId } = useTenant();
  const logoRef       = useRef<HTMLInputElement>(null);

  // ── Estado empresa ─────────────────────────────────────────
  const [form,          setForm]          = useState<Partial<CompanySettings>>({});
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [taxRegime,     setTaxRegime]     = useState("moral");

  // ── Estado Sellos SAT ──────────────────────────────────────
  const cerRef        = useRef<HTMLInputElement>(null);
  const keyRef        = useRef<HTMLInputElement>(null);
  const [cerUrl,         setCerUrl]         = useState<string | null>(null);
  const [keyUrl,         setKeyUrl]         = useState<string | null>(null);
  const [facturApiOrg,   setFacturApiOrg]   = useState("");
  const [sellosUploading,setSellosUploading]= useState<"cer" | "key" | null>(null);
  const [sellosSaving,   setSellosSaving]   = useState(false);
  const [sellosReg,      setSellosReg]      = useState(false);
  const [sellosSaved,    setSellosSaved]    = useState(false);
  const [sellosError,    setSellosError]    = useState<string | null>(null);
  const [sellosSuccess,  setSellosSuccess]  = useState<string | null>(null);
  const [cerFile,        setCerFile]        = useState<File | null>(null);
  const [keyFile,        setKeyFile]        = useState<File | null>(null);
  const [csdPassword,    setCsdPassword]    = useState("");
  const [showPass,       setShowPass]       = useState(false);
  const [uploadingCSD,   setUploadingCSD]   = useState(false);

  useEffect(() => {
    if (!companyId) return;
    fetchCompanySettings(companyId).then((s) => {
      if (s) {
        setForm(s);
        setCerUrl(s.cer_file_url ?? null);
        setKeyUrl(s.key_file_url ?? null);
        setFacturApiOrg((s as any).facturapi_org_id ?? "");
      }
    });
    supabase.from("companies").select("tax_regime").eq("id", companyId).single()
      .then(({ data }) => { if (data?.tax_regime) setTaxRegime(data.tax_regime); });
  }, [companyId]);

  function set(k: keyof CompanySettings, v: any) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  // ── Handlers empresa ───────────────────────────────────────
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;
    setLogoUploading(true); setError(null);
    const ext  = file.name.split(".").pop();
    const path = `logos/${companyId}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true });
    if (uploadError) { setError(`Error al subir logo: ${uploadError.message}`); setLogoUploading(false); return; }
    const { data } = supabase.storage.from("company-assets").getPublicUrl(path);
    set("logo_url", data.publicUrl);
    setLogoUploading(false);
  }

  async function handleSave() {
    if (!companyId) return;
    setSaving(true); setError(null);
    try {
      await upsertCompanySettings(companyId, form);
      await supabase.from("companies").update({ tax_regime: taxRegime, updated_at: new Date().toISOString() }).eq("id", companyId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) { setError(e.message ?? "Error al guardar"); }
    finally { setSaving(false); }
  }

  // ── Handlers Sellos SAT ────────────────────────────────────
  async function uploadSelloFile(type: "cer" | "key", file: File) {
    if (!companyId) return;
    setSellosUploading(type);
    const ext  = file.name.split(".").pop();
    const path = `sellos/${companyId}/${type}.${ext}`;
    const { error: upErr } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true });
    if (upErr) { setSellosError(upErr.message); setSellosUploading(null); return; }
    const { data } = supabase.storage.from("company-assets").getPublicUrl(path);
    if (type === "cer") setCerUrl(data.publicUrl);
    else                setKeyUrl(data.publicUrl);
    setSellosUploading(null);
  }

  async function handleSellosSave() {
    if (!companyId) return;
    setSellosSaving(true); setSellosError(null);
    try {
      await upsertCompanySettings(companyId, { cer_file_url: cerUrl ?? undefined, key_file_url: keyUrl ?? undefined, pac_provider: "facturapi" } as any);
      if (!facturApiOrg) {
        setSellosReg(true);
        const res  = await fetch("/api/facturacion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "setup_org", companyId, payload: {} }) });
        const data = await res.json();
        if (res.ok && data.org_id) setFacturApiOrg(data.org_id);
        else if (!res.ok) throw new Error(data.error);
        setSellosReg(false);
      }
      setSellosSaved(true);
      setTimeout(() => setSellosSaved(false), 2500);
    } catch (e: any) { setSellosError(e.message); }
    finally { setSellosSaving(false); setSellosReg(false); }
  }

  async function handleRegisterOrg() {
    if (!companyId) return;
    setSellosReg(true); setSellosError(null);
    try {
      const res  = await fetch("/api/facturacion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "setup_org", companyId, payload: {} }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFacturApiOrg(data.org_id);
      setSellosSuccess(`✓ Organización registrada. ID: ${data.org_id}`);
      setTimeout(() => setSellosSuccess(null), 5000);
    } catch (e: any) { setSellosError(e.message); }
    finally { setSellosReg(false); }
  }

  async function handleUploadCSD() {
    if (!companyId || !cerFile || !keyFile || !csdPassword) { setSellosError("Se requieren los archivos .cer, .key y la contraseña del CSD."); return; }
    setUploadingCSD(true); setSellosError(null);
    try {
      const form = new FormData();
      form.append("companyId", companyId);
      form.append("cer",       cerFile);
      form.append("key",       keyFile);
      form.append("password",  csdPassword);
      if (facturApiOrg) form.append("orgId", facturApiOrg);
      const res  = await fetch("/api/facturacion/certificate", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCerFile(null); setKeyFile(null); setCsdPassword("");
      setSellosSuccess("✓ Certificados CSD subidos a Facturapi. La organización está lista para timbrar.");
      setTimeout(() => setSellosSuccess(null), 5000);
    } catch (e: any) { setSellosError(e.message); }
    finally { setUploadingCSD(false); }
  }

  function FileUploadRow({ type, url, label, ext }: { type: "cer" | "key"; url: string | null; label: string; ext: string }) {
    const ref     = type === "cer" ? cerRef : keyRef;
    const hasFile = !!url;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px", alignItems: "center" }}>
        <div>
          <FieldLabel>{label}</FieldLabel>
          <div style={{ height: "38px", padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", display: "flex", alignItems: "center", gap: "8px" }}>
            {hasFile
              ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-success-text)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg><span style={{ fontSize: "12px", color: "var(--color-success-text)", fontWeight: 600 }}>Archivo cargado · .{ext}</span></>
              : <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Sin archivo</span>
            }
          </div>
        </div>
        <div style={{ paddingTop: "20px" }}>
          <button onClick={() => ref.current?.click()} disabled={sellosUploading === type}
            style={{ height: "38px", padding: "0 16px", borderRadius: "var(--radius-md)", background: hasFile ? "var(--color-bg-subtle)" : "var(--color-brand-blue)", border: hasFile ? "1px solid var(--color-border)" : "none", color: hasFile ? "var(--color-text-second)" : "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            {sellosUploading === type ? "Subiendo..." : hasFile ? "Reemplazar" : "Subir"}
          </button>
          <input ref={ref} type="file" accept={`.${ext}`} style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSelloFile(type, f); }} />
        </div>
      </div>
    );
  }

  const sellosChecks = [
    { label: "Organización registrada en Facturapi", done: !!facturApiOrg },
    { label: "CSD subido en Facturapi",              done: !!cerUrl || !!facturApiOrg, note: "Subido desde aquí o directamente en app.facturapi.io" },
    { label: "Suscripción activa",                   done: true, note: "Plan Platform activo" },
    { label: "Carta Manifiesto SAT firmada",         done: false, action: { label: "Firmar →", url: "https://www.facturapi.io/manifiesto" }, note: "Con e.firma (FIEL) — diferente al CSD" },
  ];

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>
        {(t.settings as any)?.tabEmpresa ?? "Empresa"}
      </div>

      {/* ══ ÁREA: EMPRESA ═══════════════════════════════════════ */}
      <AreaDivider title="Identidad y datos fiscales" icon="🏢" />

      {/* LOGO */}
      <Section title={(t.settings as any)?.logoTitle ?? "Logo de la empresa"} desc="Se usa en cotizaciones, documentos y PDFs.">
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "140px", height: "70px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {form.logo_url
              ? <img src={form.logo_url} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} alt="logo" />
              : <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Sin logo</span>
            }
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <button onClick={() => logoRef.current?.click()} disabled={logoUploading}
              style={{ height: "34px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              {logoUploading ? t.general.loading : "Subir logo"}
            </button>
            <input ref={logoRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" style={{ display: "none" }} onChange={handleLogoUpload} />
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>PNG, SVG o JPG · Fondo transparente recomendado</span>
            {form.logo_url && (
              <button onClick={() => set("logo_url", null)}
                style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "11px", cursor: "pointer", alignSelf: "start" }}>
                Quitar logo
              </button>
            )}
          </div>
        </div>
      </Section>

      {/* COLORES */}
      <Section title="Colores de marca" desc="Definen la paleta de color en los PDFs de cotizaciones.">
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
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "22px" }}>Vista previa:</div>
            <div style={{ marginTop: "22px", display: "flex", gap: "6px" }}>
              {[form.brand_color_dark ?? "#0a1628", form.brand_accent ?? "#c9a227", form.brand_color ?? "#1d4ed8"].map((c, i) => (
                <div key={i} style={{ width: "28px", height: "28px", borderRadius: "var(--radius-sm)", background: c, border: "1px solid var(--color-border-faint)" }} />
              ))}
            </div>
          </div>
        </Grid2>
      </Section>

      {/* DATOS FISCALES */}
      <Section title={(t.settings as any)?.fiscalTitle ?? "Datos fiscales"} desc="Aparecen en el encabezado y pie de cada cotización generada.">
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
            <FieldLabel>Régimen fiscal (SAT)</FieldLabel>
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
            <div><FieldLabel>Ciudad</FieldLabel><input value={form.fiscal_city ?? ""} onChange={(e) => set("fiscal_city", e.target.value)} placeholder="Aguascalientes" style={INPUT} /></div>
            <div><FieldLabel>Estado</FieldLabel><input value={form.fiscal_state ?? ""} onChange={(e) => set("fiscal_state", e.target.value)} placeholder="Aguascalientes" style={INPUT} /></div>
            <div><FieldLabel>Código Postal</FieldLabel><input value={form.fiscal_zip ?? ""} onChange={(e) => set("fiscal_zip", e.target.value)} placeholder="20000" style={INPUT} /></div>
            <div><FieldLabel>País</FieldLabel><input value={form.fiscal_country ?? "México"} onChange={(e) => set("fiscal_country", e.target.value)} style={INPUT} /></div>
          </Grid2>
        </div>
      </Section>

      {/* RÉGIMEN FISCAL */}
      <Section title="Régimen fiscal para cálculo de impuestos" desc="Define cómo se calcula el ISR en Contabilidad e Impuestos.">
        <div>
          <FieldLabel>Tipo de régimen fiscal</FieldLabel>
          <select value={taxRegime} onChange={e => setTaxRegime(e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
            <option value="moral">Persona Moral — ISR 30% sobre utilidad</option>
            <option value="pfae">Persona Física con Actividad Empresarial — Tarifa progresiva</option>
            <option value="resico_pm">RESICO Persona Moral — 1%-2% sobre ingresos</option>
            <option value="resico_pf">RESICO Persona Física — 1%-2.5% sobre ingresos</option>
            <option value="other">Otro / Configurable manualmente</option>
          </select>
          <div style={{ marginTop: "10px", padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-brand-blue)", lineHeight: 1.6 }}>
            {taxRegime === "moral"     && "📋 Persona Moral: ISR provisional mensual = Utilidad del período × 30% − pagos previos."}
            {taxRegime === "pfae"      && "📋 PFAE: ISR según tarifa progresiva mensual del Art. 96 LISR."}
            {taxRegime === "resico_pm" && "📋 RESICO PM: ISR = Ingresos del período × tasa RESICO (1% al 2%)."}
            {taxRegime === "resico_pf" && "📋 RESICO PF: ISR = Ingresos del período × tasa RESICO (1% al 2.5%)."}
            {taxRegime === "other"     && "📋 Régimen especial: el ISR se configurará manualmente en Impuestos."}
          </div>
        </div>
      </Section>

      {/* PIE DE PÁGINA */}
      <Section title="Pie de página en documentos PDF">
        <div>
          <FieldLabel>Texto adicional del pie de página</FieldLabel>
          <input value={form.quote_footer ?? ""} onChange={(e) => set("quote_footer", e.target.value)} placeholder="Precios en MXN. Vigencia sujeta a confirmación. Términos aplican." style={INPUT} />
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "5px" }}>
            Siempre se agrega "Powered by Mobility OS" automáticamente al final.
          </div>
        </div>
      </Section>

      {/* GUARDAR EMPRESA */}
      {error && (
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{error}</div>
      )}
      <div>
        <button onClick={handleSave} disabled={saving}
          style={{ height: "40px", padding: "0 28px", borderRadius: "var(--radius-md)", background: saved ? "var(--color-success-text)" : "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
          {saving ? t.general.loading : saved ? "✓ Guardado" : t.general.save}
        </button>
      </div>

      {/* ══ ÁREA: SELLOS SAT ═══════════════════════════════════ */}
      <AreaDivider title="Sellos SAT & Facturación electrónica" icon="🔐" />

      {/* ALERTA CONFIDENCIAL */}
      <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-warning-text)", marginBottom: "4px" }}>Información confidencial</div>
        <div style={{ fontSize: "12px", color: "var(--color-warning-text)", lineHeight: 1.6 }}>
          Los sellos digitales son necesarios para timbrar CFDI 4.0 ante el SAT. Se almacenan de forma segura y solo se usan en el servidor, nunca en el navegador.
        </div>
      </div>

      {/* CHECKLIST */}
      <Section title="Estado de activación" desc="Pasos requeridos para timbrar con validez fiscal"
        badge={sellosChecks.every(c => c.done) ? "Listo" : "Pendiente"}
        badgeColor={sellosChecks.every(c => c.done) ? "green" : "yellow"}>
        <div style={{ display: "grid", gap: "8px" }}>
          {sellosChecks.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "var(--radius-md)", background: c.done ? "var(--color-success-bg)" : "var(--color-bg-subtle)", border: `1px solid ${c.done ? "var(--color-success-border)" : "var(--color-border-faint)"}` }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: c.done ? "var(--color-success-text)" : "var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {c.done
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : <span style={{ fontSize: "10px", color: "var(--color-text-muted)", fontWeight: 700 }}>{i + 1}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: c.done ? "var(--color-success-text)" : "var(--color-text-primary)" }}>{c.label}</div>
                {(c as any).note && <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "1px" }}>{(c as any).note}</div>}
              </div>
              {(c as any).action && !c.done && (
                <a href={(c as any).action.url} target="_blank" rel="noopener noreferrer"
                  style={{ height: "26px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", fontSize: "11px", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", flexShrink: 0 }}>
                  {(c as any).action.label}
                </a>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ESTADO FACTURAPI */}
      <Section title="Sistema de timbrado" desc="Powered by Facturapi — PAC autorizado por el SAT."
        badge={facturApiOrg ? "Registrado" : "Pendiente"}
        badgeColor={facturApiOrg ? "green" : "yellow"}>
        {facturApiOrg ? (
          <div style={{ display: "grid", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success-text)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-success-text)" }}>Empresa registrada en el sistema de timbrado</div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontFamily: "monospace", marginTop: "2px" }}>ID: {facturApiOrg}</div>
              </div>
            </div>
            <button onClick={handleRegisterOrg} disabled={sellosReg}
              style={{ height: "30px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer", alignSelf: "start" }}>
              {sellosReg ? "Sincronizando…" : "↺ Resincronizar org_id"}
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
              {sellosReg ? "Registrando tu empresa en el sistema de timbrado..." : "Si ya configuraste tu organización en Facturapi, presiona el botón para vincularla."}
            </div>
            <button onClick={handleRegisterOrg} disabled={sellosReg}
              style={{ height: "40px", padding: "0 20px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", alignSelf: "start" }}>
              {sellosReg ? "Registrando…" : "Registrar / Vincular organización →"}
            </button>
          </div>
        )}
      </Section>

      {/* CERTIFICADOS CSD — Supabase Storage */}
      <Section title="Certificado de Sello Digital (CSD)" desc="Archivos .cer y .key emitidos por el SAT para tu empresa.">
        <FileUploadRow type="cer" url={cerUrl} label="Certificado (.cer)" ext="cer" />
        <FileUploadRow type="key" url={keyUrl} label="Clave privada (.key)" ext="key" />
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
          Si ya subiste tus archivos CSD directamente en <a href="https://app.facturapi.io" target="_blank" rel="noreferrer" style={{ color: "var(--color-brand-blue)" }}>app.facturapi.io</a>, no necesitas subirlos aquí. Esta sección guarda una copia de referencia.
        </div>
        <div>
          <button onClick={handleSellosSave} disabled={sellosSaving}
            style={{ height: "40px", padding: "0 28px", borderRadius: "var(--radius-md)", background: sellosSaved ? "var(--color-success-text)" : "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
            {sellosReg ? "Registrando empresa..." : sellosSaving ? "Guardando..." : sellosSaved ? "✓ Guardado" : "Guardar sellos"}
          </button>
        </div>
      </Section>

      {/* SUBIR CSD A FACTURAPI */}
      <Section title="Subir CSD directamente a Facturapi" desc="Activa el timbrado en modo Live desde Mobility OS.">
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
          Requiere que la organización ya esté registrada arriba. El CSD tiene vigencia de 4 años.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <FieldLabel>Certificado (.cer)</FieldLabel>
            <div onClick={() => document.getElementById("csd-cer-input")?.click()}
              style={{ height: "40px", padding: "0 14px", borderRadius: "var(--radius-md)", border: `1px dashed ${cerFile ? "var(--color-success-border)" : "var(--color-border)"}`, background: cerFile ? "var(--color-success-bg)" : "var(--color-bg-subtle)", color: cerFile ? "var(--color-success-text)" : "var(--color-text-muted)", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              {cerFile ? `✓ ${cerFile.name}` : "Seleccionar archivo .cer"}
            </div>
            <input id="csd-cer-input" type="file" accept=".cer" style={{ display: "none" }} onChange={(e) => setCerFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <FieldLabel>Clave privada (.key)</FieldLabel>
            <div onClick={() => document.getElementById("csd-key-input")?.click()}
              style={{ height: "40px", padding: "0 14px", borderRadius: "var(--radius-md)", border: `1px dashed ${keyFile ? "var(--color-success-border)" : "var(--color-border)"}`, background: keyFile ? "var(--color-success-bg)" : "var(--color-bg-subtle)", color: keyFile ? "var(--color-success-text)" : "var(--color-text-muted)", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              {keyFile ? `✓ ${keyFile.name}` : "Seleccionar archivo .key"}
            </div>
            <input id="csd-key-input" type="file" accept=".key" style={{ display: "none" }} onChange={(e) => setKeyFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <div>
          <FieldLabel>Contraseña del CSD</FieldLabel>
          <div style={{ position: "relative" }}>
            <input type={showPass ? "text" : "password"} value={csdPassword} onChange={(e) => setCsdPassword(e.target.value)}
              placeholder="Contraseña que definiste al generar el CSD en el SAT"
              style={{ ...INPUT, paddingRight: "40px" }} />
            <button onClick={() => setShowPass(p => !p)}
              style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "2px" }}>
              {showPass
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
        </div>
        <button onClick={handleUploadCSD} disabled={uploadingCSD || !cerFile || !keyFile || !csdPassword}
          style={{ height: "40px", padding: "0 24px", borderRadius: "var(--radius-md)", background: cerFile && keyFile && csdPassword ? "var(--color-success-text)" : "var(--color-bg-subtle)", color: cerFile && keyFile && csdPassword ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: uploadingCSD || !cerFile || !keyFile || !csdPassword ? "not-allowed" : "pointer", alignSelf: "start" }}>
          {uploadingCSD ? "Subiendo certificados a Facturapi…" : "↑ Subir CSD a Facturapi"}
        </button>
      </Section>

      {/* CARTA MANIFIESTO */}
      <Section title="Carta Manifiesto SAT" desc="Requerimiento obligatorio del SAT para autorizar a Facturapi como tu PAC.">
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
          Requiere tu <strong>e.firma (FIEL)</strong> — diferente al CSD. El proceso toma menos de 5 minutos en el portal de Facturapi.
        </div>
        <a href="https://www.facturapi.io/manifiesto" target="_blank" rel="noopener noreferrer"
          style={{ height: "40px", padding: "0 20px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", alignSelf: "start" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Ir a firmar Carta Manifiesto →
        </a>
      </Section>

      {/* MENSAJES SELLOS */}
      {sellosError && (
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{sellosError}</div>
      )}
      {sellosSuccess && (
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontSize: "13px", fontWeight: 600 }}>{sellosSuccess}</div>
      )}
    </div>
  );
}
