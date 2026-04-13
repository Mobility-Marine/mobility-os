"use client";
import { useState } from "react";
import type { ForeignTradeOperation, ForeignTradeItem, TradeRegime, TradeStatus } from "../types/foreign-trade.types";
import { TRADE_STATUS_CONFIG, REGIME_LABELS, ADUANAS_MX } from "../types/foreign-trade.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant }      from "@/lib/tenant/TenantProvider";
import { updateTradeStatus, upsertFTItem, deleteFTItem, fmtCurrency } from "../services/foreign-trade.service";

type Tab = "pedimento" | "mercancia" | "impuestos";

type Props = {
  op:        ForeignTradeOperation | null;
  onUpdate:  (id: string, updates: Partial<ForeignTradeOperation>) => Promise<void>;
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

export default function FTWorkspace({ op, onUpdate, onDelete, onReload, saving }: Props) {
  const { t, lang }   = useTranslation();
  const { companyId } = useTenant();
  const tl            = (t.logistics as any) ?? {};
  const locale        = lang === "en" ? "en-US" : "es-MX";

  const [tab,        setTab]        = useState<Tab>("pedimento");
  const [editing,    setEditing]    = useState(false);
  const [form,       setForm]       = useState<Partial<ForeignTradeOperation>>({});
  const [confirmDel, setConfirmDel] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [itemForm,   setItemForm]   = useState<Partial<ForeignTradeItem>>({ quantity: 1, unit: "KGM", unit_value: 0, total_value: 0, currency: "USD", weight_kg: 0, country_origin: "US" });

  if (!op) return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", height: "100%" }}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
        <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v2"/><path d="m7 12.98 5 2.89 5-2.89"/><path d="M22 10l-5 2.9M2 10l5 2.9M12 22V12"/><path d="m22 10-10 5.78L2 10"/>
      </svg>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>{tl.ftWorkspaceEmpty ?? "Selecciona una operación"}</div>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }}>{tl.ftWorkspaceEmptyDesc ?? "Aquí verás el detalle de la operación."}</div>
    </div>
  );

  const stCfg   = TRADE_STATUS_CONFIG[op.status];
  const items   = op.items ?? [];
  const stLabel = tl[`status${op.status.charAt(0).toUpperCase()}${op.status.slice(1).replace(/_([a-z])/g, (_: string, l: string) => l.toUpperCase())}`] ?? op.status;

  function set(k: keyof ForeignTradeOperation, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  const NEXT_STATUS: Partial<Record<TradeStatus, { next: TradeStatus; labelKey: string }>> = {
    open:       { next: "in_process", labelKey: "logistics.statusInProcess"   },
    in_process: { next: "at_customs", labelKey: "logistics.advanceToCustoms"  },
    at_customs: { next: "released",   labelKey: "logistics.markReleased"      },
    released:   { next: "closed",     labelKey: "logistics.closeOperation"    },
  };

  const nextAction = NEXT_STATUS[op.status];
  const totalInvoice = items.reduce((s, i) => s + i.total_value, 0);

  async function handleSaveItem() {
    if (!companyId || !itemForm.description?.trim()) return;
    setSavingItem(true);
    try {
      const total_value = (itemForm.quantity ?? 1) * (itemForm.unit_value ?? 0);
      await upsertFTItem(companyId, op.id, { ...itemForm, total_value } as any);
      await onReload();
      setAddingItem(false);
      setItemForm({ quantity: 1, unit: "KGM", unit_value: 0, total_value: 0, currency: "USD", weight_kg: 0, country_origin: "US" });
    } finally { setSavingItem(false); }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "pedimento", label: tl.tabPedimento  ?? "Pedimento / DODA"  },
    { key: "mercancia", label: `${tl.tabMercancia ?? "Mercancías"} (${items.length})`  },
    { key: "impuestos", label: tl.tabImpuestos  ?? "Contribuciones"    },
  ];

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>

      {/* HEADER */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 8px", borderRadius: "var(--radius-full)", background: op.operation_type === "import" ? "#dbeafe" : "#ede9fe", color: op.operation_type === "import" ? "#2563eb" : "#7c3aed", border: `1px solid ${op.operation_type === "import" ? "#93c5fd" : "#c4b5fd"}` }}>
                {op.operation_type === "import" ? (tl.opTypeImport ?? "IMPORTACIÓN") : (tl.opTypeExport ?? "EXPORTACIÓN")}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-text-primary)", fontFamily: "monospace" }}>
                {op.pedimento_number ?? op.invoice_number ?? op.id.slice(0,8).toUpperCase()}
              </span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: stCfg.bg, border: `1px solid ${stCfg.border}`, color: stCfg.color }}>{stLabel}</span>
              {op.alert_inspection && <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)" }}>Recono.</span>}
              {op.alert_embargo    && <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)" }}>Embargo</span>}
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "3px" }}>
              {op.shipment?.client?.name ?? op.client?.name ?? "—"}
              {op.aduana && ` · Aduana ${op.aduana}`}
              {op.customs_broker?.provider_name && ` · ${op.customs_broker.provider_name}`}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {!editing ? (
            <button onClick={() => { setForm({ ...op }); setEditing(true); }} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              {t.general.edit}
            </button>
          ) : (
            <>
              <button onClick={async () => { await onUpdate(op.id, form); setEditing(false); setForm({}); }} disabled={saving} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                {saving ? t.general.loading : `✓ ${t.general.save}`}
              </button>
              <button onClick={() => { setEditing(false); setForm({}); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                {t.general.cancel}
              </button>
            </>
          )}

          {nextAction && (
            <button onClick={async () => { await updateTradeStatus(companyId!, op.id, nextAction.next); await onReload(); }} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", color: "var(--color-brand-blue)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
              {tl[nextAction.labelKey.replace("logistics.", "")] ?? nextAction.next} →
            </button>
          )}

          {op.status === "at_customs" && (
            <button onClick={async () => { await onUpdate(op.id, { alert_inspection: !op.alert_inspection }); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: op.alert_inspection ? "var(--color-danger-bg)" : "var(--color-bg-subtle)", border: `1px solid ${op.alert_inspection ? "var(--color-danger-border)" : "var(--color-border)"}`, color: op.alert_inspection ? "var(--color-danger-text)" : "var(--color-text-muted)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
              {tl.alertInspection ?? "Recono."}
            </button>
          )}

          <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
            {!confirmDel ? (
              <button onClick={() => setConfirmDel(true)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "11px", cursor: "pointer" }}>
                {t.general.delete}
              </button>
            ) : (
              <>
                <button onClick={() => onDelete(op.id)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>¿Eliminar?</button>
                <button onClick={() => setConfirmDel(false)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>{(t.general as any).no ?? "No"}</button>
              </>
            )}
          </div>
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

        {/* ── PEDIMENTO / DODA ── */}
        {tab === "pedimento" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <SectionTitle>Pedimento aduanal</SectionTitle>
            {([
              { k: "pedimento_number", label: tl.pedimentoNumber ?? "No. Pedimento", type: "text" },
              { k: "pedimento_date",   label: tl.pedimentoDate   ?? "Fecha",          type: "date" },
              { k: "pedimento_type",   label: tl.pedimentoType   ?? "Tipo",           type: "text" },
              { k: "pedimento_key",    label: tl.pedimentoKey    ?? "Clave",          type: "text" },
              { k: "patente",          label: tl.patente         ?? "Patente",        type: "text" },
            ] as any[]).map((f) => (
              <Field key={f.k} label={f.label}>
                {editing ? (
                  <input type={f.type} value={(form as any)[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)} style={INPUT} />
                ) : (
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", fontFamily: f.type === "text" ? "monospace" : undefined, minHeight: "20px" }}>
                    {(op as any)[f.k] ?? <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                  </div>
                )}
              </Field>
            ))}

            {/* Aduana dropdown */}
            <Field label={tl.aduana ?? "Aduana"}>
              {editing ? (
                <select value={(form as any).aduana ?? ""} onChange={(e) => set("aduana", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                  <option value="">— Seleccionar —</option>
                  {ADUANAS_MX.map((a) => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
                </select>
              ) : (
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", minHeight: "20px" }}>
                  {op.aduana ? `${op.aduana} — ${ADUANAS_MX.find(a => a.code === op.aduana)?.name ?? op.aduana}` : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                </div>
              )}
            </Field>

            <SectionTitle>DODA</SectionTitle>
            {([
              { k: "doda_number", label: tl.dodaNumber ?? "No. DODA", type: "text" },
              { k: "doda_date",   label: tl.dodaDate   ?? "Fecha DODA", type: "date" },
            ] as any[]).map((f) => (
              <Field key={f.k} label={f.label}>
                {editing ? (
                  <input type={f.type} value={(form as any)[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)} style={INPUT} />
                ) : (
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", fontFamily: f.type === "text" ? "monospace" : undefined, minHeight: "20px" }}>
                    {(op as any)[f.k] ?? <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                  </div>
                )}
              </Field>
            ))}

            <SectionTitle>Factura comercial</SectionTitle>
            {([
              { k: "invoice_number",   label: tl.invoiceNumber  ?? "No. Factura",  type: "text"   },
              { k: "invoice_value",    label: tl.invoiceValue   ?? "Valor",         type: "number" },
              { k: "invoice_currency", label: "Moneda",                             type: "select", opts: ["USD","MXN","EUR"] },
              { k: "opIncoterm",       realK: "incoterm", label: tl.opIncoterm ?? "Incoterm", type: "text" },
              { k: "country_origin",      label: tl.countryOrigin      ?? "País origen",  type: "text" },
              { k: "country_destination", label: tl.countryDestination ?? "País destino", type: "text" },
            ] as any[]).map((f) => (
              <Field key={f.k} label={f.label}>
                {editing ? (
                  f.type === "select" ? (
                    <select value={(form as any)[f.k] ?? ""} onChange={(e) => set(f.k as any, e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                      {f.opts.map((o: string) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type} value={(form as any)[f.realK ?? f.k] ?? ""} onChange={(e) => set((f.realK ?? f.k) as any, e.target.value)} style={INPUT} />
                  )
                ) : (
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", fontFamily: "monospace", minHeight: "20px" }}>
                    {(op as any)[f.realK ?? f.k] ?? <span style={{ color: "var(--color-text-muted)", fontFamily: "inherit" }}>—</span>}
                  </div>
                )}
              </Field>
            ))}

            {/* Alertas */}
            <SectionTitle>Alertas aduanales</SectionTitle>
            <Field label={tl.alertInspection ?? "Reconocimiento aduanero"}>
              {editing ? (
                <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", fontSize: "12px", color: "var(--color-text-primary)" }}>
                  <input type="checkbox" checked={!!form.alert_inspection} onChange={(e) => set("alert_inspection", e.target.checked)} />
                  {form.alert_inspection ? "Sí — con reconocimiento" : "Sin alerta"}
                </label>
              ) : (
                <div style={{ fontSize: "12px", fontWeight: op.alert_inspection ? 700 : 400, color: op.alert_inspection ? "var(--color-danger-text)" : "var(--color-text-muted)" }}>
                  {op.alert_inspection ? "Con reconocimiento aduanero" : "Sin alerta"}
                </div>
              )}
            </Field>
            <Field label={tl.alertEmbargo ?? "Embargo"}>
              {editing ? (
                <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", fontSize: "12px", color: "var(--color-text-primary)" }}>
                  <input type="checkbox" checked={!!form.alert_embargo} onChange={(e) => set("alert_embargo", e.target.checked)} />
                  {form.alert_embargo ? "Sí — embargado" : "Sin embargo"}
                </label>
              ) : (
                <div style={{ fontSize: "12px", fontWeight: op.alert_embargo ? 700 : 400, color: op.alert_embargo ? "var(--color-danger-text)" : "var(--color-text-muted)" }}>
                  {op.alert_embargo ? "Con embargo activo" : "Sin embargo"}
                </div>
              )}
            </Field>

            {/* Fechas */}
            <Field label={tl.entryDate   ?? "Fecha entrada"}>
              {editing ? (
                <input type="date" value={(form as any).entry_date ?? ""} onChange={(e) => set("entry_date", e.target.value)} style={INPUT} />
              ) : (
                <div style={{ fontSize: "12px", color: "var(--color-text-primary)", minHeight: "20px" }}>{op.entry_date ? new Date(op.entry_date).toLocaleDateString(locale) : <span style={{ color: "var(--color-text-muted)" }}>—</span>}</div>
              )}
            </Field>
            <Field label={tl.releaseDate ?? "Fecha liberación"}>
              {editing ? (
                <input type="date" value={(form as any).release_date ?? ""} onChange={(e) => set("release_date", e.target.value)} style={INPUT} />
              ) : (
                <div style={{ fontSize: "12px", color: "var(--color-text-primary)", minHeight: "20px" }}>{op.release_date ? new Date(op.release_date).toLocaleDateString(locale) : <span style={{ color: "var(--color-text-muted)" }}>—</span>}</div>
              )}
            </Field>

            {/* Notas */}
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Notas internas">
                {editing ? (
                  <textarea rows={3} value={(form as any).notes ?? ""} onChange={(e) => set("notes", e.target.value)} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical", lineHeight: 1.5 }} />
                ) : (
                  <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "12px", color: op.notes ? "var(--color-text-primary)" : "var(--color-text-muted)", lineHeight: 1.6, minHeight: "50px" }}>
                    {op.notes ?? "Sin notas."}
                  </div>
                )}
              </Field>
            </div>
          </div>
        )}

        {/* ── MERCANCÍAS ── */}
        {tab === "mercancia" && (
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                {items.length} {tl.tabMercancia ?? "Mercancías"} · Valor total: <strong>{fmtCurrency(totalInvoice, op.invoice_currency)}</strong>
              </div>
              {!addingItem && (
                <button onClick={() => setAddingItem(true)} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  {tl.addFTItem ?? "Agregar"}
                </button>
              )}
            </div>

            {addingItem && (
              <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.opDescription ?? "Descripción"} *</div>
                  <input value={itemForm.description ?? ""} onChange={(e) => setItemForm(p => ({ ...p, description: e.target.value }))} placeholder="Descripción de la mercancía…" style={INPUT} />
                </div>
                {[
                  { k: "tariff_code",    label: tl.tariffCode2        ?? "Fracción arancelaria" },
                  { k: "nico",           label: tl.nico               ?? "NICO"                  },
                  { k: "country_origin", label: tl.countryOrigin      ?? "País origen"           },
                  { k: "brand",          label: tl.itemBrand          ?? "Marca"                 },
                  { k: "model",          label: tl.itemModel          ?? "Modelo"                },
                  { k: "serial_number",  label: tl.itemSerial         ?? "No. Serie"             },
                ].map((f) => (
                  <div key={f.k}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{f.label}</div>
                    <input value={(itemForm as any)[f.k] ?? ""} onChange={(e) => setItemForm(p => ({ ...p, [f.k]: e.target.value }))} style={INPUT} />
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Cantidad</div>
                  <input type="number" min="0" step="0.001" value={itemForm.quantity ?? 1} onChange={(e) => setItemForm(p => ({ ...p, quantity: parseFloat(e.target.value)||1, total_value: (parseFloat(e.target.value)||1)*(p.unit_value??0) }))} style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Unidad SAT</div>
                  <input value={itemForm.unit ?? "KGM"} onChange={(e) => setItemForm(p => ({ ...p, unit: e.target.value }))} placeholder="KGM, H87, XBX…" style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.unitValue ?? "Valor unitario"}</div>
                  <input type="number" min="0" step="0.01" value={itemForm.unit_value ?? 0} onChange={(e) => setItemForm(p => ({ ...p, unit_value: parseFloat(e.target.value)||0, total_value: (p.quantity??1)*(parseFloat(e.target.value)||0) }))} style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Peso (kg)</div>
                  <input type="number" min="0" step="0.001" value={itemForm.weight_kg ?? 0} onChange={(e) => setItemForm(p => ({ ...p, weight_kg: parseFloat(e.target.value)||0 }))} style={INPUT} />
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px" }}>
                  <button onClick={handleSaveItem} disabled={savingItem || !itemForm.description?.trim()} style={{ height: "32px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    {savingItem ? t.general.loading : t.general.save}
                  </button>
                  <button onClick={() => { setAddingItem(false); setItemForm({ quantity: 1, unit: "KGM", unit_value: 0, total_value: 0, currency: "USD", weight_kg: 0, country_origin: "US" }); }} style={{ height: "32px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
                    {t.general.cancel}
                  </button>
                </div>
              </div>
            )}

            {items.length === 0 && !addingItem ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>{tl.noFTItems ?? "Sin mercancías"}</div>
            ) : items.map((item) => (
              <div key={item.id} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "grid", gap: "4px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", flex: 1 }}>{item.description}</span>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-success-text)" }}>{fmtCurrency(item.total_value, item.currency)}</span>
                  <button onClick={() => deleteFTItem(companyId!, item.id).then(onReload)} style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div style={{ display: "flex", gap: "10px", fontSize: "10px", color: "var(--color-text-muted)", flexWrap: "wrap" }}>
                  {item.tariff_code    && <span>Fracción: {item.tariff_code}</span>}
                  {item.nico           && <span>NICO: {item.nico}</span>}
                  <span>{item.quantity} {item.unit}</span>
                  {item.weight_kg > 0  && <span>{item.weight_kg} kg</span>}
                  <span>Origen: {item.country_origin}</span>
                  {item.brand && <span>{item.brand}{item.model ? ` ${item.model}` : ""}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CONTRIBUCIONES ── */}
        {tab === "impuestos" && (
          <div style={{ display: "grid", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {([
                { k: "igi",           label: tl.igi            ?? "IGI (Arancel)"      },
                { k: "iva",           label: tl.ivaImport      ?? "IVA importación"    },
                { k: "dta",           label: tl.dta            ?? "DTA"                },
                { k: "prevalidacion", label: tl.prevalidacion  ?? "Prevalidación"      },
                { k: "otros_impuestos",label: tl.otrosImpuestos ?? "Otros impuestos"   },
              ] as any[]).map((f) => (
                <Field key={f.k} label={f.label}>
                  {editing ? (
                    <input type="number" min="0" step="0.01" value={(form as any)[f.k] ?? 0} onChange={(e) => set(f.k as any, parseFloat(e.target.value) || 0)} style={INPUT} />
                  ) : (
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                      {fmtCurrency((op as any)[f.k] ?? 0, op.invoice_currency)}
                    </div>
                  )}
                </Field>
              ))}
            </div>

            {/* Total contribuciones */}
            <div style={{ padding: "16px 20px", borderRadius: "var(--radius-lg)", background: "var(--color-bg-subtle)", border: "2px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tl.totalTaxes ?? "Total contribuciones"}</div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>IGI + IVA + DTA + Prevalidación + Otros</div>
              </div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "var(--color-brand-blue)" }}>
                {fmtCurrency((op.total_taxes ?? (op.igi + op.iva + op.dta + op.prevalidacion + op.otros_impuestos)), op.invoice_currency)}
              </div>
            </div>

            {/* Valor factura vs impuestos */}
            {op.invoice_value && op.invoice_value > 0 && (
              <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "grid", gap: "4px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-brand-blue)", textTransform: "uppercase" }}>Análisis fiscal</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Valor factura comercial</span>
                  <span style={{ fontWeight: 700 }}>{fmtCurrency(op.invoice_value, op.invoice_currency)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Contribuciones aduanales</span>
                  <span style={{ fontWeight: 700, color: "var(--color-brand-blue)" }}>{fmtCurrency(op.total_taxes ?? 0, op.invoice_currency)}</span>
                </div>
                <div style={{ height: "1px", background: "var(--color-info-border)", margin: "4px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>Costo total de importación</span>
                  <span style={{ fontWeight: 800, color: "var(--color-text-primary)" }}>{fmtCurrency(op.invoice_value + (op.total_taxes ?? 0), op.invoice_currency)}</span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                  Tasa efectiva: {op.invoice_value > 0 ? (((op.total_taxes ?? 0) / op.invoice_value) * 100).toFixed(1) : 0}%
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
