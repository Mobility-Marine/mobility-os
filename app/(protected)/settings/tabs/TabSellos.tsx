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
  const { t }         = useTranslation();
  const { companyId } = useTenant();
  const cerRef        = useRef<HTMLInputElement>(null);
  const keyRef        = useRef<HTMLInputElement>(null);

  const [cerUrl,   setCerUrl]   = useState<string | null>(null);
  const [keyUrl,   setKeyUrl]   = useState<string | null>(null);
  const [pacProvider, setPacProvider] = useState("facturama");
  const [uploading, setUploading] = useState<"cer" | "key" | null>(null);
  const [saving,  setSaving]   = useState(false);
  const [saved,   setSaved]    = useState(false);
  const [error,   setError]    = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    fetchCompanySettings(companyId).then((s) => {
      if (s) {
        setCerUrl(s.cer_file_url ?? null);
        setKeyUrl(s.key_file_url ?? null);
        setPacProvider(s.pac_provider ?? "facturama");
      }
    });
  }, [companyId]);

  async function uploadFile(type: "cer" | "key", file: File) {
    if (!companyId) return;
    setUploading(type);
    const path = `sellos/${companyId}/${type}.${file.name.split(".").pop()}`;
    const { error: upErr } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true });
    if (upErr) { setError(upErr.message); setUploading(null); return; }
    const { data } = supabase.storage.from("company-assets").getPublicUrl(path);
    if (type === "cer") setCerUrl(data.publicUrl);
    else setKeyUrl(data.publicUrl);
    setUploading(null);
  }

  async function handleSave() {
    if (!companyId) return;
    setSaving(true);
    try {
      await upsertCompanySettings(companyId, {
        cer_file_url:  cerUrl ?? undefined,
        key_file_url:  keyUrl ?? undefined,
        pac_provider:  pacProvider,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  function FileUploadRow({ type, url, label, ext }: { type: "cer" | "key"; url: string | null; label: string; ext: string }) {
    const ref = type === "cer" ? cerRef : keyRef;
    const hasFile = !!url;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
          <div style={{
            height: "38px", padding: "0 12px",
            borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
            background: "var(--color-bg-subtle)", display: "flex", alignItems: "center", gap: "8px",
          }}>
            {hasFile ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-success-text)" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ fontSize: "12px", color: "var(--color-success-text)", fontWeight: 600 }}>
                  Archivo cargado · .{ext}
                </span>
              </>
            ) : (
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Sin archivo</span>
            )}
          </div>
        </div>
        <div style={{ paddingTop: "20px" }}>
          <button onClick={() => ref.current?.click()} disabled={uploading === type} style={{
            height: "38px", padding: "0 16px", borderRadius: "var(--radius-md)",
            background: hasFile ? "var(--color-bg-subtle)" : "var(--color-brand-blue)",
            border: hasFile ? "1px solid var(--color-border)" : "none",
            color: hasFile ? "var(--color-text-second)" : "#fff",
            fontSize: "12px", fontWeight: 600, cursor: "pointer",
          }}>
            {uploading === type ? t.general.loading : hasFile ? "Reemplazar" : "Subir"}
          </button>
          <input
            ref={ref}
            type="file"
            accept={`.${ext}`}
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(type, f); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>
        {(t.settings as any)?.tabSellos ?? "Sellos SAT"}
      </div>

      {/* ALERT */}
      <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-warning-text)", marginBottom: "4px" }}>
          🔒 Información confidencial
        </div>
        <div style={{ fontSize: "12px", color: "var(--color-warning-text)", lineHeight: 1.6 }}>
          Los sellos digitales son necesarios para timbrar facturas CFDI 4.0 ante el SAT.
          Se almacenan de forma segura y solo se usan para generar timbres.
        </div>
      </div>

      {/* CERTIFICADOS */}
      <Section
        title={(t.settings as any)?.sellsTitle ?? "Certificado de Sello Digital"}
        desc={(t.settings as any)?.sellsDesc ?? "Archivos CER y KEY emitidos por el SAT para tu empresa."}
      >
        <FileUploadRow type="cer" url={cerUrl} label="Certificado (.cer)" ext="cer" />
        <FileUploadRow type="key" url={keyUrl} label="Clave privada (.key)" ext="key" />
      </Section>

      {/* PAC */}
      <Section
        title={(t.settings as any)?.pacTitle ?? "Proveedor de timbrado (PAC)"}
        desc={(t.settings as any)?.pacDesc ?? "El PAC es el intermediario autorizado por el SAT para timbrar CFDI."}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
          {[
            { value: "facturama", name: "Facturama", desc: "Recomendado — API REST moderna, sandbox gratuito" },
            { value: "sw_sapiens",name: "SW Sapiens", desc: "StampDE — amplia compatibilidad" },
          ].map((pac) => (
            <button key={pac.value} onClick={() => setPacProvider(pac.value)} style={{
              padding: "14px", borderRadius: "var(--radius-md)", textAlign: "left", cursor: "pointer",
              background: pacProvider === pac.value ? "var(--color-info-bg)" : "var(--color-bg-subtle)",
              border: `2px solid ${pacProvider === pac.value ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
            }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>{pac.name}</div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{pac.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
          La integración completa con el PAC se activa en el módulo <strong>Finanzas → Facturación</strong>.
          Aquí solo configuras el proveedor y cargas tus sellos.
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
