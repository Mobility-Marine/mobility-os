"use client";
import { useState } from "react";
import type { TransportUnit, UnitStatus, UnitType } from "../types/transport.types";
import { UNIT_STATUS_CONFIG, UNIT_TYPE_LABELS, getUnitAlerts } from "../types/transport.types";
import { useTranslation }   from "@/lib/i18n/useTranslation";
import { useTenant }        from "@/lib/tenant/TenantProvider";
import { updateUnitStatus } from "../services/transport.service";

type Props = {
  unit:      TransportUnit | null;
  onUpdate:  (id: string, updates: Partial<TransportUnit>) => Promise<void>;
  onDelete:  (id: string) => Promise<void>;
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

export default function TransportWorkspace({ unit, onUpdate, onDelete, saving }: Props) {
  const { t, lang }   = useTranslation();
  const { companyId } = useTenant();
  const tl            = (t.logistics as any) ?? {};
  const locale        = lang === "en" ? "en-US" : "es-MX";

  const [editing,    setEditing]    = useState(false);
  const [form,       setForm]       = useState<Partial<TransportUnit>>({});
  const [confirmDel, setConfirmDel] = useState(false);

  if (!unit) return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", height: "100%" }}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
        <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h5l3 5v5h-8V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>{tl.unitWorkspaceEmpty ?? "Selecciona una unidad"}</div>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }}>{tl.unitWorkspaceEmptyDesc ?? "Aquí verás el detalle de la unidad."}</div>
    </div>
  );

  const stCfg     = UNIT_STATUS_CONFIG[unit.status];
  const stLabel   = tl[stCfg.labelKey.replace("logistics.", "")] ?? unit.status;
  const typeKey   = UNIT_TYPE_LABELS[unit.unit_type];
  const typeLabel = tl[typeKey?.replace("logistics.", "") ?? ""] ?? unit.unit_type;
  const alerts    = getUnitAlerts(unit);

  function set(k: keyof TransportUnit, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSave() {
    await onUpdate(unit.id, form);
    setEditing(false);
    setForm({});
  }

  const UNIT_TYPES = Object.keys(UNIT_TYPE_LABELS) as UnitType[];

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>

      {/* HEADER */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-text-primary)" }}>{unit.name}</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: stCfg.bg, border: `1px solid ${stCfg.border}`, color: stCfg.color }}>{stLabel}</span>
              <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>{typeLabel}</span>
              {alerts.map((a) => (
                <span key={a.field} style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: a.severity === "expired" ? "var(--color-danger-bg)" : "var(--color-warning-bg)", border: `1px solid ${a.severity === "expired" ? "var(--color-danger-border)" : "var(--color-warning-border)"}`, color: a.severity === "expired" ? "var(--color-danger-text)" : "var(--color-warning-text)" }}>
                  {tl[a.labelKey.replace("logistics.", "")] ?? a.labelKey}
                </span>
              ))}
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "3px" }}>
              {[unit.brand, unit.model, unit.year?.toString()].filter(Boolean).join(" ")}
              {unit.plates && ` · ${unit.plates}`}
              {unit.assigned_driver && ` · ${unit.assigned_driver}`}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {!editing ? (
            <button onClick={() => { setForm({ ...unit }); setEditing(true); }} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              {t.general.edit}
            </button>
          ) : (
            <>
              <button onClick={handleSave} disabled={saving} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                {saving ? t.general.loading : `✓ ${t.general.save}`}
              </button>
              <button onClick={() => { setEditing(false); setForm({}); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                {t.general.cancel}
              </button>
            </>
          )}

          {/* Status transitions */}
          {unit.status === "active" && (
            <button onClick={async () => { await updateUnitStatus(companyId!, unit.id, "maintenance"); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "#fef3c7", border: "1px solid #fcd34d", color: "#d97706", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
              → {tl.unitMaintenance ?? "Mantenimiento"}
            </button>
          )}
          {unit.status === "maintenance" && (
            <button onClick={async () => { await updateUnitStatus(companyId!, unit.id, "active"); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
              → {tl.unitActive ?? "Activa"}
            </button>
          )}
          {unit.status !== "inactive" && (
            <button onClick={async () => { await updateUnitStatus(companyId!, unit.id, "inactive"); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
              Desactivar
            </button>
          )}

          {/* Delete */}
          <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
            {!confirmDel ? (
              <button onClick={() => setConfirmDel(true)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "11px", cursor: "pointer" }}>
                {t.general.delete}
              </button>
            ) : (
              <>
                <button onClick={() => onDelete(unit.id)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>¿Eliminar?</button>
                <button onClick={() => setConfirmDel(false)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>{(t.general as any).no ?? "No"}</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

          {/* IDENTIFICACIÓN */}
          <SectionTitle>{tl.sectionIdentification ?? "Identificación"}</SectionTitle>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label={tl.unitName ?? "Nombre / Identificador"}>
              {editing ? (
                <input value={(form as any).name ?? ""} onChange={(e) => set("name", e.target.value)} style={INPUT} />
              ) : (
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{unit.name}</div>
              )}
            </Field>
          </div>

          <Field label={tl.unitType ?? "Tipo"}>
            {editing ? (
              <select value={(form as any).unit_type ?? unit.unit_type} onChange={(e) => set("unit_type", e.target.value as UnitType)} style={{ ...INPUT, cursor: "pointer" }}>
                {UNIT_TYPES.map((k) => (
                  <option key={k} value={k}>{tl[UNIT_TYPE_LABELS[k]?.replace("logistics.", "") ?? ""] ?? k}</option>
                ))}
              </select>
            ) : (
              <div style={{ fontSize: "12px", color: "var(--color-text-primary)" }}>{typeLabel}</div>
            )}
          </Field>

          <Field label={tl.unitStatus ?? "Estado"}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: stCfg.color, flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: 700, color: stCfg.color }}>{stLabel}</span>
            </div>
          </Field>

          {([
            { k: "brand",  label: tl.unitBrand ?? "Marca"  },
            { k: "model",  label: tl.unitModel ?? "Modelo" },
            { k: "year",   label: tl.unitYear  ?? "Año",   type: "number" },
            { k: "plates", label: tl.unitPlates ?? "Placas" },
            { k: "vin",    label: tl.unitVin    ?? "VIN / No. Serie" },
            { k: "color",  label: tl.unitColor  ?? "Color"  },
          ] as any[]).map((f) => (
            <Field key={f.k} label={f.label}>
              {editing ? (
                <input type={f.type ?? "text"} value={(form as any)[f.k] ?? ""} onChange={(e) => set(f.k, f.type === "number" ? parseInt(e.target.value) || null : e.target.value)} style={INPUT} />
              ) : (
                <div style={{ fontSize: "12px", color: "var(--color-text-primary)", minHeight: "20px" }}>
                  {(unit as any)[f.k] ?? <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                </div>
              )}
            </Field>
          ))}

          {/* CAPACIDAD */}
          <SectionTitle>{tl.sectionCapacity ?? "Capacidad"}</SectionTitle>

          <Field label={tl.unitCapacityKg ?? "Capacidad (kg)"}>
            {editing ? (
              <input type="number" min="0" value={(form as any).capacity_kg ?? ""} onChange={(e) => set("capacity_kg", parseFloat(e.target.value) || null)} style={INPUT} />
            ) : (
              <div style={{ fontSize: "12px", color: "var(--color-text-primary)" }}>
                {unit.capacity_kg ? `${unit.capacity_kg.toLocaleString()} kg` : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
              </div>
            )}
          </Field>

          <Field label={tl.unitCapacityM3 ?? "Capacidad (m³)"}>
            {editing ? (
              <input type="number" min="0" step="0.1" value={(form as any).capacity_m3 ?? ""} onChange={(e) => set("capacity_m3", parseFloat(e.target.value) || null)} style={INPUT} />
            ) : (
              <div style={{ fontSize: "12px", color: "var(--color-text-primary)" }}>
                {unit.capacity_m3 ? `${unit.capacity_m3} m³` : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
              </div>
            )}
          </Field>

          {/* GPS */}
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label={tl.unitGps ?? "Unidad GPS"}>
              {editing ? (
                <input value={(form as any).gps_unit ?? ""} onChange={(e) => set("gps_unit", e.target.value)} style={INPUT} />
              ) : (
                <div style={{ fontSize: "12px", color: "var(--color-text-primary)", minHeight: "20px" }}>
                  {unit.gps_unit ?? <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                </div>
              )}
            </Field>
          </div>

          {/* DOCUMENTACIÓN */}
          <SectionTitle>{tl.sectionDocuments ?? "Documentación"}</SectionTitle>

          {([
            { k: "insurance_policy",    label: tl.unitInsurancePolicy    ?? "No. Póliza seguro",  type: "text" },
            { k: "insurance_expiry",    label: tl.unitInsuranceExpiry    ?? "Vence seguro",         type: "date" },
            { k: "verification_expiry", label: tl.unitVerificationExpiry ?? "Vence verificación",  type: "date" },
            { k: "tenencia_year",       label: tl.unitTenenciaYear       ?? "Año tenencia",         type: "number" },
          ] as any[]).map((f) => {
            const isAlerted = alerts.find((a) => a.field === f.k);
            const val = (unit as any)[f.k];
            const displayVal = f.type === "date" && val ? new Date(val).toLocaleDateString(locale) : val;
            return (
              <Field key={f.k} label={f.label}>
                {editing ? (
                  <input type={f.type} value={(form as any)[f.k] ?? ""} onChange={(e) => set(f.k, f.type === "number" ? parseInt(e.target.value) || null : e.target.value || null)} style={INPUT} />
                ) : (
                  <div style={{ fontSize: "12px", fontWeight: isAlerted ? 700 : 400, color: isAlerted ? (isAlerted.severity === "expired" ? "var(--color-danger-text)" : "var(--color-warning-text)") : "var(--color-text-primary)", minHeight: "20px" }}>
                    {displayVal ?? <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>—</span>}
                    {isAlerted && <span style={{ marginLeft: "6px", fontSize: "10px" }}>{tl[isAlerted.labelKey.replace("logistics.", "")] ?? ""}</span>}
                  </div>
                )}
              </Field>
            );
          })}

          {/* OPERADOR */}
          <SectionTitle>{tl.sectionDriver ?? "Operador"}</SectionTitle>

          {([
            { k: "assigned_driver",      label: tl.unitAssignedDriver       ?? "Operador asignado",   type: "text" },
            { k: "driver_license",       label: tl.unitDriverLicense        ?? "Licencia",             type: "text" },
            { k: "driver_license_expiry",label: tl.unitDriverLicenseExpiry  ?? "Vence licencia",       type: "date" },
          ] as any[]).map((f) => {
            const isAlerted = alerts.find((a) => a.field === f.k);
            const val = (unit as any)[f.k];
            const displayVal = f.type === "date" && val ? new Date(val).toLocaleDateString(locale) : val;
            return (
              <Field key={f.k} label={f.label}>
                {editing ? (
                  <input type={f.type} value={(form as any)[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value || null)} style={INPUT} />
                ) : (
                  <div style={{ fontSize: "12px", fontWeight: isAlerted ? 700 : 400, color: isAlerted ? (isAlerted.severity === "expired" ? "var(--color-danger-text)" : "var(--color-warning-text)") : "var(--color-text-primary)", minHeight: "20px" }}>
                    {displayVal ?? <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>—</span>}
                  </div>
                )}
              </Field>
            );
          })}

          {/* NOTAS */}
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label={tl.unitNotes ?? "Notas"}>
              {editing ? (
                <textarea rows={3} value={(form as any).notes ?? ""} onChange={(e) => set("notes", e.target.value)} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical", lineHeight: 1.5 }} />
              ) : (
                <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "12px", color: unit.notes ? "var(--color-text-primary)" : "var(--color-text-muted)", lineHeight: 1.6, minHeight: "50px" }}>
                  {unit.notes ?? "Sin notas."}
                </div>
              )}
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
