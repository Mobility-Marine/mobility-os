"use client";
import { useState } from "react";
import type {
  Supplier, SupplierEvaluation, SupplierContract, SupplierContractItem,
} from "../types/supplier.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { calcAvgScore, scoreColor, renderStars } from "../services/supplier.service";

type Tab = "info" | "evals" | "contracts" | "orders";

type Props = {
  supplier:              Supplier | null;
  evaluations:           SupplierEvaluation[];
  contracts:             SupplierContract[];
  saving:                boolean;
  onUpdate:              (id: string, updates: Partial<Supplier>) => Promise<void>;
  onCreateEvaluation:    (payload: Partial<SupplierEvaluation>) => Promise<void>;
  onDeleteEvaluation:    (id: string) => Promise<void>;
  onCreateContract:      (payload: Partial<SupplierContract>) => Promise<SupplierContract | undefined>;
  onUpdateContract:      (id: string, updates: Partial<SupplierContract>) => Promise<void>;
  onUpsertContractItem:  (contractId: string, item: any) => Promise<void>;
  onDeleteContractItem:  (id: string) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", paddingBottom: "6px", borderBottom: "1px solid var(--color-border-faint)", marginBottom: "10px", gridColumn: "1 / -1" }}>
      {children}
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1,2,3,4,5].map((n) => (
        <button key={n} onClick={() => onChange?.(n)} style={{ background: "none", border: "none", cursor: onChange ? "pointer" : "default", fontSize: "18px", color: n <= value ? "#f59e0b" : "var(--color-border)", padding: "0", lineHeight: 1 }}>
          ★
        </button>
      ))}
    </div>
  );
}

export default function SupplierWorkspace({
  supplier, evaluations, contracts, saving,
  onUpdate, onCreateEvaluation, onDeleteEvaluation,
  onCreateContract, onUpdateContract, onUpsertContractItem, onDeleteContractItem,
}: Props) {
  const { t, lang } = useTranslation();
  const tp          = (t.procurement as any) ?? {};
  const locale      = lang === "en" ? "en-US" : "es-MX";

  const [tab,       setTab]      = useState<Tab>("info");
  const [editing,   setEditing]  = useState(false);
  const [form,      setForm]     = useState<Partial<Supplier>>({});

  // Eval form
  const [addingEval,   setAddingEval]   = useState(false);
  const [evalMonth,    setEvalMonth]    = useState(() => new Date().toISOString().slice(0,7));
  const [evalDelivery, setEvalDelivery] = useState(3);
  const [evalQuality,  setEvalQuality]  = useState(3);
  const [evalPrice,    setEvalPrice]    = useState(3);
  const [evalService,  setEvalService]  = useState(3);
  const [evalNotes,    setEvalNotes]    = useState("");

  // Contract form
  const [addingContract,  setAddingContract]  = useState(false);
  const [contractName,    setContractName]    = useState("");
  const [contractStart,   setContractStart]   = useState("");
  const [contractEnd,     setContractEnd]     = useState("");
  const [contractCurrency,setContractCurrency]= useState("MXN");

  // Contract item form
  const [addingItem,    setAddingItem]    = useState<string | null>(null);
  const [itemDesc,      setItemDesc]      = useState("");
  const [itemUnit,      setItemUnit]      = useState("pza");
  const [itemPrice,     setItemPrice]     = useState("");
  const [itemCurrency,  setItemCurrency]  = useState("MXN");

  if (!supplier) return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", height: "100%" }}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>{tp.supplierWorkspaceEmpty ?? "Selecciona un proveedor"}</div>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }}>{tp.supplierWorkspaceEmptyDesc ?? "Aquí verás la información del proveedor."}</div>
    </div>
  );

  const avgScore     = calcAvgScore(evaluations);
  const activeContracts = contracts.filter((c) => c.status === "active");

  function set(k: keyof Supplier, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSaveSupplier() {
    await onUpdate(supplier.id, form);
    setEditing(false);
    setForm({});
  }

  async function handleSaveEval() {
    await onCreateEvaluation({
      evaluated_month: evalMonth + "-01",
      score_delivery:  evalDelivery,
      score_quality:   evalQuality,
      score_price:     evalPrice,
      score_service:   evalService,
      notes:           evalNotes || undefined,
    });
    setAddingEval(false);
    setEvalMonth(new Date().toISOString().slice(0,7));
    setEvalDelivery(3); setEvalQuality(3); setEvalPrice(3); setEvalService(3);
    setEvalNotes("");
  }

  async function handleSaveContract() {
    if (!contractName.trim() || !contractStart) return;
    await onCreateContract({
      name:       contractName.trim(),
      start_date: contractStart,
      end_date:   contractEnd || undefined,
      currency:   contractCurrency,
      status:     "active",
    });
    setAddingContract(false);
    setContractName(""); setContractStart(""); setContractEnd(""); setContractCurrency("MXN");
  }

  async function handleSaveItem(contractId: string) {
    if (!itemDesc.trim()) return;
    await onUpsertContractItem(contractId, {
      description:  itemDesc.trim(),
      unit:         itemUnit,
      agreed_price: parseFloat(itemPrice) || 0,
      currency:     itemCurrency,
    });
    setAddingItem(null);
    setItemDesc(""); setItemUnit("pza"); setItemPrice(""); setItemCurrency("MXN");
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "info",      label: tp.tabSupplierInfo      ?? "Información"   },
    { key: "evals",     label: `${tp.tabSupplierEvals  ?? "Evaluaciones"} (${evaluations.length})`  },
    { key: "contracts", label: `${tp.tabSupplierContracts ?? "Contratos"} (${contracts.length})`    },
    { key: "orders",    label: tp.tabSupplierOrders     ?? "OC"            },
  ];

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>

      {/* HEADER */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-text-primary)" }}>{supplier.name}</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: supplier.is_active ? "var(--color-success-bg)" : "var(--color-bg-subtle)", border: `1px solid ${supplier.is_active ? "var(--color-success-border)" : "var(--color-border-faint)"}`, color: supplier.is_active ? "var(--color-success-text)" : "var(--color-text-muted)" }}>
                {supplier.is_active ? (tp.supplierActive ?? "Activo") : (tp.supplierInactive ?? "Inactivo")}
              </span>
              {avgScore != null && (
                <span style={{ fontSize: "11px", fontWeight: 700, color: scoreColor(avgScore) }}>★ {avgScore}/5</span>
              )}
              {activeContracts.length > 0 && (
                <span style={{ fontSize: "10px", fontWeight: 600, color: "#7c3aed", background: "#f3e8ff", border: "1px solid #d8b4fe", padding: "2px 7px", borderRadius: "var(--radius-full)" }}>
                  {activeContracts.length} {tp.contracts ?? "contratos"}
                </span>
              )}
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "3px" }}>
              {(supplier as any).tax_id && `RFC: ${(supplier as any).tax_id}`}
              {(supplier as any).tax_id && supplier.city && " · "}
              {supplier.city}
              {supplier.payment_terms && ` · ${supplier.payment_terms}`}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {!editing ? (
            <button onClick={() => { setForm({ ...supplier }); setEditing(true); }} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              {t.general.edit}
            </button>
          ) : (
            <>
              <button onClick={handleSaveSupplier} disabled={saving} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                {saving ? t.general.loading : `✓ ${t.general.save}`}
              </button>
              <button onClick={() => { setEditing(false); setForm({}); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                {t.general.cancel}
              </button>
            </>
          )}
          <button onClick={() => { setTab("evals"); setAddingEval(true); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", color: "var(--color-warning-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
            {tp.evaluateSupplier ?? "Evaluar"}
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{ height: "36px", padding: "0 14px", border: "none", background: "transparent", borderBottom: tab === tb.key ? "2px solid var(--color-brand-blue)" : "2px solid transparent", color: tab === tb.key ? "var(--color-brand-blue)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: tab === tb.key ? 700 : 400, cursor: "pointer" }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>

        {/* ── INFO ── */}
        {tab === "info" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <SectionTitle>Datos generales</SectionTitle>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field label={tp.supplierName ?? "Nombre"}>
                {editing ? <input value={(form as any).name ?? ""} onChange={(e) => set("name", e.target.value)} style={INPUT} />
                  : <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{supplier.name}</div>}
              </Field>
            </div>

            {([
              // DESPUÉS
              { k: "contact",       label: tp.supplierContact ?? "Contacto principal" },
              { k: "tax_id",        label: lang === "en" ? "Tax ID" : "RFC / Tax ID" },
              { k: "email",         label: tp.supplierEmail  ?? "Email"      },
              { k: "phone",         label: tp.supplierPhone  ?? "Teléfono"   },
              { k: "website",       label: tp.supplierWebsite ?? "Sitio web" },
              { k: "city",          label: tp.supplierCity   ?? "Ciudad"     },
              { k: "country",       label: tp.supplierCountry ?? "País"      },
              { k: "payment_terms", label: tp.supplierPaymentTerms ?? "Condiciones de pago" },
            ] as any[]).map((f) => (
              <Field key={f.k} label={f.label}>
                {editing
                  ? <input value={(form as any)[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)} style={INPUT} />
                  : <div style={{ fontSize: "12px", color: "var(--color-text-primary)", minHeight: "20px" }}>{(supplier as any)[f.k] ?? <span style={{ color: "var(--color-text-muted)" }}>—</span>}</div>
                }
              </Field>
            ))}

            <SectionTitle>Datos bancarios</SectionTitle>
            <div style={{ gridColumn: "1 / -1", padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "12px", color: "var(--color-warning-text)" }}>
              Los datos bancarios (cuenta y CLABE) se gestionan en el módulo de <strong>Finanzas → CxP</strong> para mayor seguridad.
            </div>

            <SectionTitle>Notas</SectionTitle>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label={tp.supplierNotes ?? "Notas"}>
                {editing
                  ? <textarea rows={3} value={(form as any).notes ?? ""} onChange={(e) => set("notes", e.target.value)} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical", lineHeight: 1.5 }} />
                  : <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "12px", color: supplier.notes ? "var(--color-text-primary)" : "var(--color-text-muted)", lineHeight: 1.6, minHeight: "50px" }}>
                      {supplier.notes ?? "Sin notas."}
                    </div>
                }
              </Field>
            </div>
          </div>
        )}

        {/* ── EVALUACIONES ── */}
        {tab === "evals" && (
          <div style={{ display: "grid", gap: "14px" }}>
            {/* Resumen */}
            {evaluations.length > 0 && avgScore != null && (
              <div style={{ padding: "14px 18px", borderRadius: "var(--radius-lg)", background: avgScore >= 4 ? "var(--color-success-bg)" : avgScore >= 3 ? "#fef3c7" : "var(--color-danger-bg)", border: `1px solid ${avgScore >= 4 ? "var(--color-success-border)" : avgScore >= 3 ? "#fcd34d" : "var(--color-danger-border)"}`, display: "flex", alignItems: "center", gap: "16px" }}>
                <div>
                  <div style={{ fontSize: "32px", fontWeight: 900, color: scoreColor(avgScore), lineHeight: 1 }}>{avgScore}</div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>/5 promedio</div>
                </div>
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                  {[
                    { label: tp.evalDelivery ?? "Entrega",  key: "score_delivery" },
                    { label: tp.evalQuality  ?? "Calidad",  key: "score_quality"  },
                    { label: tp.evalPrice    ?? "Precio",   key: "score_price"    },
                    { label: tp.evalService  ?? "Servicio", key: "score_service"  },
                  ].map((f) => {
                    const avg = evaluations.length ? Math.round(evaluations.reduce((s, e) => s + (e as any)[f.key], 0) / evaluations.length * 10) / 10 : 0;
                    return (
                      <div key={f.key} style={{ fontSize: "11px" }}>
                        <span style={{ color: "var(--color-text-muted)" }}>{f.label}: </span>
                        <span style={{ fontWeight: 700, color: scoreColor(avg) }}>{avg}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Botón agregar */}
            {!addingEval ? (
              <button onClick={() => setAddingEval(true)} style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", color: "var(--color-warning-text)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                + {tp.evaluateSupplier ?? "Nueva evaluación"}
              </button>
            ) : (
              <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", display: "grid", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tp.evalMonth ?? "Mes evaluado"}</div>
                  <input type="month" value={evalMonth} onChange={(e) => setEvalMonth(e.target.value)} style={INPUT} />
                </div>
                {[
                  { label: tp.evalDelivery ?? "Puntualidad de entrega", val: evalDelivery, set: setEvalDelivery },
                  { label: tp.evalQuality  ?? "Calidad del producto",   val: evalQuality,  set: setEvalQuality  },
                  { label: tp.evalPrice    ?? "Precio competitivo",     val: evalPrice,    set: setEvalPrice    },
                  { label: tp.evalService  ?? "Servicio y comunicación",val: evalService,  set: setEvalService  },
                ].map((f) => (
                  <div key={f.label}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{f.label}</div>
                    <StarRating value={f.val} onChange={f.set} />
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tp.evalNotes ?? "Observaciones"}</div>
                  <textarea rows={2} value={evalNotes} onChange={(e) => setEvalNotes(e.target.value)} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical", lineHeight: 1.5 }} />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleSaveEval} disabled={saving} style={{ height: "30px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    {saving ? t.general.loading : t.general.save}
                  </button>
                  <button onClick={() => setAddingEval(false)} style={{ height: "30px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
                    {t.general.cancel}
                  </button>
                </div>
              </div>
            )}

            {/* Lista de evaluaciones */}
            {evaluations.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                {tp.supplierEvalHistory ?? "Sin evaluaciones registradas"}
              </div>
            ) : evaluations.map((ev) => {
              const total = ev.score_total ?? ((ev.score_delivery + ev.score_quality + ev.score_price + ev.score_service) / 4);
              return (
                <div key={ev.id} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "grid", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)" }}>
                      {new Date(ev.evaluated_month).toLocaleDateString(locale, { month: "long", year: "numeric" })}
                    </span>
                    <span style={{ fontSize: "16px", fontWeight: 900, color: scoreColor(total), marginLeft: "auto" }}>{Math.round(total * 10) / 10}/5</span>
                    <button onClick={() => onDeleteEvaluation(ev.id)} style={{ width: "20px", height: "20px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px" }}>
                    {[
                      { label: "Entrega", val: ev.score_delivery },
                      { label: "Calidad", val: ev.score_quality  },
                      { label: "Precio",  val: ev.score_price    },
                      { label: "Servicio",val: ev.score_service  },
                    ].map((f) => (
                      <div key={f.label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "9px", color: "var(--color-text-muted)", marginBottom: "2px" }}>{f.label}</div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: scoreColor(f.val) }}>{f.val}</div>
                      </div>
                    ))}
                  </div>
                  {ev.notes && <div style={{ fontSize: "11px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>{ev.notes}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── CONTRATOS ── */}
        {tab === "contracts" && (
          <div style={{ display: "grid", gap: "12px" }}>
            {!addingContract ? (
              <button onClick={() => setAddingContract(true)} style={{ height: "32px", borderRadius: "var(--radius-md)", background: "#f3e8ff", border: "1px solid #d8b4fe", color: "#7c3aed", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                + {tp.newContract ?? "Nuevo contrato marco"}
              </button>
            ) : (
              <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tp.contractName ?? "Nombre"} *</div>
                  <input value={contractName} onChange={(e) => setContractName(e.target.value)} style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tp.contractStart ?? "Inicio"} *</div>
                  <input type="date" value={contractStart} onChange={(e) => setContractStart(e.target.value)} style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tp.contractEnd ?? "Fin"}</div>
                  <input type="date" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Moneda</div>
                  <select value={contractCurrency} onChange={(e) => setContractCurrency(e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                    {["MXN","USD","EUR"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px" }}>
                  <button onClick={handleSaveContract} disabled={saving || !contractName.trim() || !contractStart} style={{ height: "30px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    {saving ? t.general.loading : t.general.save}
                  </button>
                  <button onClick={() => setAddingContract(false)} style={{ height: "30px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
                    {t.general.cancel}
                  </button>
                </div>
              </div>
            )}

            {contracts.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                Sin contratos marco registrados
              </div>
            ) : contracts.map((c) => {
              const isExpired   = c.end_date && new Date(c.end_date) < new Date();
              const statusColor = c.status === "active" && !isExpired ? "var(--color-success-text)" : c.status === "cancelled" ? "var(--color-danger-text)" : "var(--color-text-muted)";

              return (
                <div key={c.id} style={{ borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", overflow: "hidden" }}>
                  {/* Header contrato */}
                  <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", flex: 1 }}>{c.name}</span>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: statusColor }}>{isExpired ? tp.contractExpired ?? "Vencido" : c.status === "active" ? tp.contractActive ?? "Activo" : tp.contractCancelled ?? "Cancelado"}</span>
                    <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{c.currency}</span>
                  </div>
                  <div style={{ padding: "4px 14px 10px", fontSize: "11px", color: "var(--color-text-muted)" }}>
                    {new Date(c.start_date).toLocaleDateString(locale)} {c.end_date ? `→ ${new Date(c.end_date).toLocaleDateString(locale)}` : "→ Sin fecha fin"}
                  </div>

                  {/* Items del contrato */}
                  {(c.items ?? []).length > 0 && (
                    <div style={{ borderTop: "1px solid var(--color-border-faint)" }}>
                      {(c.items ?? []).map((item) => (
                        <div key={item.id} style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--color-border-faint)" }}>
                          <span style={{ fontSize: "11px", flex: 1, color: "var(--color-text-primary)" }}>{item.description}</span>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-success-text)" }}>
                            {new Intl.NumberFormat(locale, { style: "currency", currency: item.currency }).format(item.agreed_price)}
                          </span>
                          <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>/{item.unit}</span>
                          <button onClick={() => onDeleteContractItem(item.id)} style={{ width: "18px", height: "18px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Agregar ítem al contrato */}
                  {addingItem === c.id ? (
                    <div style={{ padding: "10px 14px", borderTop: "1px solid var(--color-border-faint)", display: "grid", gridTemplateColumns: "1fr 80px 100px 80px", gap: "8px", alignItems: "end" }}>
                      <div>
                        <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Descripción *</div>
                        <input value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} style={{ ...INPUT, height: "30px", fontSize: "11px" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Unidad</div>
                        <input value={itemUnit} onChange={(e) => setItemUnit(e.target.value)} style={{ ...INPUT, height: "30px", fontSize: "11px" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Precio pactado</div>
                        <input type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} style={{ ...INPUT, height: "30px", fontSize: "11px" }} />
                      </div>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button onClick={() => handleSaveItem(c.id)} style={{ flex: 1, height: "30px", borderRadius: "var(--radius-sm)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>✓</button>
                        <button onClick={() => setAddingItem(null)} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setAddingItem(c.id)} style={{ width: "100%", padding: "8px", background: "transparent", border: "none", borderTop: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      {tp.addContractItem ?? "Agregar precio pactado"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── ÓRDENES (placeholder) ── */}
        {tab === "orders" && (
          <div style={{ padding: "28px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
            Las órdenes de compra vinculadas a este proveedor aparecerán aquí una vez que construyamos el módulo de OC.
          </div>
        )}
      </div>
    </div>
  );
}
