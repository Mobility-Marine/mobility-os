"use client";
import { useState, useRef, useEffect } from "react";
import type { LogisticsProvider, ProviderDocument } from "../types/providers.types";
import { PROVIDER_TYPE_CONFIG, DOC_TYPE_CONFIG, DOC_TYPES } from "../types/providers.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth }   from "@/lib/auth/AuthProvider";
import { uploadProviderDocument, deleteProviderDocument } from "../services/providers.service";
import { supabase } from "@/lib/supabaseClient";

type Tab = "info" | "tarifario" | "documents" | "cxp" | "shipments";

type ProviderRate = {
  id:           string;
  service_type: string;
  origin?:      string | null;
  destination?: string | null;
  currency:     string;
  rate:         number;
  rate_type:    string;
  unit?:        string | null;
  min_charge?:  number | null;
  transit_days?:number | null;
  valid_from?:  string | null;
  valid_until?: string | null;
  notes?:       string | null;
  is_active:    boolean;
};

type APRecord = {
  id:             string;
  supplier_name:  string;
  document_number?:string | null;
  document_date:  string;
  currency:       string;
  total:          number;
  balance:        number;
  status:         string;
  payment_status: string;
  related_shipment_id?: string | null;
  shipment?:      { reference: string } | null;
};

type Props = {
  provider:  LogisticsProvider | null;
  onUpdate:  (id: string, updates: Partial<LogisticsProvider>) => Promise<void>;
  onToggle:  (id: string, active: boolean) => Promise<void>;
  onDelete:  (id: string) => Promise<void>;
  onReload:  () => Promise<void>;
  saving:    boolean;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

const SERVICE_TYPES = ["terrestre","maritimo","aereo","almacenaje","aduanal","seguro","courier","consultoria","otro"];
const RATE_TYPES    = [
  { v: "flat",          l: "Tarifa fija"       },
  { v: "per_kg",        l: "Por kg"            },
  { v: "per_cbm",       l: "Por CBM"           },
  { v: "per_container", l: "Por contenedor"    },
  { v: "per_truck",     l: "Por camión"        },
  { v: "percentage",    l: "Porcentaje (%)"    },
];

const AP_STATUS_COLOR: Record<string, string> = {
  pending:   "#f59e0b",
  approved:  "#3b82f6",
  paid:      "#10b981",
  cancelled: "#ef4444",
  overdue:   "#ef4444",
};

export default function ProviderWorkspace({ provider, onUpdate, onToggle, onDelete, onReload, saving }: Props) {
  const { t, lang }   = useTranslation();
  const { companyId } = useTenant();
  const { user }      = useAuth();
  const tl            = (t.logistics as any) ?? {};
  const locale        = lang === "en" ? "en-US" : "es-MX";

  const [tab,        setTab]        = useState<Tab>("info");
  const [editing,    setEditing]    = useState(false);
  const [form,       setForm]       = useState<Partial<LogisticsProvider>>({});
  const [confirmDel, setConfirmDel] = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [showUploadDoc, setShowUploadDoc] = useState(false);

  // Tarifario
  const [rates,       setRates]       = useState<ProviderRate[]>([]);
  const [loadingRates,setLoadingRates]= useState(false);
  const [addingRate,  setAddingRate]  = useState(false);
  const [savingRate,  setSavingRate]  = useState(false);
  const EMPTY_RATE = { service_type: "terrestre", origin: "", destination: "", currency: "USD", rate: "", rate_type: "flat", unit: "", min_charge: "", transit_days: "", valid_from: "", valid_until: "", notes: "" };
  const [rateForm, setRateForm] = useState<any>(EMPTY_RATE);

  // CXP
  const [apRecords,    setApRecords]    = useState<APRecord[]>([]);
  const [loadingAP,    setLoadingAP]    = useState(false);

    // Shipments
  const [shipments,      setShipments]      = useState<any[]>([]);
  const [loadingShips,   setLoadingShips]   = useState(false);

  // Documents
  const docFileRef = useRef<HTMLInputElement>(null);
  const [docForm, setDocForm] = useState({ doc_type: "fiscal", expiry_date: "", notes: "" });
  const [docFile, setDocFile] = useState<File | null>(null);

  // Cargar tarifario cuando cambia tab o proveedor
  useEffect(() => {
    if (tab !== "tarifario" || !provider || !companyId) return;
    setLoadingRates(true);
    supabase.from("provider_rates")
      .select("*").eq("provider_id", provider.id).eq("company_id", companyId).eq("is_active", true).order("service_type")
      .then(({ data }) => { setRates(data ?? []); setLoadingRates(false); });
  }, [tab, provider?.id, companyId]);

  // Cargar CXP cuando cambia tab o proveedor
  useEffect(() => {
    if (tab !== "cxp" || !provider || !companyId) return;
    setLoadingAP(true);
    supabase.from("accounts_payable")
      .select("id, supplier_name, document_number, document_date, currency, total, balance, status, payment_status, related_shipment_id, shipment:shipments(reference)")
      .eq("company_id", companyId)
      .eq("logistics_provider_id", provider.id)
      .order("document_date", { ascending: false })
      .then(({ data }) => { setApRecords((data ?? []) as any); setLoadingAP(false); });
  }, [tab, provider?.id, companyId]);

  useEffect(() => {
    if (tab !== "shipments" || !provider || !companyId) return;
    setLoadingShips(true);
    // Buscar por provider_id directo + por accounts_payable
    Promise.all([
      supabase.from("shipments")
        .select("id, reference, service_type, status, currency, total, created_at, client:business_partners!client_id(name)")
        .eq("company_id", companyId)
        .eq("provider_id", provider.id),
      supabase.from("accounts_payable")
        .select("related_shipment_id, shipment:shipments(id, reference, service_type, status, currency, total, created_at, client:business_partners!client_id(name))")
        .eq("company_id", companyId)
        .eq("logistics_provider_id", provider.id)
        .not("related_shipment_id", "is", null),
    ]).then(([direct, viaAP]) => {
      const directList = (direct.data ?? []);
      const apList = (viaAP.data ?? [])
        .map((r: any) => r.shipment)
        .filter(Boolean);
      // Deduplicar por id
      const map = new Map<string, any>();
      [...directList, ...apList].forEach(s => { if (s?.id) map.set(s.id, s); });
      setShipments([...map.values()]);
      setLoadingShips(false);
    });
  }, [tab, provider?.id, companyId]);
  
  if (!provider) return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", height: "100%" }}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
        <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Selecciona un proveedor</div>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }}>
        Aquí verás información, tarifario, documentos legales y cuentas por pagar.
      </div>
    </div>
  );

  const cfg       = PROVIDER_TYPE_CONFIG[provider.provider_type];
  const typeLabel = tl[`type${provider.provider_type.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`] ?? provider.provider_type;
  const docs      = provider.documents ?? [];

  // Totales CXP
  const apTotalByCurrency = apRecords.reduce((acc, ap) => {
    acc[ap.currency] = (acc[ap.currency] ?? 0) + Number(ap.total);
    return acc;
  }, {} as Record<string, number>);
  const apPendingCount = apRecords.filter(ap => ["pending","approved","overdue"].includes(ap.status)).length;

  const TABS: { key: Tab; label: string }[] = [
    { key: "info",      label: "Información"  },
    { key: "tarifario", label: "Tarifario"    },
    { key: "documents", label: `Documentos (${docs.length})` },
    { key: "cxp",       label: `CXP${apPendingCount > 0 ? ` (${apPendingCount})` : ""}` },
    { key: "shipments", label: "Embarques"    },
  ];

  function set(k: keyof LogisticsProvider, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  // ── TARIFARIO ─────────────────────────────────────────────

  async function handleSaveRate() {
    if (!companyId || !rateForm.rate) return;
    setSavingRate(true);
    try {
      await supabase.from("provider_rates").insert({
        company_id:   companyId,
        provider_id:  provider.id,
        service_type: rateForm.service_type,
        origin:       rateForm.origin       || null,
        destination:  rateForm.destination  || null,
        currency:     rateForm.currency,
        rate:         parseFloat(rateForm.rate) || 0,
        rate_type:    rateForm.rate_type,
        unit:         rateForm.unit         || null,
        min_charge:   rateForm.min_charge   ? parseFloat(rateForm.min_charge) : null,
        transit_days: rateForm.transit_days ? parseInt(rateForm.transit_days) : null,
        valid_from:   rateForm.valid_from   || null,
        valid_until:  rateForm.valid_until  || null,
        notes:        rateForm.notes        || null,
        created_by:   user?.id ?? null,
      });
      // Recargar
      const { data } = await supabase.from("provider_rates")
        .select("*").eq("provider_id", provider.id).eq("company_id", companyId).eq("is_active", true).order("service_type");
      setRates(data ?? []);
      setAddingRate(false);
      setRateForm(EMPTY_RATE);
    } finally { setSavingRate(false); }
  }

  async function handleDeleteRate(rateId: string) {
    await supabase.from("provider_rates").update({ is_active: false }).eq("id", rateId);
    setRates(prev => prev.filter(r => r.id !== rateId));
  }

  // ── DOCUMENTS ─────────────────────────────────────────────

  async function handleUploadDoc() {
    if (!docFile || !companyId || !user) return;
    setUploading(true);
    try {
      await uploadProviderDocument(companyId, user.id, provider.id, docFile, docForm.doc_type, docForm.expiry_date || undefined, docForm.notes || undefined);
      await onReload();
      setShowUploadDoc(false);
      setDocFile(null);
      setDocForm({ doc_type: "fiscal", expiry_date: "", notes: "" });
    } catch (e: any) { alert(e.message); }
    finally { setUploading(false); }
  }

  function getDocExpiryStatus(doc: ProviderDocument): "expired" | "soon" | "ok" | null {
    if (!doc.expiry_date) return null;
    const now = Date.now(), exp = new Date(doc.expiry_date).getTime();
    if (exp < now) return "expired";
    if (exp < now + 30 * 86400000) return "soon";
    return "ok";
  }

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>

      {/* HEADER */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: provider.is_active ? cfg.color : "var(--color-text-muted)", flexShrink: 0 }} />
              <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{provider.name}</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                {typeLabel}
              </span>
              <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "var(--radius-full)", background: provider.is_active ? "var(--color-success-bg)" : "var(--color-bg-subtle)", border: `1px solid ${provider.is_active ? "var(--color-success-border)" : "var(--color-border-faint)"}`, color: provider.is_active ? "var(--color-success-text)" : "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                {provider.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>
            {provider.contact_name && (
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>
                {provider.contact_name}
                {provider.contact_phone && ` · ${provider.contact_phone}`}
                {provider.contact_email && ` · ${provider.contact_email}`}
              </div>
            )}
          </div>
          {provider.rating && (
            <div style={{ fontSize: "16px", color: "var(--color-warning-text)", flexShrink: 0 }}>
              {"★".repeat(provider.rating)}{"☆".repeat(5 - provider.rating)}
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {!editing ? (
            <button onClick={() => { setForm({ ...provider }); setEditing(true); }} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              {t.general.edit}
            </button>
          ) : (
            <>
              <button onClick={async () => { await onUpdate(provider.id, form); setEditing(false); setForm({}); }} disabled={saving} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                {saving ? t.general.loading : `✓ ${t.general.save}`}
              </button>
              <button onClick={() => { setEditing(false); setForm({}); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                {t.general.cancel}
              </button>
            </>
          )}
          <button onClick={() => onToggle(provider.id, !provider.is_active)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: provider.is_active ? "var(--color-warning-bg)" : "var(--color-success-bg)", border: `1px solid ${provider.is_active ? "var(--color-warning-border)" : "var(--color-success-border)"}`, color: provider.is_active ? "var(--color-warning-text)" : "var(--color-success-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
            {provider.is_active ? "Desactivar" : "Activar"}
          </button>
          {!confirmDel ? (
            <button onClick={() => setConfirmDel(true)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
              Eliminar
            </button>
          ) : (
            <>
              <button onClick={() => onDelete(provider.id)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                ¿Confirmar?
              </button>
              <button onClick={() => setConfirmDel(false)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                No
              </button>
            </>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0, overflowX: "auto" }}>
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{ height: "36px", padding: "0 14px", border: "none", background: "transparent", whiteSpace: "nowrap", borderBottom: tab === tb.key ? "2px solid var(--color-brand-blue)" : "2px solid transparent", color: tab === tb.key ? "var(--color-brand-blue)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: tab === tb.key ? 700 : 400, cursor: "pointer" }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>

        {/* ── INFO ── */}
        {tab === "info" && (
          <div style={{ display: "grid", gap: "12px" }}>
            {editing ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { k: "name",             label: "Nombre",             cols: "1 / -1" },
                  { k: "contact_name",     label: "Contacto"            },
                  { k: "contact_email",    label: "Email"               },
                  { k: "contact_phone",    label: "Teléfono"            },
                  { k: "website",          label: "Sitio web"           },
                  { k: "rfc",              label: "RFC"                 },
                  { k: "tax_id",           label: "Tax ID"              },
                  { k: "scac_code",        label: "SCAC"                },
                  { k: "payment_terms",    label: "Condiciones pago"    },
                  { k: "coverage_routes",  label: "Rutas",  cols: "1 / -1" },
                  { k: "services_offered", label: "Servicios", cols: "1 / -1" },
                ].map((f) => (
                  <div key={f.k} style={{ gridColumn: (f as any).cols ?? "auto" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</div>
                    <input value={(form as any)[f.k] ?? ""} onChange={(e) => set(f.k as keyof LogisticsProvider, e.target.value)} style={INPUT} />
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Calificación</div>
                  <select value={(form as any).rating ?? ""} onChange={(e) => set("rating", e.target.value ? Number(e.target.value) : null)} style={{ ...INPUT, cursor: "pointer" }}>
                    <option value="">—</option>
                    {[1,2,3,4,5].map((n) => <option key={n} value={n}>{"★".repeat(n)} ({n}/5)</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Notas</div>
                  <textarea value={(form as any).notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "14px" }}>
                {[
                  { label: "Tipo",         value: typeLabel },
                  { label: "RFC",          value: provider.rfc },
                  { label: "Tax ID",       value: provider.tax_id },
                  { label: "SCAC",         value: provider.scac_code },
                  { label: "Contacto",     value: provider.contact_name },
                  { label: "Email",        value: provider.contact_email },
                  { label: "Teléfono",     value: provider.contact_phone },
                  { label: "Web",          value: provider.website },
                  { label: "Pago",         value: provider.payment_terms },
                  { label: "Calificación", value: provider.rating ? `${"★".repeat(provider.rating)} (${provider.rating}/5)` : null },
                ].map((r) => r.value ? (
                  <div key={r.label}>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{r.label}</div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", wordBreak: "break-all" }}>{r.value}</div>
                  </div>
                ) : null)}
                {provider.coverage_routes && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rutas</div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>{provider.coverage_routes}</div>
                  </div>
                )}
                {provider.services_offered && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Servicios</div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>{provider.services_offered}</div>
                  </div>
                )}
                {provider.notes && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Notas</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontStyle: "italic" }}>{provider.notes}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TARIFARIO ── */}
        {tab === "tarifario" && (
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                Tarifas vigentes de {provider.name}
              </div>
              {!addingRate && (
                <button onClick={() => setAddingRate(true)} style={{ height: "30px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Nueva tarifa
                </button>
              )}
            </div>

            {/* Formulario nueva tarifa */}
            {addingRate && (
              <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", display: "grid", gap: "10px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Nueva tarifa</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Tipo de servicio *</div>
                    <select value={rateForm.service_type} onChange={e => setRateForm((p: any) => ({ ...p, service_type: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                      {SERVICE_TYPES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Tipo de tarifa *</div>
                    <select value={rateForm.rate_type} onChange={e => setRateForm((p: any) => ({ ...p, rate_type: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                      {RATE_TYPES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Origen</div>
                    <input value={rateForm.origin} onChange={e => setRateForm((p: any) => ({ ...p, origin: e.target.value }))} placeholder="Ciudad, Puerto, Aeropuerto…" style={INPUT} />
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Destino</div>
                    <input value={rateForm.destination} onChange={e => setRateForm((p: any) => ({ ...p, destination: e.target.value }))} placeholder="Ciudad, Puerto, Aeropuerto…" style={INPUT} />
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Tarifa *</div>
                    <input type="number" min="0" value={rateForm.rate} onChange={e => setRateForm((p: any) => ({ ...p, rate: e.target.value }))} placeholder="0.00" style={INPUT} />
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Moneda</div>
                    <select value={rateForm.currency} onChange={e => setRateForm((p: any) => ({ ...p, currency: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                      {["USD","MXN","EUR"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Cargo mínimo</div>
                    <input type="number" min="0" value={rateForm.min_charge} onChange={e => setRateForm((p: any) => ({ ...p, min_charge: e.target.value }))} placeholder="0.00" style={INPUT} />
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Días tránsito</div>
                    <input type="number" min="0" value={rateForm.transit_days} onChange={e => setRateForm((p: any) => ({ ...p, transit_days: e.target.value }))} placeholder="0" style={INPUT} />
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Válida desde</div>
                    <input type="date" value={rateForm.valid_from} onChange={e => setRateForm((p: any) => ({ ...p, valid_from: e.target.value }))} style={INPUT} />
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Válida hasta</div>
                    <input type="date" value={rateForm.valid_until} onChange={e => setRateForm((p: any) => ({ ...p, valid_until: e.target.value }))} style={INPUT} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Notas</div>
                    <input value={rateForm.notes} onChange={e => setRateForm((p: any) => ({ ...p, notes: e.target.value }))} placeholder="Condiciones especiales, restricciones…" style={INPUT} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleSaveRate} disabled={savingRate || !rateForm.rate} style={{ height: "32px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    {savingRate ? "Guardando…" : "Guardar tarifa"}
                  </button>
                  <button onClick={() => { setAddingRate(false); setRateForm(EMPTY_RATE); }} style={{ height: "32px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {loadingRates ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "12px" }}>Cargando tarifario…</div>
            ) : rates.length === 0 ? (
              <div style={{ padding: "28px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                Sin tarifas registradas — agrega la primera con el botón de arriba
              </div>
            ) : rates.map((rate) => (
              <div key={rate.id} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "grid", gap: "5px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "var(--radius-full)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", color: "var(--color-info-text)", textTransform: "capitalize" }}>
                    {rate.service_type}
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--color-text-muted)", padding: "1px 6px", borderRadius: "var(--radius-full)", background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)" }}>
                    {RATE_TYPES.find(r => r.v === rate.rate_type)?.l ?? rate.rate_type}
                  </span>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                    {rate.currency} ${Number(rate.rate).toLocaleString(locale, { minimumFractionDigits: 2 })}
                  </span>
                  <button onClick={() => handleDeleteRate(rate.id)} style={{ width: "24px", height: "24px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                {(rate.origin || rate.destination) && (
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                    {[rate.origin, rate.destination].filter(Boolean).join(" → ")}
                    {rate.transit_days && ` · ${rate.transit_days} días tránsito`}
                  </div>
                )}
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", display: "flex", gap: "10px" }}>
                  {rate.min_charge && <span>Mín: {rate.currency} ${Number(rate.min_charge).toLocaleString(locale, { minimumFractionDigits: 2 })}</span>}
                  {rate.valid_from  && <span>Desde: {new Date(rate.valid_from).toLocaleDateString(locale)}</span>}
                  {rate.valid_until && <span>Hasta: {new Date(rate.valid_until).toLocaleDateString(locale)}</span>}
                  {rate.notes && <span style={{ fontStyle: "italic" }}>{rate.notes}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {tab === "documents" && (
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Documentos legales del proveedor</div>
              <button onClick={() => setShowUploadDoc(true)} style={{ height: "30px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Subir documento
              </button>
            </div>
            {showUploadDoc && (
              <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", display: "grid", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Tipo de documento</div>
                    <select value={docForm.doc_type} onChange={(e) => setDocForm((p) => ({ ...p, doc_type: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                      {DOC_TYPES.map((dt) => <option key={dt} value={dt}>{dt}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Fecha de vencimiento</div>
                    <input type="date" value={docForm.expiry_date} onChange={(e) => setDocForm((p) => ({ ...p, expiry_date: e.target.value }))} style={INPUT} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Archivo</div>
                  <div onClick={() => docFileRef.current?.click()} style={{ height: "40px", borderRadius: "var(--radius-md)", border: `2px dashed ${docFile ? "var(--color-brand-blue)" : "var(--color-border)"}`, background: docFile ? "var(--color-info-bg)" : "var(--color-bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px", color: docFile ? "var(--color-brand-blue)" : "var(--color-text-muted)" }}>
                    {docFile ? `✓ ${docFile.name}` : "Haz clic para seleccionar archivo"}
                  </div>
                  <input ref={docFileRef} type="file" style={{ display: "none" }} onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleUploadDoc} disabled={uploading || !docFile} style={{ height: "32px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    {uploading ? t.general.loading : "Subir"}
                  </button>
                  <button onClick={() => { setShowUploadDoc(false); setDocFile(null); }} style={{ height: "32px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
                    {t.general.cancel}
                  </button>
                </div>
              </div>
            )}
            {docs.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>Sin documentos cargados</div>
            ) : docs.map((doc) => {
              const expiryStatus = getDocExpiryStatus(doc);
              return (
                <div key={doc.id} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "flex", gap: "12px", alignItems: "center" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-info-text)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.doc_name}</div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", display: "flex", gap: "8px", marginTop: "2px" }}>
                      <span>{doc.doc_type}</span>
                      {doc.expiry_date && (
                        <span style={{ color: expiryStatus === "expired" ? "var(--color-danger-text)" : expiryStatus === "soon" ? "var(--color-warning-text)" : "var(--color-text-muted)", fontWeight: expiryStatus !== "ok" ? 700 : 400 }}>
                          {expiryStatus === "expired" ? "VENCIDO" : expiryStatus === "soon" ? "Por vencer" : ""}
                          {" "}{new Date(doc.expiry_date).toLocaleDateString(locale)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "10px", fontWeight: 600, display: "flex", alignItems: "center", textDecoration: "none" }}>Ver</a>
                    <button onClick={async () => { await deleteProviderDocument(doc.id); await onReload(); }} style={{ width: "26px", height: "26px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── CXP ── */}
        {tab === "cxp" && (
          <div style={{ display: "grid", gap: "10px" }}>
            {/* Totales */}
            {Object.keys(apTotalByCurrency).length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Object.keys(apTotalByCurrency).length}, 1fr)`, gap: "8px" }}>
                {Object.entries(apTotalByCurrency).map(([cur, total]) => (
                  <div key={cur} style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px", textTransform: "uppercase" }}>Total {cur}</div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
                      {cur} ${Number(total).toLocaleString(locale, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              Facturas registradas en Cuentas por Pagar — {apRecords.length} registros
            </div>

            {loadingAP ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "12px" }}>Cargando CXP…</div>
            ) : apRecords.length === 0 ? (
              <div style={{ padding: "28px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                Sin facturas registradas en CXP para este proveedor
              </div>
            ) : apRecords.map((ap) => (
              <div key={ap.id} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "grid", gap: "5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-text-primary)", fontFamily: "monospace" }}>
                      {ap.document_number ?? "—"}
                    </span>
                    <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: `${AP_STATUS_COLOR[ap.status] ?? "#94a3b8"}20`, border: `1px solid ${AP_STATUS_COLOR[ap.status] ?? "#94a3b8"}40`, color: AP_STATUS_COLOR[ap.status] ?? "#94a3b8", textTransform: "uppercase" }}>
                      {ap.status}
                    </span>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
                    {ap.currency} ${Number(ap.total).toLocaleString(locale, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", display: "flex", gap: "10px" }}>
                  <span>{new Date(ap.document_date).toLocaleDateString(locale)}</span>
                  {ap.balance > 0 && ap.balance !== ap.total && (
                    <span style={{ color: "var(--color-warning-text)", fontWeight: 600 }}>
                      Saldo: {ap.currency} ${Number(ap.balance).toLocaleString(locale, { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  {(ap.shipment as any)?.reference && (
                    <span style={{ color: "var(--color-brand-blue)", fontWeight: 600 }}>
                      {(ap.shipment as any).reference}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

                {/* ── SHIPMENTS ── */}
        {tab === "shipments" && (
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              Embarques vinculados a {provider.name} — {shipments.length} registros
            </div>
            {loadingShips ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "12px" }}>Cargando embarques…</div>
            ) : shipments.length === 0 ? (
              <div style={{ padding: "28px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                Sin embarques vinculados a este proveedor
              </div>
            ) : shipments.map((s: any) => {
              const statusColors: Record<string, string> = {
                draft: "#94a3b8", coordinating: "#3b82f6", pickup_scheduled: "#8b5cf6",
                in_transit: "#f59e0b", at_destination: "#06b6d4", delivered: "#10b981",
                invoiced: "#10b981", cancelled: "#ef4444",
              };
              const color = statusColors[s.status] ?? "#94a3b8";
              return (
                <div key={s.id} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "grid", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-brand-blue)", fontFamily: "monospace" }}>{s.reference}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 6px", borderRadius: "var(--radius-full)", background: `${color}20`, border: `1px solid ${color}40`, color, textTransform: "uppercase" }}>
                        {s.status}
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                        {s.currency} ${Number(s.total ?? 0).toLocaleString(locale, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "flex", gap: "10px" }}>
                    <span>{(s.client as any)?.name ?? "—"}</span>
                    <span style={{ textTransform: "capitalize" }}>{s.service_type?.replace(/_/g, " ")}</span>
                    <span>{new Date(s.created_at).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
