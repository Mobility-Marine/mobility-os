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

function Section({ title, desc, badge, badgeColor, children }: {
  title: string; desc?: string;
  badge?: string; badgeColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 24px", display: "grid", gap: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid var(--color-border-faint)" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</div>
          {desc && <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>{desc}</div>}
        </div>
        {badge && (
          <span style={{
            fontSize: "10px", fontWeight: 700, padding: "3px 8px",
            borderRadius: "var(--radius-full)",
            background: badgeColor === "green" ? "var(--color-success-bg)" : badgeColor === "yellow" ? "var(--color-warning-bg)" : "var(--color-bg-subtle)",
            border: `1px solid ${badgeColor === "green" ? "var(--color-success-border)" : badgeColor === "yellow" ? "var(--color-warning-border)" : "var(--color-border-faint)"}`,
            color: badgeColor === "green" ? "var(--color-success-text)" : badgeColor === "yellow" ? "var(--color-warning-text)" : "var(--color-text-muted)",
            textTransform: "uppercase",
          }}>
            {badge}
          </span>
        )}
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

  const [cerUrl,       setCerUrl]       = useState<string | null>(null);
  const [keyUrl,       setKeyUrl]       = useState<string | null>(null);
  const [facturApiOrg, setFacturApiOrg] = useState("");
  const [uploading,    setUploading]    = useState<"cer" | "key" | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [registering,  setRegistering]  = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState<string | null>(null);

  // CSD upload directo a Facturapi
  const [cerFile,  setCerFile]  = useState<File | null>(null);
  const [keyFile,  setKeyFile]  = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [uploadingCSD, setUploadingCSD] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    fetchCompanySettings(companyId).then((s) => {
      if (!s) return;
      setCerUrl(s.cer_file_url ?? null);
      setKeyUrl(s.key_file_url ?? null);
      setFacturApiOrg((s as any).facturapi_org_id ?? "");
    });
  }, [companyId]);

  // Subir .cer/.key a Supabase Storage (para tener copia de referencia)
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

  // Registrar org + guardar URLs
  async function handleSave() {
    if (!companyId) return;
    setSaving(true); setError(null);
    try {
      await upsertCompanySettings(companyId, {
        cer_file_url: cerUrl ?? undefined,
        key_file_url: keyUrl ?? undefined,
        pac_provider: "facturapi",
      } as any);

      if (!facturApiOrg) {
        setRegistering(true);
        const res  = await fetch("/api/facturacion", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ action: "setup_org", companyId, payload: {} }),
        });
        const data = await res.json();
        if (res.ok && data.org_id) setFacturApiOrg(data.org_id);
        else if (!res.ok) throw new Error(data.error);
        setRegistering(false);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); setRegistering(false); }
  }

  // Registrar org manualmente (sin guardar archivos)
  async function handleRegisterOnly() {
    if (!companyId) return;
    setRegistering(true); setError(null);
    try {
      const res  = await fetch("/api/facturacion", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "setup_org", companyId, payload: {} }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFacturApiOrg(data.org_id);
      setSuccess(`✓ Organización registrada correctamente. ID: ${data.org_id}`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) { setError(e.message); }
    finally { setRegistering(false); }
  }

  // Subir CSD directamente a Facturapi
  async function handleUploadCSD() {
    if (!companyId || !cerFile || !keyFile || !password) {
      setError("Se requieren los archivos .cer, .key y la contraseña del CSD."); return;
    }
    setUploadingCSD(true); setError(null);
    try {
      const form = new FormData();
      form.append("companyId", companyId);
      form.append("cer",       cerFile);
      form.append("key",       keyFile);
      form.append("password",  password);
      if (facturApiOrg) form.append("orgId", facturApiOrg);

      const res  = await fetch("/api/facturacion/certificate", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCerFile(null); setKeyFile(null); setPassword("");
      setSuccess("✓ Certificados CSD subidos a Facturapi. La organización está lista para timbrar.");
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) { setError(e.message); }
    finally { setUploadingCSD(false); }
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
            {uploading === type ? "Subiendo..." : hasFile ? "Reemplazar" : "Subir"}
          </button>
          <input ref={ref} type="file" accept={`.${ext}`} style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(type, f); }} />
        </div>
      </div>
    );
  }

  // Checklist de activación
  const checks = [
    { label: "Organización registrada en Facturapi", done: !!facturApiOrg },
    { label: "CSD subido en Facturapi",              done: !!cerUrl || !!facturApiOrg, note: "Subido directamente en app.facturapi.io o desde aquí" },
    { label: "Suscripción activa",                   done: true, note: "Plan Platform activo" },
    { label: "Carta Manifiesto SAT firmada",         done: false, action: { label: "Firmar →", url: "https://www.facturapi.io/manifiesto" }, note: "Con e.firma (FIEL) — diferente al CSD" },
  ];

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>
        Sellos SAT & Facturación
      </div>

      {/* ALERTA CONFIDENCIAL */}
      <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-warning-text)", marginBottom: "4px" }}>
          Información confidencial
        </div>
        <div style={{ fontSize: "12px", color: "var(--color-warning-text)", lineHeight: 1.6 }}>
          Los sellos digitales son necesarios para timbrar CFDI 4.0 ante el SAT. Se almacenan de forma segura y solo se usan en el servidor, nunca en el navegador.
        </div>
      </div>

      {/* CHECKLIST */}
      <Section title="Estado de activación" desc="Pasos requeridos para timbrar con validez fiscal"
        badge={checks.every((c) => c.done) ? "Listo" : "Pendiente"}
        badgeColor={checks.every((c) => c.done) ? "green" : "yellow"}>
        <div style={{ display: "grid", gap: "8px" }}>
          {checks.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "var(--radius-md)", background: c.done ? "var(--color-success-bg)" : "var(--color-bg-subtle)", border: `1px solid ${c.done ? "var(--color-success-border)" : "var(--color-border-faint)"}` }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: c.done ? "var(--color-success-text)" : "var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {c.done
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : <span style={{ fontSize: "10px", color: "var(--color-text-muted)", fontWeight: 700 }}>{i + 1}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: c.done ? "var(--color-success-text)" : "var(--color-text-primary)" }}>{c.label}</div>
                {c.note && <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "1px" }}>{c.note}</div>}
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
            <button onClick={handleRegisterOnly} disabled={registering}
              style={{ height: "30px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer", alignSelf: "start" }}>
              {registering ? "Sincronizando…" : "↺ Resincronizar org_id"}
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
              {registering
                ? "Registrando tu empresa en el sistema de timbrado..."
                : "Si ya configuraste tu organización directamente en Facturapi, presiona el botón para vincularla aquí. Si aún no lo has hecho, sube tus archivos CSD primero."}
            </div>
            <button onClick={handleRegisterOnly} disabled={registering}
              style={{ height: "40px", padding: "0 20px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", alignSelf: "start" }}>
              {registering ? "Registrando…" : "Registrar / Vincular organización →"}
            </button>
          </div>
        )}
      </Section>

      {/* CERTIFICADOS CSD — Supabase Storage (copia de referencia) */}
      <Section title="Certificado de Sello Digital (CSD)" desc="Archivos .cer y .key emitidos por el SAT para tu empresa.">
        <FileUploadRow type="cer" url={cerUrl} label="Certificado (.cer)" ext="cer" />
        <FileUploadRow type="key" url={keyUrl} label="Clave privada (.key)" ext="key" />
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
          Si ya subiste tus archivos CSD directamente en{" "}
          <a href="https://app.facturapi.io" target="_blank" rel="noreferrer" style={{ color: "var(--color-brand-blue)" }}>app.facturapi.io</a>
          , no necesitas subirlos aquí. Esta sección es opcional — sirve para guardar una copia de referencia.
        </div>
        <div>
          <button onClick={handleSave} disabled={saving}
            style={{ height: "40px", padding: "0 28px", borderRadius: "var(--radius-md)", background: saved ? "var(--color-success-text)" : "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
            {registering ? "Registrando empresa..." : saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar configuración"}
          </button>
        </div>
      </Section>

      {/* SUBIR CSD DIRECTO A FACTURAPI */}
      <Section title="Subir CSD directamente a Facturapi"
        desc="Para clientes SaaS o si necesitas actualizar tus certificados en Facturapi desde Mobility OS">
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
          Esta sección sube los certificados <strong>directamente a Facturapi</strong> para activar el timbrado en modo Live. Requiere que la organización ya esté registrada arriba. El CSD tiene vigencia de 4 años.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Certificado (.cer)</div>
            <div onClick={() => document.getElementById("csd-cer-input")?.click()}
              style={{ height: "40px", padding: "0 14px", borderRadius: "var(--radius-md)", border: `1px dashed ${cerFile ? "var(--color-success-border)" : "var(--color-border)"}`, background: cerFile ? "var(--color-success-bg)" : "var(--color-bg-subtle)", color: cerFile ? "var(--color-success-text)" : "var(--color-text-muted)", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              {cerFile ? `✓ ${cerFile.name}` : "Seleccionar archivo .cer"}
            </div>
            <input id="csd-cer-input" type="file" accept=".cer" style={{ display: "none" }} onChange={(e) => setCerFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Clave privada (.key)</div>
            <div onClick={() => document.getElementById("csd-key-input")?.click()}
              style={{ height: "40px", padding: "0 14px", borderRadius: "var(--radius-md)", border: `1px dashed ${keyFile ? "var(--color-success-border)" : "var(--color-border)"}`, background: keyFile ? "var(--color-success-bg)" : "var(--color-bg-subtle)", color: keyFile ? "var(--color-success-text)" : "var(--color-text-muted)", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              {keyFile ? `✓ ${keyFile.name}` : "Seleccionar archivo .key"}
            </div>
            <input id="csd-key-input" type="file" accept=".key" style={{ display: "none" }} onChange={(e) => setKeyFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Contraseña del CSD</div>
          <div style={{ position: "relative" }}>
            <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña que definiste al generar el CSD en el SAT"
              style={{ ...INPUT, paddingRight: "40px" }} />
            <button onClick={() => setShowPass((p) => !p)}
              style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "2px" }}>
              {showPass
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
        </div>
        <button onClick={handleUploadCSD} disabled={uploadingCSD || !cerFile || !keyFile || !password}
          style={{ height: "40px", padding: "0 24px", borderRadius: "var(--radius-md)", background: cerFile && keyFile && password ? "var(--color-success-text)" : "var(--color-bg-subtle)", color: cerFile && keyFile && password ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: uploadingCSD || !cerFile || !keyFile || !password ? "not-allowed" : "pointer", alignSelf: "start" }}>
          {uploadingCSD ? "Subiendo certificados a Facturapi…" : "↑ Subir CSD a Facturapi"}
        </button>
      </Section>

      {/* CARTA MANIFIESTO */}
      <Section title="Carta Manifiesto SAT" desc="Requerimiento obligatorio del SAT para autorizar a Facturapi como tu proveedor de certificación">
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
          Requiere tu <strong>e.firma (FIEL)</strong> — diferente al CSD. Son los archivos .cer y .key de tu Firma Electrónica Avanzada. El proceso toma menos de 5 minutos directamente en el portal de Facturapi.
        </div>
        <a href="https://www.facturapi.io/manifiesto" target="_blank" rel="noopener noreferrer"
          style={{ height: "40px", padding: "0 20px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", alignSelf: "start" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Ir a firmar Carta Manifiesto →
        </a>
      </Section>

      {/* MODO SAAS */}
      <Section title="Modo SaaS — Clientes futuros" desc="Flujo automático cuando Mobility OS tenga empresas clientes">
        <div style={{ display: "grid", gap: "6px" }}>
          {[
            { n: "1", t: "Se crea automáticamente la org del cliente",     d: "Via User Secret Key → POST /organizations" },
            { n: "2", t: "El cliente sube su CSD desde Settings → Sellos", d: "PUT /organizations/:id/certificate" },
            { n: "3", t: "El cliente firma su Carta Manifiesto",            d: "facturapi.io/manifiesto — con su e.firma" },
            { n: "4", t: "El cliente timbre con su propio RFC",             d: "Sin costo adicional — plan Platform incluido" },
          ].map((s) => (
            <div key={s.n} style={{ display: "flex", gap: "10px", padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--color-brand-blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#fff", flexShrink: 0, marginTop: "1px" }}>{s.n}</div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{s.t}</div>
                <div style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--color-text-muted)", marginTop: "2px" }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* MENSAJES */}
      {error && (
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontSize: "13px", fontWeight: 600 }}>
          {success}
        </div>
      )}
    </div>
  );
}
