"use client";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import { fetchCompanySettings, upsertCompanySettings } from "@/app/(protected)/comercial/cotizaciones/services/quotations.service";

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

export default function TabSellos() {
  const { t } = useTranslation();
  const { companyId } = useTenant();
  const cerRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);

  const [cerUrl,        setCerUrl]        = useState<string | null>(null);
  const [keyUrl,        setKeyUrl]        = useState<string | null>(null);
  const [facturApiKey,  setFacturApiKey]  = useState("");
  const [facturApiEnv,  setFacturApiEnv]  = useState<"test" | "live">("test");
  const [facturApiOrg,  setFacturApiOrg]  = useState("");
  const [uploading,     setUploading]     = useState<"cer" | "key" | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [registering,   setRegistering]   = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [showKey,       setShowKey]       = useState(false);

  useEffect(() => {
    if (!companyId) return;
    fetchCompanySettings(companyId).then((s) => {
      if (!s) return;
      setCerUrl(s.cer_file_url ?? null);
      setKeyUrl(s.key_file_url ?? null);
      setFacturApiKey(s.facturapi_api_key ?? "");
      setFacturApiEnv((s.facturapi_env as any) ?? "test");
      setFacturApiOrg(s.facturapi_org_id ?? "");
    });
  }, [companyId]);

  async function uploadFile(type: "cer" | "key", file: File) {
    if (!companyId) return;
    setUploading(type);
    const ext  = file.name.split(".").pop();
    const path = `sellos/${companyId}/${type}.${ext}`;
    const { error: upErr } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true });
    if (upErr) { setError(upErr.message); setUploading(null); return; }
    const { data } = supabase.storage.from("company-assets").getPublicUrl(path);
    if (type === "cer") setCerUrl(data.publicUrl);
    else                setKeyUrl(data.publicUrl);
    setUploading(null);
  }

  async function handleRegisterOrg() {
    if (!facturApiKey || !companyId) return;
    setRegistering(true); setError(null);
    try {
      const res = await fetch("/api/facturacion/setup-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, apiKey: facturApiKey, env: facturApiEnv }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error registrando organización");
      setFacturApiOrg(data.org_id);
      await upsertCompanySettings(companyId, {
        facturapi_api_key: facturApiKey,
        facturapi_org_id:  data.org_id,
        facturapi_env:     facturApiEnv,
        pac_provider:      "facturapi",
      } as any);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e: any) { setError(e.message); }
    finally { setRegistering(false); }
  }

  async function handleSave() {
    if (!companyId) return;
    setSaving(true); setError(null);
    try {
      await upsertCompanySettings(companyId, {
        cer_file_url:      cerUrl ?? undefined,
        key_file_url:      keyUrl ?? undefined,
        facturapi_api_key: facturApiKey || undefined,
        facturapi_org_id:  facturApiOrg || undefined,
        facturapi_env:     facturApiEnv,
        pac_provider:      "facturapi",
      } as any);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  function FileUploadRow({ type, url, label, ext }: { type: "cer" | "key"; url: string | null; label: string; ext: string }) {
    const ref     = type === "cer" ? cerRef : keyRef;
    const hasFile = !!url;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
          <div style={{ height: "38px", padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", display: "flex", alignItems: "center", gap: "8px" }}>
            {hasFile ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-success-text)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize: "12px", color: "var(--color-success-text)", fontWeight: 600 }}>Archivo cargado · .{ext}</span>
              </>
            ) : (
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Sin archivo</span>
            )}
          </div>
        </div>
        <div style={{ paddingTop: "20px" }}>
          <button onClick={() => ref.current?.click()} disabled={uploading === type}
            style={{ height: "38px", padding: "0 16px", borderRadius: "var(--radius-md)", background: hasFile ? "var(--color-bg-subtle)" : "var(--color-brand-blue)", border: hasFile ? "1px solid var(--color-border)" : "none", color: hasFile ? "var(--color-text-second)" : "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            {uploading === type ? "Subiendo…" : hasFile ? "Reemplazar" : "Subir"}
          </button>
          <input ref={ref} type="file" accept={`.${ext}`} style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(type, f); }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>Sellos SAT & Facturación</div>

      {/* ALERTA */}
      <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-warning-text)", marginBottom: "4px" }}>
          Información confidencial
        </div>
        <div style={{ fontSize: "12px", color: "var(--color-warning-text)", lineHeight: 1.6 }}>
          Los sellos digitales y la API Key son necesarios para timbrar CFDI 4.0 ante el SAT. Se almacenan de forma segura y solo se usan en el servidor, nunca en el navegador.
        </div>
      </div>

      {/* FACTURAPI */}
      <Section
        title="Facturapi — PAC autorizado SAT"
        desc="Proveedor de timbrado. La API Key es confidencial y solo se usa server-side."
      >
        {/* Ambiente */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ambiente</div>
          <div style={{ display: "flex", gap: "8px" }}>
            {([["test", "Sandbox (pruebas)"], ["live", "Producción (real)"]] as const).map(([val, label]) => (
              <button key={val} onClick={() => setFacturApiEnv(val)}
                style={{ flex: 1, padding: "10px 14px", borderRadius: "var(--radius-md)", textAlign: "left", cursor: "pointer", background: facturApiEnv === val ? (val === "live" ? "var(--color-success-bg)" : "var(--color-info-bg)") : "var(--color-bg-subtle)", border: `2px solid ${facturApiEnv === val ? (val === "live" ? "var(--color-success-text)" : "var(--color-brand-blue)") : "var(--color-border-faint)"}` }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>{val === "live" ? "Producción" : "Sandbox"}</div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>{label}</div>
              </button>
            ))}
          </div>
          {facturApiEnv === "live" && (
            <div style={{ marginTop: "8px", padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "11px", color: "var(--color-warning-text)" }}>
              En modo Producción los timbres son reales y tienen costo fiscal. Asegúrate de usar tu API Key live de Facturapi.
            </div>
          )}
        </div>

       {/* FACTURAPI — solo estado de la organización */}
<Section
  title="Facturapi — PAC autorizado SAT"
  desc="Tu empresa está conectada al sistema de timbrado. Solo necesitas subir tus certificados CSD."
>
  {facturApiOrg ? (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success-text)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
      <div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-success-text)" }}>Empresa registrada en el sistema de timbrado</div>
        <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontFamily: "monospace", marginTop: "2px" }}>{facturApiOrg}</div>
      </div>
    </div>
  ) : (
    <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
      Sube tus certificados CSD abajo y guarda — el sistema registrará tu empresa automáticamente.
    </div>
  )}
</Section>

      {/* CERTIFICADOS CSD */}
      <Section
        title="Certificado de Sello Digital (CSD)"
        desc="Archivos .cer y .key emitidos por el SAT. Los necesitas para timbrar en producción."
      >
        <FileUploadRow type="cer" url={cerUrl} label="Certificado (.cer)" ext="cer" />
        <FileUploadRow type="key" url={keyUrl} label="Clave privada (.key)" ext="key" />
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
          Si aún no tienes CSD, puedes tramitarlos en <a href="https://www.sat.gob.mx" target="_blank" rel="noreferrer" style={{ color: "var(--color-brand-blue)" }}>sat.gob.mx</a> → CIEC → Certificados de Sello Digital.
          En sandbox de Facturapi no necesitas CSD — se generan automáticamente para pruebas.
        </div>
      </Section>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
          {error}
        </div>
      )}

      <div>
        <button onClick={handleSave} disabled={saving}
          style={{ height: "40px", padding: "0 28px", borderRadius: "var(--radius-md)", background: saved ? "var(--color-success-text)" : "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
          {saving ? "Guardando…" : saved ? "✓ Guardado" : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}
