"use client";

// ═══════════════════════════════════════════════════════════════════════
// MercanciasSection — Sección 3 del drawer Carta Porte 3.1
// Estilos: inline + CSS variables (mismo patrón que ConceptosSection)
//
// Captura la lista de mercancías transportadas con sus datos SAT.
//
// UX:
// - Cards plegables (similar a Ubicaciones)
// - Tabs internos por mercancía: Datos básicos · Material peligroso · COFEPRIS · Comercio Exterior
// - Auto-cálculo del total de pesos para reflejar en el agregado
// - Las claves SAT (bienes transportados + clave unidad) usan el componente
//   SATSearch reutilizable que conecta con Facturapi.
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import { SATSearch } from "@/app/components/SATSearch";
import type {
  CartaPorteData,
  CartaPorteMercancia,
  CartaPorteMercanciasAgregado,
} from "../../types/carta_porte.types";
import { newMercancia } from "../../types/carta_porte.defaults";
import type { ValidationError } from "../../types/carta_porte.validations";

interface Props {
  data: CartaPorteData;
  setMercancias: (next: CartaPorteMercancia[]) => void;
  setMercanciasAgregado: (next: CartaPorteMercanciasAgregado) => void;
  showValidation: boolean;
  errors: ValidationError[];
}

export function MercanciasSection({
  data,
  setMercancias,
  setMercanciasAgregado,
  showValidation,
  errors,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(
    data.mercancias[0]?._temp_id ?? null
  );

  const isInternacional = data.header.transp_internac === "Sí";

  // Auto-calcular peso bruto total y conteo cuando cambien las mercancías
  useEffect(() => {
    const sumaPesos = data.mercancias.reduce((acc, m) => acc + (m.peso_en_kg || 0), 0);
    const numTotal = data.mercancias.length;

    if (
      Math.abs(sumaPesos - data.mercancias_agregado.peso_bruto_total) > 0.001 ||
      numTotal !== data.mercancias_agregado.num_total_mercancias
    ) {
      setMercanciasAgregado({
        ...data.mercancias_agregado,
        peso_bruto_total: parseFloat(sumaPesos.toFixed(3)),
        num_total_mercancias: numTotal,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.mercancias]);

  // ─── Operaciones ───
  const updateMercancia = (
    tempId: string,
    patch: Partial<CartaPorteMercancia>
  ) => {
    setMercancias(
      data.mercancias.map(m =>
        m._temp_id === tempId ? { ...m, ...patch } : m
      )
    );
  };

  const addMercancia = () => {
    const nueva = newMercancia();
    setMercancias([...data.mercancias, nueva]);
    setExpandedId(nueva._temp_id);
  };

  const removeMercancia = (tempId: string) => {
    setMercancias(data.mercancias.filter(m => m._temp_id !== tempId));
    if (expandedId === tempId) setExpandedId(null);
  };

  const errorsByMercancia = (idx: number): number =>
    showValidation
      ? errors.filter(e => e.field.includes(`mercancias[${idx}]`)).length
      : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "880px" }}>
      {/* ── Banner ── */}
      <div style={{
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-info-bg)",
        border: "1px solid var(--color-info-border)",
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
      }}>
        <div style={{
          width: "28px",
          height: "28px",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-info-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-info-text)" strokeWidth="2">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0, fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>
          Registra cada tipo de mercancía que se transporta. Cada una requiere su{" "}
          <strong style={{ color: "var(--color-text-primary)" }}>clave SAT del producto</strong>, descripción,
          cantidad y peso en kg. Si transportas material peligroso o medicamentos, llena las pestañas correspondientes.
        </div>
      </div>

      {/* ── Lista de mercancías ── */}
      <div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}>
          <div>
            <div style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}>
              Mercancías a transportar
            </div>
            <div style={{
              fontSize: "11px",
              color: "var(--color-text-muted)",
              marginTop: "2px",
            }}>
              Mínimo 1 mercancía
            </div>
          </div>
          <span style={{
            fontSize: "11px",
            color: "var(--color-text-muted)",
            fontVariantNumeric: "tabular-nums",
          }}>
            {data.mercancias.length} {data.mercancias.length === 1 ? "registrada" : "registradas"}
          </span>
        </div>

        {data.mercancias.length === 0 ? (
          <EmptyState onAdd={addMercancia} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data.mercancias.map((m, idx) => (
              <MercanciaCard
                key={m._temp_id}
                mercancia={m}
                index={idx}
                isExpanded={expandedId === m._temp_id}
                isInternacional={isInternacional}
                onToggleExpand={() =>
                  setExpandedId(expandedId === m._temp_id ? null : m._temp_id)
                }
                onUpdate={patch => updateMercancia(m._temp_id, patch)}
                onRemove={() => removeMercancia(m._temp_id)}
                errorCount={errorsByMercancia(idx)}
              />
            ))}
            <button
              type="button"
              onClick={addMercancia}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "var(--radius-md)",
                border: "1px dashed var(--color-border)",
                background: "transparent",
                color: "var(--color-text-muted)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "var(--transition-fast)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = "var(--color-brand-blue)";
                e.currentTarget.style.borderColor = "var(--color-brand-blue)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = "var(--color-text-muted)";
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Agregar otra mercancía
            </button>
          </div>
        )}
      </div>

      {/* ── Totales agregados ── */}
      <div style={{
        padding: "14px 16px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-bg-subtle)",
        border: "1px solid var(--color-border-faint)",
      }}>
        <div style={{
          fontSize: "10px",
          fontWeight: 700,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: "10px",
        }}>
          Totales agregados (auto-calculados)
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
        }}>
          <div>
            <div style={{
              fontSize: "10px",
              color: "var(--color-text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "4px",
            }}>
              Número total de mercancías
            </div>
            <div style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              fontVariantNumeric: "tabular-nums",
            }}>
              {data.mercancias_agregado.num_total_mercancias}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: "10px",
              color: "var(--color-text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "4px",
            }}>
              Peso bruto total
            </div>
            <div style={{
              display: "flex",
              alignItems: "baseline",
              gap: "6px",
            }}>
              <div style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                fontVariantNumeric: "tabular-nums",
              }}>
                {data.mercancias_agregado.peso_bruto_total.toLocaleString("es-MX", {
                  maximumFractionDigits: 3,
                })}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                {data.mercancias_agregado.unidad_peso}
              </div>
            </div>
          </div>
          <FieldS label="Unidad de peso">
            <UnidadPesoSelector
              value={data.mercancias_agregado.unidad_peso}
              onChange={u =>
                setMercanciasAgregado({ ...data.mercancias_agregado, unidad_peso: u })
              }
            />
          </FieldS>
        </div>

        {/* Peso neto opcional + Logística inversa */}
        <div style={{
          marginTop: "14px",
          paddingTop: "14px",
          borderTop: "1px solid var(--color-border-faint)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "10px",
        }}>
          <FieldS label="Peso neto total (opcional)">
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="number"
                min="0"
                step="0.001"
                value={data.mercancias_agregado.peso_neto_total ?? ""}
                onChange={e =>
                  setMercanciasAgregado({
                    ...data.mercancias_agregado,
                    peso_neto_total: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="0.000"
                style={{
                  ...INPUT,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              />
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", padding: "0 4px" }}>
                {data.mercancias_agregado.unidad_peso}
              </span>
            </div>
          </FieldS>
          <FieldS label="Logística inversa / recolección / devolución">
            <select
              value={data.mercancias_agregado.logistica_inversa_recoleccion_devolucion ?? ""}
              onChange={e =>
                setMercanciasAgregado({
                  ...data.mercancias_agregado,
                  logistica_inversa_recoleccion_devolucion: (e.target.value as "Sí" | "No") || undefined,
                })
              }
              style={INPUT}
            >
              <option value="">No aplica</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>
          </FieldS>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{
      padding: "32px 24px",
      borderRadius: "var(--radius-md)",
      border: "1px dashed var(--color-border)",
      background: "var(--color-bg-base)",
      textAlign: "center",
    }}>
      <div style={{
        width: "44px",
        height: "44px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-bg-subtle)",
        margin: "0 auto 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <div style={{
        fontSize: "13px",
        color: "var(--color-text-second)",
        marginBottom: "12px",
      }}>
        Sin mercancías registradas
      </div>
      <button
        type="button"
        onClick={onAdd}
        style={{
          padding: "8px 16px",
          fontSize: "12px",
          fontWeight: 600,
          borderRadius: "var(--radius-md)",
          background: "var(--color-brand-blue)",
          color: "#FFFFFF",
          border: "none",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Agregar primera mercancía
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card de una mercancía (plegable, con tabs internos)
// ─────────────────────────────────────────────────────────────
type MercanciaTab = "basicos" | "peligroso" | "cofepris" | "comex";

interface MercanciaCardProps {
  mercancia: CartaPorteMercancia;
  index: number;
  isExpanded: boolean;
  isInternacional: boolean;
  onToggleExpand: () => void;
  onUpdate: (patch: Partial<CartaPorteMercancia>) => void;
  onRemove: () => void;
  errorCount: number;
}

function MercanciaCard({
  mercancia,
  index,
  isExpanded,
  isInternacional,
  onToggleExpand,
  onUpdate,
  onRemove,
  errorCount,
}: MercanciaCardProps) {
  const [activeTab, setActiveTab] = useState<MercanciaTab>("basicos");

  const headerSummary = [
    mercancia.descripcion || "Sin descripción",
    mercancia.cantidad > 0 && `${mercancia.cantidad} ${mercancia.clave_unidad}`,
    mercancia.peso_en_kg > 0 && `${mercancia.peso_en_kg.toLocaleString("es-MX")} kg`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div style={{
      borderRadius: "var(--radius-md)",
      overflow: "hidden",
      background: "var(--color-bg-subtle)",
      border: isExpanded
        ? "1px solid var(--color-brand-blue)"
        : errorCount > 0
        ? "1px solid var(--color-danger-border)"
        : "1px solid var(--color-border-faint)",
    }}>
      {/* Header */}
      <button
        type="button"
        onClick={onToggleExpand}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: "transparent",
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{
          width: "26px",
          height: "26px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-border-faint)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--color-text-second)",
          fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
        }}>
          {index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
          }}>
            <span style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}>
              Mercancía {index + 1}
            </span>
            {mercancia.bienes_transp && (
              <span style={{
                fontSize: "10px",
                fontFamily: "monospace",
                fontWeight: 600,
                background: "var(--color-brand-blue-light)",
                color: "var(--color-brand-blue)",
                padding: "1px 6px",
                borderRadius: "10px",
              }}>
                {mercancia.bienes_transp}
              </span>
            )}
            {mercancia.material_peligroso && (
              <span style={{
                fontSize: "10px",
                fontWeight: 600,
                background: "var(--color-danger-bg)",
                color: "var(--color-danger-text)",
                padding: "1px 6px",
                borderRadius: "10px",
              }}>
                ⚠ Peligroso
              </span>
            )}
          </div>
          <div style={{
            fontSize: "11px",
            color: "var(--color-text-muted)",
            marginTop: "2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {headerSummary}
          </div>
        </div>
        {errorCount > 0 && !isExpanded && (
          <span style={{
            padding: "2px 7px",
            borderRadius: "10px",
            background: "var(--color-danger-bg)",
            color: "var(--color-danger-text)",
            fontSize: "10px",
            fontWeight: 700,
            flexShrink: 0,
          }}>
            {errorCount} {errorCount === 1 ? "error" : "errores"}
          </span>
        )}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            color: "var(--color-text-muted)",
            flexShrink: 0,
            transform: isExpanded ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Body */}
      {isExpanded && (
        <div style={{ borderTop: "1px solid var(--color-border-faint)" }}>
          {/* Tabs */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "8px 10px",
            background: "var(--color-bg-base)",
            borderBottom: "1px solid var(--color-border-faint)",
            overflowX: "auto",
          }}>
            <TabButton
              active={activeTab === "basicos"}
              onClick={() => setActiveTab("basicos")}
              label="Datos básicos"
              required
            />
            <TabButton
              active={activeTab === "peligroso"}
              onClick={() => setActiveTab("peligroso")}
              label="Material peligroso"
              showDot={mercancia.material_peligroso}
            />
            <TabButton
              active={activeTab === "cofepris"}
              onClick={() => setActiveTab("cofepris")}
              label="COFEPRIS"
              showDot={!!mercancia.sector_cofepris}
            />
            {isInternacional && (
              <TabButton
                active={activeTab === "comex"}
                onClick={() => setActiveTab("comex")}
                label="Comercio Exterior"
                showDot={!!mercancia.fraccion_arancelaria}
              />
            )}
          </div>

          {/* Tab content */}
          <div style={{ padding: "14px" }}>
            {activeTab === "basicos" && (
              <DatosBasicosTab mercancia={mercancia} onUpdate={onUpdate} />
            )}
            {activeTab === "peligroso" && (
              <MaterialPeligrosoTab mercancia={mercancia} onUpdate={onUpdate} />
            )}
            {activeTab === "cofepris" && (
              <CofeprisTab mercancia={mercancia} onUpdate={onUpdate} />
            )}
            {activeTab === "comex" && isInternacional && (
              <ComexTab mercancia={mercancia} onUpdate={onUpdate} />
            )}
          </div>

          {/* Acciones */}
          <div style={{
            padding: "10px 14px",
            display: "flex",
            justifyContent: "flex-end",
            borderTop: "1px solid var(--color-border-faint)",
            background: "var(--color-bg-base)",
          }}>
            <button
              type="button"
              onClick={onRemove}
              style={{
                padding: "6px 12px",
                fontSize: "11px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-danger-border)",
                background: "var(--color-danger-bg)",
                color: "var(--color-danger-text)",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
              Eliminar mercancía
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 1: Datos básicos
// ─────────────────────────────────────────────────────────────
function DatosBasicosTab({
  mercancia,
  onUpdate,
}: {
  mercancia: CartaPorteMercancia;
  onUpdate: (patch: Partial<CartaPorteMercancia>) => void;
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "10px",
    }}>
      {/* Clave SAT del producto - autocomplete */}
      <div style={{ gridColumn: "1 / -1" }}>
        <FieldS
          label="Clave SAT del producto (BienesTransp)"
          required
          hint="Busca por nombre: 'transporte', 'refacciones', 'equipo'… Catálogo c_ClaveProdServCP del SAT."
        >
          <SATSearch
            type="products"
            value={mercancia.bienes_transp}
            onChange={code => onUpdate({ bienes_transp: code })}
            placeholder="Buscar producto SAT..."
            required
          />
        </FieldS>
      </div>

      {/* Descripción */}
      <div style={{ gridColumn: "1 / -1" }}>
        <FieldS label="Descripción" required>
          <input
            type="text"
            value={mercancia.descripcion}
            onChange={e => onUpdate({ descripcion: e.target.value })}
            placeholder="Ej: Refacciones automotrices ensambladas"
            maxLength={1000}
            style={INPUT}
          />
        </FieldS>
      </div>

      {/* Cantidad y Clave de unidad - en una fila propia para que el dropdown del SATSearch tenga buen espacio */}
      <FieldS label="Cantidad" required>
        <input
          type="number"
          min="0"
          step="0.001"
          value={mercancia.cantidad || ""}
          onChange={e => onUpdate({ cantidad: parseFloat(e.target.value) || 0 })}
          placeholder="0"
          style={{
            ...INPUT,
            textAlign: "right",
            fontVariantNumeric: "tabular-nums",
          }}
        />
      </FieldS>

      <FieldS
        label="Clave de unidad SAT"
        required
        hint="Busca: 'kilogramo', 'pieza', 'caja', 'servicio'…"
      >
        <SATSearch
          type="units"
          value={mercancia.clave_unidad}
          onChange={code => onUpdate({ clave_unidad: code })}
          placeholder="Buscar unidad SAT..."
          required
        />
      </FieldS>

      <FieldS label="Unidad personalizada (opcional)">
        <input
          type="text"
          value={mercancia.unidad ?? ""}
          onChange={e => onUpdate({ unidad: e.target.value || undefined })}
          placeholder="Texto descriptivo"
          style={INPUT}
        />
      </FieldS>

      <FieldS label="Dimensiones" hint="Formato: largo/ancho/alto + unidad (plg, cm, m)">
        <input
          type="text"
          value={mercancia.dimensiones ?? ""}
          onChange={e => onUpdate({ dimensiones: e.target.value })}
          placeholder="30/40/30plg"
          style={{ ...INPUT, fontFamily: "monospace" }}
        />
      </FieldS>

      <FieldS label="Peso en kilogramos" required>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <input
            type="number"
            min="0"
            step="0.001"
            value={mercancia.peso_en_kg || ""}
            onChange={e => onUpdate({ peso_en_kg: parseFloat(e.target.value) || 0 })}
            placeholder="0.000"
            style={{
              ...INPUT,
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
            }}
          />
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)", padding: "0 4px" }}>
            kg
          </span>
        </div>
      </FieldS>

      <FieldS label="Valor de la mercancía (opcional)">
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <input
            type="number"
            min="0"
            step="0.01"
            value={mercancia.valor_mercancia ?? ""}
            onChange={e =>
              onUpdate({ valor_mercancia: e.target.value ? parseFloat(e.target.value) : undefined })
            }
            placeholder="0.00"
            style={{
              ...INPUT,
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
            }}
          />
          <input
            type="text"
            value={mercancia.moneda ?? "MXN"}
            onChange={e => onUpdate({ moneda: e.target.value.toUpperCase() })}
            maxLength={3}
            placeholder="MXN"
            style={{
              ...INPUT,
              width: "70px",
              textAlign: "center",
              fontFamily: "monospace",
              fontWeight: 600,
            }}
          />
        </div>
      </FieldS>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 2: Material peligroso
// ─────────────────────────────────────────────────────────────
function MaterialPeligrosoTab({
  mercancia,
  onUpdate,
}: {
  mercancia: CartaPorteMercancia;
  onUpdate: (patch: Partial<CartaPorteMercancia>) => void;
}) {
  const { items: embalajes } = useSATCatalog("tipo_embalaje_comun");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Toggle */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: "var(--radius-md)",
        background: mercancia.material_peligroso ? "var(--color-danger-bg)" : "var(--color-bg-subtle)",
        border: `1px solid ${mercancia.material_peligroso ? "var(--color-danger-border)" : "var(--color-border-faint)"}`,
      }}>
        <div>
          <div style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}>
            ¿Es material peligroso?
          </div>
          <div style={{
            fontSize: "11px",
            color: "var(--color-text-muted)",
            marginTop: "2px",
          }}>
            Sustancias químicas, explosivos, inflamables, radioactivos, etc.
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            onUpdate({
              material_peligroso: !mercancia.material_peligroso,
              cve_material_peligroso: mercancia.material_peligroso ? undefined : mercancia.cve_material_peligroso,
            })
          }
          style={{
            position: "relative",
            width: "40px",
            height: "22px",
            borderRadius: "11px",
            border: "none",
            background: mercancia.material_peligroso ? "var(--color-danger-text)" : "var(--color-border-strong)",
            cursor: "pointer",
            padding: 0,
            transition: "var(--transition-fast)",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "2px",
              left: mercancia.material_peligroso ? "20px" : "2px",
              width: "18px",
              height: "18px",
              background: "#FFFFFF",
              borderRadius: "50%",
              boxShadow: "var(--shadow-sm)",
              transition: "left 0.18s ease",
            }}
          />
        </button>
      </div>

      {mercancia.material_peligroso ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "10px",
        }}>
          <FieldS
            label="Clave SAT del material peligroso"
            required
            hint="Catálogo c_MaterialPeligroso del SAT"
          >
            <input
              type="text"
              value={mercancia.cve_material_peligroso ?? ""}
              onChange={e => onUpdate({ cve_material_peligroso: e.target.value.toUpperCase() })}
              placeholder="Ej: 0001"
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
          <FieldS label="Tipo de embalaje">
            <select
              value={mercancia.embalaje ?? ""}
              onChange={e => onUpdate({ embalaje: e.target.value || undefined })}
              style={INPUT}
            >
              <option value="">Selecciona embalaje...</option>
              {embalajes.map(e => (
                <option key={e.code} value={e.code}>
                  {e.code} — {e.label}
                </option>
              ))}
            </select>
          </FieldS>
          <div style={{ gridColumn: "1 / -1" }}>
            <FieldS label="Descripción del embalaje">
              <input
                type="text"
                value={mercancia.desc_embalaje ?? ""}
                onChange={e => onUpdate({ desc_embalaje: e.target.value || undefined })}
                placeholder="Detalle adicional del embalaje"
                style={INPUT}
              />
            </FieldS>
          </div>
        </div>
      ) : (
        <div style={{
          padding: "32px 16px",
          textAlign: "center",
          fontSize: "12px",
          color: "var(--color-text-muted)",
        }}>
          Activa el toggle si la mercancía es material peligroso
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 3: COFEPRIS
// ─────────────────────────────────────────────────────────────
function CofeprisTab({
  mercancia,
  onUpdate,
}: {
  mercancia: CartaPorteMercancia;
  onUpdate: (patch: Partial<CartaPorteMercancia>) => void;
}) {
  const hasCofepris = !!mercancia.sector_cofepris;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{
        padding: "10px 12px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-info-bg)",
        border: "1px solid var(--color-info-border)",
        fontSize: "11px",
        color: "var(--color-text-second)",
        lineHeight: 1.5,
      }}>
        Solo aplica para <strong style={{ color: "var(--color-text-primary)" }}>medicamentos, sustancias químicas reguladas, productos biológicos
        o alimentos perecederos</strong> que requieren registro COFEPRIS.
      </div>

      <FieldS label="Sector COFEPRIS">
        <input
          type="text"
          value={mercancia.sector_cofepris ?? ""}
          onChange={e => onUpdate({ sector_cofepris: e.target.value || undefined })}
          placeholder="Catálogo c_SectorCOFEPRIS"
          style={INPUT}
        />
      </FieldS>

      {hasCofepris && (
        <div style={{
          paddingTop: "12px",
          borderTop: "1px solid var(--color-border-faint)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "10px",
        }}>
          <FieldS label="Nombre del ingrediente activo">
            <input
              type="text"
              value={mercancia.nombre_ingrediente_activo ?? ""}
              onChange={e => onUpdate({ nombre_ingrediente_activo: e.target.value || undefined })}
              style={INPUT}
            />
          </FieldS>
          <FieldS label="Nombre químico">
            <input
              type="text"
              value={mercancia.nom_quimico ?? ""}
              onChange={e => onUpdate({ nom_quimico: e.target.value || undefined })}
              style={INPUT}
            />
          </FieldS>
          <FieldS label="Denominación genérica">
            <input
              type="text"
              value={mercancia.denominacion_generica_prod ?? ""}
              onChange={e => onUpdate({ denominacion_generica_prod: e.target.value || undefined })}
              style={INPUT}
            />
          </FieldS>
          <FieldS label="Denominación distintiva">
            <input
              type="text"
              value={mercancia.denominacion_distintiva_prod ?? ""}
              onChange={e => onUpdate({ denominacion_distintiva_prod: e.target.value || undefined })}
              style={INPUT}
            />
          </FieldS>
          <FieldS label="Fabricante">
            <input
              type="text"
              value={mercancia.fabricante ?? ""}
              onChange={e => onUpdate({ fabricante: e.target.value || undefined })}
              style={INPUT}
            />
          </FieldS>
          <FieldS label="Fecha de caducidad">
            <input
              type="date"
              value={mercancia.fecha_caducidad ?? ""}
              onChange={e => onUpdate({ fecha_caducidad: e.target.value || undefined })}
              style={INPUT}
            />
          </FieldS>
          <FieldS label="Lote del medicamento">
            <input
              type="text"
              value={mercancia.lote_medicamento ?? ""}
              onChange={e => onUpdate({ lote_medicamento: e.target.value || undefined })}
              style={INPUT}
            />
          </FieldS>
          <FieldS label="Registro sanitario / Folio autorización">
            <input
              type="text"
              value={mercancia.registro_sanitario_folio_autorizacion ?? ""}
              onChange={e => onUpdate({ registro_sanitario_folio_autorizacion: e.target.value || undefined })}
              style={INPUT}
            />
          </FieldS>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 4: Comercio Exterior
// ─────────────────────────────────────────────────────────────
function ComexTab({
  mercancia,
  onUpdate,
}: {
  mercancia: CartaPorteMercancia;
  onUpdate: (patch: Partial<CartaPorteMercancia>) => void;
}) {
  const { items: tiposMateria } = useSATCatalog("tipo_materia");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{
        padding: "10px 12px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-brand-orange-light)",
        border: "1px solid var(--color-brand-orange)",
        fontSize: "11px",
        color: "var(--color-text-second)",
        lineHeight: 1.5,
      }}>
        Datos requeridos por el SAT para mercancía que cruza fronteras.
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "10px",
      }}>
        <FieldS label="Fracción arancelaria" hint="10 dígitos del catálogo c_FraccionArancelaria">
          <input
            type="text"
            value={mercancia.fraccion_arancelaria ?? ""}
            onChange={e => onUpdate({ fraccion_arancelaria: e.target.value || undefined })}
            placeholder="0123456789"
            maxLength={10}
            style={{ ...INPUT, fontFamily: "monospace" }}
          />
        </FieldS>
        <FieldS label="UUID de Comercio Exterior">
          <input
            type="text"
            value={mercancia.uuid_comercio_ext ?? ""}
            onChange={e => onUpdate({ uuid_comercio_ext: e.target.value || undefined })}
            placeholder="UUID si ya hay CFDI CCE"
            style={{ ...INPUT, fontFamily: "monospace" }}
          />
        </FieldS>
        <FieldS label="Tipo de materia">
          <select
            value={mercancia.tipo_materia ?? ""}
            onChange={e => onUpdate({ tipo_materia: e.target.value || undefined })}
            style={INPUT}
          >
            <option value="">Selecciona tipo...</option>
            {tiposMateria.map(t => (
              <option key={t.code} value={t.code}>
                {t.code} — {t.label}
              </option>
            ))}
          </select>
        </FieldS>
        <FieldS label="Descripción de la materia">
          <input
            type="text"
            value={mercancia.descripcion_materia ?? ""}
            onChange={e => onUpdate({ descripcion_materia: e.target.value || undefined })}
            placeholder="Detalle del tipo de materia"
            style={INPUT}
          />
        </FieldS>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers de UI
// ─────────────────────────────────────────────────────────────

const INPUT: React.CSSProperties = {
  width: "100%",
  height: "36px",
  padding: "0 10px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-base)",
  color: "var(--color-text-primary)",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

function UnidadPesoSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { items, loading } = useSATCatalog("unidad_peso");
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={loading}
      style={INPUT}
    >
      {loading ? (
        <option value={value}>Cargando...</option>
      ) : (
        items.map(u => (
          <option key={u.code} value={u.code}>
            {u.code} — {u.label}
          </option>
        ))
      )}
    </select>
  );
}

function TabButton({
  active,
  onClick,
  label,
  required,
  showDot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  required?: boolean;
  showDot?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "relative",
        padding: "6px 12px",
        fontSize: "12px",
        fontWeight: 600,
        borderRadius: "var(--radius-md)",
        border: "none",
        background: active ? "var(--color-brand-blue)" : "transparent",
        color: active ? "#FFFFFF" : "var(--color-text-muted)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "var(--transition-fast)",
      }}
    >
      {label}
      {required && <span style={{ color: active ? "#FCA5A5" : "var(--color-danger-text)", marginLeft: "3px" }}>*</span>}
      {showDot && !active && (
        <span style={{
          position: "absolute",
          top: "4px",
          right: "4px",
          width: "6px",
          height: "6px",
          background: "var(--color-brand-blue)",
          borderRadius: "50%",
        }} />
      )}
    </button>
  );
}

function FieldS({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{
        display: "block",
        fontSize: "11px",
        color: "var(--color-text-muted)",
        marginBottom: "5px",
        fontWeight: 500,
      }}>
        {label}
        {required && <span style={{ color: "var(--color-danger-text)", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
      {hint && (
        <div style={{
          fontSize: "10px",
          color: "var(--color-text-muted)",
          marginTop: "4px",
          lineHeight: 1.4,
        }}>
          {hint}
        </div>
      )}
    </div>
  );
}
