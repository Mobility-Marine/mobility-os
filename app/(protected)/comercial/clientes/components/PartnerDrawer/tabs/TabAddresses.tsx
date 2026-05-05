// ════════════════════════════════════════════════════════════════════════
// TabAddresses — Tab 4 del wizard PartnerDrawer
// ════════════════════════════════════════════════════════════════════════
// Lista multi-direcciones del partner (CRUD local).
// Tipos de dirección: billing, shipping, warehouse, other.
// Solo una puede ser default.
// ════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { PartnerAddress, AddressType } from "../types";
import { ADDRESS_TYPE_LABELS } from "../types";
import { Field, FIELD_INPUT, FIELD_SELECT, SectionTitle } from "../components/Field";
import {
  fetchEstadosMexico,
  fetchPaisesComunes,
  type SATCatalogItem,
} from "../services/sat-catalogs.service";

// ── Props ─────────────────────────────────────────────────────────────
export type TabAddressesProps = {
  addresses:  PartnerAddress[];
  onChange:   (addresses: PartnerAddress[]) => void;
};

// ── Estilos (reutilizables) ───────────────────────────────────────────
const ROW: CSSProperties = {
  position:      "relative",
  padding:       "16px",
  borderRadius:  "var(--radius-md)",
  border:        "1px solid var(--color-border)",
  background:    "var(--color-bg-subtle)",
  display:       "flex",
  flexDirection: "column",
  gap:           "12px",
};

const ROW_HEADER: CSSProperties = {
  display:        "flex",
  alignItems:     "center",
  justifyContent: "space-between",
  gap:            "12px",
};

const TYPE_BADGE: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  gap:            "4px",
  padding:        "3px 8px",
  borderRadius:   "var(--radius-sm, 4px)",
  fontSize:       "10px",
  fontWeight:     700,
  letterSpacing:  "0.4px",
  textTransform:  "uppercase",
  background:     "rgba(59, 130, 246, 0.15)",
  color:          "var(--color-brand-blue, #3b82f6)",
};

const DEFAULT_BADGE: CSSProperties = {
  ...TYPE_BADGE,
  background: "rgba(34, 197, 94, 0.15)",
  color:      "var(--color-success-text)",
};

const ICON_BUTTON: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  justifyContent: "center",
  width:          "28px",
  height:         "28px",
  borderRadius:   "var(--radius-sm, 4px)",
  border:         "1px solid var(--color-border)",
  background:     "transparent",
  color:          "var(--color-text-muted)",
  cursor:         "pointer",
  fontSize:       "14px",
  outline:        "none",
};

const ADD_BUTTON: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  gap:            "6px",
  height:         "34px",
  padding:        "0 14px",
  borderRadius:   "var(--radius-md)",
  fontSize:       "13px",
  fontWeight:     600,
  cursor:         "pointer",
  border:         "1px dashed var(--color-brand-blue, #3b82f6)",
  background:     "transparent",
  color:          "var(--color-brand-blue, #3b82f6)",
  outline:        "none",
  alignSelf:      "flex-start",
};

const EMPTY_STATE: CSSProperties = {
  padding:       "32px 20px",
  textAlign:     "center",
  border:        "1px dashed var(--color-border)",
  borderRadius:  "var(--radius-md)",
  color:         "var(--color-text-muted)",
  fontSize:      "13px",
  lineHeight:    1.6,
};

// ── Helper: generar UUID local ────────────────────────────────────────
function genLocalId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ── Componente ────────────────────────────────────────────────────────
export function TabAddresses({ addresses, onChange }: TabAddressesProps) {
  const [estados, setEstados] = useState<SATCatalogItem[]>([]);
  const [paises,  setPaises]  = useState<SATCatalogItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchEstadosMexico(), fetchPaisesComunes()])
      .then(([est, pa]) => {
        if (!cancelled) {
          setEstados(est);
          setPaises(pa);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const visibleAddresses = addresses.filter((a) => !a._isDeleted);

  // ── Handlers ──────────────────────────────────────────────────────
  function handleAdd() {
    const newAddress: PartnerAddress = {
      _localId:   genLocalId(),
      _isDirty:   true,
      type:       "shipping",
      zip_code:   "",
      country:    "MEX",
      is_default: addresses.length === 0,
    };
    onChange([...addresses, newAddress]);
  }

  function handlePatch(idxVisible: number, patch: Partial<PartnerAddress>) {
    const target = visibleAddresses[idxVisible];
    const realIdx = addresses.indexOf(target);
    if (realIdx < 0) return;

    const next = [...addresses];
    next[realIdx] = { ...target, ...patch, _isDirty: true };

    // Si se marca is_default, desmarcar las demás
    if (patch.is_default === true) {
      next.forEach((a, i) => {
        if (i !== realIdx && a.is_default && !a._isDeleted) {
          next[i] = { ...a, is_default: false, _isDirty: true };
        }
      });
    }
    onChange(next);
  }

  function handleDelete(idxVisible: number) {
    const target = visibleAddresses[idxVisible];
    const realIdx = addresses.indexOf(target);
    if (realIdx < 0) return;

    const next = [...addresses];
    if (target.id) {
      next[realIdx] = { ...target, _isDeleted: true };
    } else {
      next.splice(realIdx, 1);
    }
    onChange(next);
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <SectionTitle>Direcciones del partner</SectionTitle>

      <div
        style={{
          fontSize:    "12px",
          color:       "var(--color-text-muted)",
          lineHeight:  1.5,
        }}
      >
        Registra direcciones de facturación, envío, almacén, etc. Una puede marcarse como
        predeterminada para usarse por defecto en operaciones.
      </div>

      {visibleAddresses.length === 0 && (
        <div style={EMPTY_STATE}>
          📍 No hay direcciones registradas.
          <br />
          Agrega al menos una dirección de envío o facturación.
        </div>
      )}

      {visibleAddresses.map((a, i) => (
        <div key={a.id ?? a._localId ?? i} style={ROW}>
          <div style={ROW_HEADER}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>📍</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                {a.alias || ADDRESS_TYPE_LABELS[a.type]}
              </span>
              <span style={TYPE_BADGE}>{ADDRESS_TYPE_LABELS[a.type]}</span>
              {a.is_default && (
                <span style={DEFAULT_BADGE}>⭐ Default</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleDelete(i)}
              style={ICON_BUTTON}
              title="Eliminar dirección"
              aria-label="Eliminar dirección"
            >
              🗑️
            </button>
          </div>

          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap:                 "12px",
            }}
          >
            <Field label="Tipo" required>
              <select
                value={a.type}
                onChange={(e) => handlePatch(i, { type: e.target.value as AddressType })}
                style={FIELD_SELECT}
              >
                {(Object.keys(ADDRESS_TYPE_LABELS) as AddressType[]).map((t) => (
                  <option key={t} value={t}>
                    {ADDRESS_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Alias (opcional)" span={2}>
              <input
                type="text"
                value={a.alias ?? ""}
                onChange={(e) => handlePatch(i, { alias: e.target.value })}
                placeholder="Ej. Almacén CDMX"
                style={FIELD_INPUT}
              />
            </Field>

            <Field label="Default">
              <label
                style={{
                  display:    "inline-flex",
                  alignItems: "center",
                  gap:        "8px",
                  height:     "36px",
                  cursor:     "pointer",
                  fontSize:   "13px",
                  color:      "var(--color-text-primary)",
                }}
              >
                <input
                  type="checkbox"
                  checked={a.is_default ?? false}
                  onChange={(e) => handlePatch(i, { is_default: e.target.checked })}
                  style={{ width: "16px", height: "16px", accentColor: "var(--color-brand-blue, #3b82f6)" }}
                />
                Usar como dirección predeterminada
              </label>
            </Field>

            <Field label="Calle" span={2}>
              <input
                type="text"
                value={a.street ?? ""}
                onChange={(e) => handlePatch(i, { street: e.target.value })}
                placeholder="Av. Reforma"
                style={FIELD_INPUT}
              />
            </Field>

            <Field label="Núm. ext.">
              <input
                type="text"
                value={a.ext_number ?? ""}
                onChange={(e) => handlePatch(i, { ext_number: e.target.value })}
                placeholder="123"
                style={FIELD_INPUT}
              />
            </Field>

            <Field label="Núm. int.">
              <input
                type="text"
                value={a.int_number ?? ""}
                onChange={(e) => handlePatch(i, { int_number: e.target.value })}
                placeholder="A"
                style={FIELD_INPUT}
              />
            </Field>

            <Field label="Colonia" span={2}>
              <input
                type="text"
                value={a.neighborhood ?? ""}
                onChange={(e) => handlePatch(i, { neighborhood: e.target.value })}
                placeholder="Juárez"
                style={FIELD_INPUT}
              />
            </Field>

            <Field label="Ciudad" span={2}>
              <input
                type="text"
                value={a.city ?? ""}
                onChange={(e) => handlePatch(i, { city: e.target.value })}
                placeholder="Ciudad de México"
                style={FIELD_INPUT}
              />
            </Field>

            <Field label="Estado">
              <select
                value={a.state ?? ""}
                onChange={(e) => handlePatch(i, { state: e.target.value })}
                style={FIELD_SELECT}
              >
                <option value="">— Seleccionar —</option>
                {estados.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="CP" required>
              <input
                type="text"
                value={a.zip_code ?? ""}
                onChange={(e) => handlePatch(i, { zip_code: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                placeholder="00000"
                maxLength={5}
                style={FIELD_INPUT}
              />
            </Field>

            <Field label="País">
              <select
                value={a.country ?? "MEX"}
                onChange={(e) => handlePatch(i, { country: e.target.value })}
                style={FIELD_SELECT}
              >
                {paises.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Notas" span={4}>
              <input
                type="text"
                value={a.notes ?? ""}
                onChange={(e) => handlePatch(i, { notes: e.target.value })}
                placeholder="Referencias, instrucciones de entrega, etc."
                style={FIELD_INPUT}
              />
            </Field>
          </div>
        </div>
      ))}

      <button type="button" onClick={handleAdd} style={ADD_BUTTON}>
        ➕ Agregar dirección
      </button>
    </div>
  );
}