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
  const { companyId } = useTenant();
  const cerRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);

  const [cerUrl,      setCerUrl]      = useState<string | null>(null);
  const [keyUrl,      setKeyUrl]      = useState<string | null>(null);
  const [facturApiOrg,setFacturApiOrg]= useState("");
  const [uploading,   setUploading]   = useState<"cer" | "key" | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [registering, setRegistering] = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    fetchCompanySettings(companyId).then((s) => {
      if (!s) return;
      setCerUrl(s.cer_file_url ?? null);
      setKeyUrl(s.key_file_url ?? null);
      setFacturApiOrg((s as any).facturapi_org_id ?? "");
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

  async function handleSave() {
    if (!companyId) return;
    setSaving(true); setError(null);
    try {
      // Guardar archivos CSD
      await upsertCompanySettings(companyId, {
        cer_file_url: cerUrl ?? undefined,
        key_file_url: keyUrl ?? undefined,
        pac_provider: "facturapi",
      } as any);

      // Si aún no tiene org en Facturapi, registrarla automáticamente
      if (!facturApiOrg) {
        setRegistering(true);
        const res = await fetch("/api/facturacion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "setup_org", companyId, payload: {} }),
        });
        const data = await res.json();
        if (res.ok && data.org_id) {
          setFacturApiOrg(data.org_id);
        }
        setRegistering(false);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); setRegistering(false); }
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
          Los sellos digitales son necesarios para timbrar CFDI 4.0 ante el SAT. Se almacenan de forma segura y solo se usan en el servidor, nunca en el navegador.
        </div>
      </div>

      {/* ESTADO FACTURAPI */}
      <Section
        title="Sistema de timbrado"
        desc="Powered by Facturapi — PAC autorizado por el SAT."
      >
        {facturApiOrg ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success-text)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-success-text)" }}>Empresa registrada en el sistema de timbrado</div>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontFamily: "monospace", marginTop: "2px" }}>ID: {facturApiOrg}</div>
            </div>
          </div>
        ) : (
          <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
            {registering
              ? "Registrando tu empresa en el sistema de timbrado…"
              : "Sube tus certificados CSD y presiona Guardar — el sistema registrará tu empresa automáticamente."}
          </div>
        )}
      </Section>

      {/* CERTIFICADOS CSD */}
      <Section
        title="Certificado de Sello Digital (CSD)"
        desc="Archivos .cer y .key emitidos por el SAT para tu empresa."
      >
        <FileUploadRow type="cer" url={cerUrl} label="Certificado (.cer)" ext="cer" />
        <FileUploadRow type="key" url={keyUrl} label="Clave privada (.key)" ext="key" />
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
          Si aún no tienes CSD, puedes tramitarlos en{" "}
          <a href="https://www.sat.gob.mx" target="_blank" rel="noreferrer" style={{ color: "var(--color-brand-blue)" }}>sat.gob.mx</a>
          {" "}→ CIEC → Certificados de Sello Digital.
          En sandbox no necesitas CSD — Facturapi genera certificados de prueba automáticamente.
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
          {registering ? "Registrando empresa…" : saving ? "Guardando…" : saved ? "✓ Guardado" : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}
