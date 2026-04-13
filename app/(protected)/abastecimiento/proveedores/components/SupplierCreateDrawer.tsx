"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant }       from "@/lib/tenant/TenantProvider";
import { useAuth }         from "@/lib/auth/AuthProvider";
import { supabase }        from "@/lib/supabaseClient";

type Props = { open: boolean; onClose: () => void; onCreated: () => void };

const INPUT: React.CSSProperties = {
  width: "100%", height: "38px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

export default function SupplierCreateDrawer({ open, onClose, onCreated }: Props) {
  const { t }          = useTranslation();
  const { companyId }  = useTenant();
  const { user }       = useAuth();
  const tp             = (t.procurement as any) ?? {};

  const [saving,       setSaving]      = useState(false);
  const [error,        setError]       = useState<string | null>(null);
  const [name,         setName]        = useState("");
  const [legalName,    setLegalName]   = useState("");
  const [rfc,          setRfc]         = useState("");
  const [email,        setEmail]       = useState("");
  const [phone,        setPhone]       = useState("");
  const [city,         setCity]        = useState("");
  const [country,      setCountry]     = useState("México");
  const [paymentTerms, setPaymentTerms]= useState("");
  const [notes,        setNotes]       = useState("");

  async function handleCreate() {
    if (!name.trim() || !companyId) return;
    setSaving(true); setError(null);
    try {
      const { error: err } = await supabase.from("clients").insert({
        company_id:    companyId,
        name:          name.trim(),
        legal_name:    legalName  || null,
        rfc:           rfc        || null,
        email:         email      || null,
        phone:         phone      || null,
        city:          city       || null,
        country:       country    || null,
        payment_terms: paymentTerms || null,
        notes:         notes      || null,
        roles:         ["supplier"],
        is_active:     true,
        created_by:    user?.id,
      });
      if (err) throw err;
      onCreated();
      handleClose();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  function handleClose() {
    setName(""); setLegalName(""); setRfc(""); setEmail(""); setPhone("");
    setCity(""); setCountry("México"); setPaymentTerms(""); setNotes("");
    setError(null); onClose();
  }

  if (!open) return null;

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(460px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{tp.newSupplier ?? "Nuevo proveedor"}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{tp.suppliersDesc ?? "Catálogo de proveedores"}</div>
          </div>
          <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>

          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tp.supplierName ?? "Nombre comercial"} *</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del proveedor" style={INPUT} />
          </div>

          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Razón social</div>
            <input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Razón social o nombre legal" style={INPUT} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tp.supplierRfc ?? "RFC"}</div>
              <input value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase())} style={{ ...INPUT, textTransform: "uppercase" }} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tp.supplierEmail ?? "Email"}</div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tp.supplierPhone ?? "Teléfono"}</div>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tp.supplierCity ?? "Ciudad"}</div>
              <input value={city} onChange={(e) => setCity(e.target.value)} style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tp.supplierCountry ?? "País"}</div>
              <input value={country} onChange={(e) => setCountry(e.target.value)} style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tp.supplierPaymentTerms ?? "Condiciones de pago"}</div>
              <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                <option value="">— Seleccionar —</option>
                {["Contado","7 días","15 días","30 días","45 días","60 días","90 días"].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tp.supplierNotes ?? "Notas"}</div>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...INPUT, height: "auto", padding: "10px", resize: "vertical", lineHeight: 1.5 }} />
          </div>

          <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-brand-blue)", lineHeight: 1.6 }}>
            El proveedor se registra en el catálogo de Clientes con rol "Proveedor". La documentación fiscal y bancaria se completa después en el workspace.
          </div>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{error}</div>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={handleClose} style={{ height: "40px", padding: "0 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
            {t.general.cancel}
          </button>
          <button onClick={handleCreate} disabled={saving || !name.trim()} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: name.trim() ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", color: name.trim() ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving || !name.trim() ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? t.general.loading : (tp.newSupplier ?? "Registrar proveedor")}
          </button>
        </div>
      </div>
    </>
  );
}
