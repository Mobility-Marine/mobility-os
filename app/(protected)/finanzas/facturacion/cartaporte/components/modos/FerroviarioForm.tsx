"use client";

// ═══════════════════════════════════════════════════════════════════════
// FerroviarioForm — Datos del transporte ferroviario
// Estilos: inline + CSS variables (mismo patrón que ConceptosSection)
//
// Captura: tipo de servicio/tráfico, seguros (opcional),
// derechos de paso (opcional, si transita por vías de otro concesionario),
// y carros del tren (mínimo 1, cada uno con sus contenedores opcionales).
// ═══════════════════════════════════════════════════════════════════════

import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type {
  TransporteFerroviario,
  CarroFerroviario,
  DerechoDePaso,
  ContenedorFerroviario,
} from "../../types/carta_porte.types";

interface Props {
  value: TransporteFerroviario;
  onChange: (next: TransporteFerroviario) => void;
}

export function FerroviarioForm({ value, onChange }: Props) {
  const { items: servicios, loading: loadingServ } = useSATCatalog("tipo_servicio_ferroviario");
  const { items: traficos, loading: loadingTraf } = useSATCatalog("tipo_trafico_ferroviario");
  const { items: tiposCarro, loading: loadingTC } = useSATCatalog("tipo_carro");
  const { items: derechos, loading: loadingDer } = useSATCatalog("derechos_de_paso");

  const update = (patch: Partial<TransporteFerroviario>) =>
    onChange({ ...value, ...patch });

  // ─── Derechos de paso ───
  const addDerecho = () => {
    const nuevo: DerechoDePaso = { tipo_derecho_de_paso: "", kilometraje_pagado: 0 };
    onChange({ ...value, derechos_de_paso: [...(value.derechos_de_paso ?? []), nuevo] });
  };

  const updateDerecho = (idx: number, patch: Partial<DerechoDePaso>) => {
    const list = [...(value.derechos_de_paso ?? [])];
    list[idx] = { ...list[idx], ...patch };
    onChange({ ...value, derechos_de_paso: list });
  };

  const removeDerecho = (idx: number) => {
    const list = [...(value.derechos_de_paso ?? [])];
    list.splice(idx, 1);
    onChange({ ...value, derechos_de_paso: list });
  };

  // ─── Carros ───
  const addCarro = () => {
    const nuevo: CarroFerroviario = {
      tipo_carro: "",
      matricula_carro: "",
      guia_carro: "",
      toneladas_netas_carro: 0,
      contenedores: [],
    };
    onChange({ ...value, carros: [...value.carros, nuevo] });
  };

  const updateCarro = (idx: number, patch: Partial<CarroFerroviario>) => {
    const list = [...value.carros];
    list[idx] = { ...list[idx], ...patch };
    onChange({ ...value, carros: list });
  };

  const removeCarro = (idx: number) => {
    const list = [...value.carros];
    list.splice(idx, 1);
    onChange({ ...value, carros: list });
  };

  // ─── Contenedores dentro de un carro ───
  const addContenedor = (carroIdx: number) => {
    const list = [...value.carros];
    const nuevo: ContenedorFerroviario = { tipo_contenedor: "", guia_contenedor: "" };
    list[carroIdx] = {
      ...list[carroIdx],
      contenedores: [...(list[carroIdx].contenedores ?? []), nuevo],
    };
    onChange({ ...value, carros: list });
  };

  const updateContenedor = (
    carroIdx: number,
    contIdx: number,
    patch: Partial<ContenedorFerroviario>
  ) => {
    const list = [...value.carros];
    const conts = [...(list[carroIdx].contenedores ?? [])];
    conts[contIdx] = { ...conts[contIdx], ...patch };
    list[carroIdx] = { ...list[carroIdx], contenedores: conts };
    onChange({ ...value, carros: list });
  };

  const removeContenedor = (carroIdx: number, contIdx: number) => {
    const list = [...value.carros];
    const conts = [...(list[carroIdx].contenedores ?? [])];
    conts.splice(contIdx, 1);
    list[carroIdx] = { ...list[carroIdx], contenedores: conts };
    onChange({ ...value, carros: list });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ── Servicio ── */}
      <CardGroup title="Tipo de servicio ferroviario">
        <div style={GRID2}>
          <FieldS label="Tipo de servicio" required>
            <select
              value={value.tipo_de_servicio}
              onChange={e => update({ tipo_de_servicio: e.target.value })}
              disabled={loadingServ}
              style={INPUT}
            >
              <option value="">{loadingServ ? "Cargando..." : "Selecciona..."}</option>
              {servicios.map(s => (
                <option key={s.code} value={s.code}>
                  {s.code} — {s.label}
                </option>
              ))}
            </select>
          </FieldS>
          <FieldS label="Tipo de tráfico" required>
            <select
              value={value.tipo_de_trafico}
              onChange={e => update({ tipo_de_trafico: e.target.value })}
              disabled={loadingTraf}
              style={INPUT}
            >
              <option value="">{loadingTraf ? "Cargando..." : "Selecciona..."}</option>
              {traficos.map(t => (
                <option key={t.code} value={t.code}>
                  {t.code} — {t.label}
                </option>
              ))}
            </select>
          </FieldS>
          <FieldS label="Aseguradora (opcional)">
            <input
              type="text"
              value={value.nombre_aseg ?? ""}
              onChange={e => update({ nombre_aseg: e.target.value || undefined })}
              style={INPUT}
            />
          </FieldS>
          <FieldS label="Número de póliza">
            <input
              type="text"
              value={value.num_poliza_seguro ?? ""}
              onChange={e => update({ num_poliza_seguro: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
        </div>
      </CardGroup>

      {/* ── Derechos de paso ── */}
      <CardGroup
        title="Derechos de paso (opcional)"
        subtitle="Solo si la unidad transita por vías de otro concesionario"
        rightHeader={
          (value.derechos_de_paso?.length ?? 0) > 0 ? (
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
              {value.derechos_de_paso!.length}{" "}
              {value.derechos_de_paso!.length === 1 ? "registro" : "registros"}
            </span>
          ) : null
        }
      >
        {(value.derechos_de_paso ?? []).length === 0 ? (
          <DashedAdd onClick={addDerecho} label="Agregar derecho de paso" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {(value.derechos_de_paso ?? []).map((d, idx) => (
              <DerechoRow
                key={idx}
                index={idx}
                derecho={d}
                derechos={derechos}
                loading={loadingDer}
                onUpdate={patch => updateDerecho(idx, patch)}
                onRemove={() => removeDerecho(idx)}
              />
            ))}
            <DashedAdd onClick={addDerecho} label="Agregar otro derecho de paso" />
          </div>
        )}
      </CardGroup>

      {/* ── Carros del tren ── */}
      <CardGroup
        title="Carros del tren"
        subtitle="Mínimo 1 carro. Cada carro puede llevar contenedores."
        rightHeader={
          value.carros.length > 0 ? (
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
              {value.carros.length} {value.carros.length === 1 ? "carro" : "carros"}
            </span>
          ) : null
        }
      >
        {value.carros.length === 0 ? (
          <EmptyCarros onAdd={addCarro} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {value.carros.map((c, cIdx) => (
              <CarroCard
                key={cIdx}
                index={cIdx}
                carro={c}
                tiposCarro={tiposCarro}
                loadingTipos={loadingTC}
                onUpdate={patch => updateCarro(cIdx, patch)}
                onRemove={() => removeCarro(cIdx)}
                onAddContenedor={() => addContenedor(cIdx)}
                onUpdateContenedor={(contIdx, patch) => updateContenedor(cIdx, contIdx, patch)}
                onRemoveContenedor={contIdx => removeContenedor(cIdx, contIdx)}
              />
            ))}
            <DashedAdd onClick={addCarro} label="Agregar otro carro" />
          </div>
        )}
      </CardGroup>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty state — sin carros
// ─────────────────────────────────────────────────────────────
function EmptyCarros({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{
      padding: "28px 16px",
      borderRadius: "var(--radius-md)",
      border: "1px dashed var(--color-border)",
      background: "var(--color-bg-base)",
      textAlign: "center",
    }}>
      <div style={{
        width: "40px",
        height: "40px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-bg-subtle)",
        margin: "0 auto 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
          <path d="M4 15.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V5c0-3.5-3.58-4-8-4s-8 .5-8 4v10.5z" />
          <circle cx="7.5" cy="15.5" r="1.5" />
          <circle cx="16.5" cy="15.5" r="1.5" />
        </svg>
      </div>
      <div style={{
        fontSize: "12px",
        color: "var(--color-text-second)",
        marginBottom: "10px",
      }}>
        Sin carros registrados
      </div>
      <button
        type="button"
        onClick={onAdd}
        style={{
          padding: "8px 14px",
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
        Agregar primer carro
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Row de derecho de paso
// ─────────────────────────────────────────────────────────────
function DerechoRow({
  index,
  derecho,
  derechos,
  loading,
  onUpdate,
  onRemove,
}: {
  index: number;
  derecho: DerechoDePaso;
  derechos: { code: string; label: string }[];
  loading: boolean;
  onUpdate: (patch: Partial<DerechoDePaso>) => void;
  onRemove: () => void;
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "auto 1fr 1fr auto",
      gap: "10px",
      alignItems: "end",
      padding: "10px 12px",
      borderRadius: "var(--radius-md)",
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
    }}>
      <div style={IndexBadgeStyle}>{index + 1}</div>
      <FieldS label="Tipo de derecho" required>
        <select
          value={derecho.tipo_derecho_de_paso}
          onChange={e => onUpdate({ tipo_derecho_de_paso: e.target.value })}
          disabled={loading}
          style={INPUT}
        >
          <option value="">{loading ? "Cargando..." : "Selecciona..."}</option>
          {derechos.map(r => (
            <option key={r.code} value={r.code}>
              {r.code} — {r.label}
            </option>
          ))}
        </select>
      </FieldS>
      <FieldS label="Kilometraje pagado" required>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <input
            type="number"
            min="0"
            step="0.001"
            value={derecho.kilometraje_pagado || ""}
            onChange={e => onUpdate({ kilometraje_pagado: parseFloat(e.target.value) || 0 })}
            placeholder="0.000"
            style={{
              ...INPUT,
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
            }}
          />
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>km</span>
        </div>
      </FieldS>
      <button type="button" onClick={onRemove} title="Quitar" style={DeleteBtnStyle}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card de carro (con contenedores anidados)
// ─────────────────────────────────────────────────────────────
function CarroCard({
  index,
  carro,
  tiposCarro,
  loadingTipos,
  onUpdate,
  onRemove,
  onAddContenedor,
  onUpdateContenedor,
  onRemoveContenedor,
}: {
  index: number;
  carro: CarroFerroviario;
  tiposCarro: { code: string; label: string }[];
  loadingTipos: boolean;
  onUpdate: (patch: Partial<CarroFerroviario>) => void;
  onRemove: () => void;
  onAddContenedor: () => void;
  onUpdateContenedor: (contIdx: number, patch: Partial<ContenedorFerroviario>) => void;
  onRemoveContenedor: (contIdx: number) => void;
}) {
  const numContenedores = (carro.contenedores ?? []).length;

  return (
    <div style={{
      borderRadius: "var(--radius-md)",
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      overflow: "hidden",
    }}>
      {/* Header del carro */}
      <div style={{
        padding: "10px 14px",
        background: "var(--color-bg-subtle)",
        borderBottom: "1px solid var(--color-border-faint)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "10px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "26px",
            height: "26px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-brand-blue-light)",
            border: "1px solid var(--color-brand-blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--color-brand-blue)",
            fontVariantNumeric: "tabular-nums",
          }}>
            {index + 1}
          </div>
          <span style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}>
            Carro {index + 1}
          </span>
          {numContenedores > 0 && (
            <span style={{
              fontSize: "10px",
              fontWeight: 600,
              padding: "1px 6px",
              borderRadius: "10px",
              background: "var(--color-brand-blue-light)",
              color: "var(--color-brand-blue)",
            }}>
              {numContenedores} {numContenedores === 1 ? "contenedor" : "contenedores"}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          style={{
            padding: "4px 10px",
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
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
          Quitar carro
        </button>
      </div>

      {/* Datos del carro */}
      <div style={{ padding: "12px 14px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "10px",
        }}>
          <FieldS label="Tipo de carro" required>
            <select
              value={carro.tipo_carro}
              onChange={e => onUpdate({ tipo_carro: e.target.value })}
              disabled={loadingTipos}
              style={INPUT}
            >
              <option value="">{loadingTipos ? "Cargando..." : "Selecciona..."}</option>
              {tiposCarro.map(t => (
                <option key={t.code} value={t.code}>
                  {t.code} — {t.label}
                </option>
              ))}
            </select>
          </FieldS>
          <FieldS label="Matrícula del carro" required>
            <input
              type="text"
              value={carro.matricula_carro}
              onChange={e => onUpdate({ matricula_carro: e.target.value.toUpperCase() })}
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
          <FieldS label="Guía del carro" required>
            <input
              type="text"
              value={carro.guia_carro}
              onChange={e => onUpdate({ guia_carro: e.target.value })}
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
          <FieldS label="Toneladas netas" required>
            <input
              type="number"
              min="0"
              step="0.001"
              value={carro.toneladas_netas_carro || ""}
              onChange={e => onUpdate({ toneladas_netas_carro: parseFloat(e.target.value) || 0 })}
              placeholder="0.000"
              style={{
                ...INPUT,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            />
          </FieldS>
        </div>

        {/* Contenedores del carro */}
        <div style={{
          marginTop: "14px",
          paddingTop: "12px",
          borderTop: "1px solid var(--color-border-faint)",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}>
            <div style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}>
              Contenedores en este carro
            </div>
          </div>

          {(carro.contenedores ?? []).map((cont, contIdx) => (
            <ContenedorRow
              key={contIdx}
              index={contIdx}
              contenedor={cont}
              onUpdate={patch => onUpdateContenedor(contIdx, patch)}
              onRemove={() => onRemoveContenedor(contIdx)}
            />
          ))}

          <button
            type="button"
            onClick={onAddContenedor}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "var(--radius-md)",
              border: "1px dashed var(--color-border)",
              background: "transparent",
              color: "var(--color-text-muted)",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              marginTop: numContenedores > 0 ? "8px" : "0",
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {numContenedores === 0 ? "Agregar contenedor" : "Agregar otro contenedor"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Row de contenedor dentro de un carro
// ─────────────────────────────────────────────────────────────
function ContenedorRow({
  index,
  contenedor,
  onUpdate,
  onRemove,
}: {
  index: number;
  contenedor: ContenedorFerroviario;
  onUpdate: (patch: Partial<ContenedorFerroviario>) => void;
  onRemove: () => void;
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "auto 1fr 1fr 1fr auto",
      gap: "8px",
      alignItems: "end",
      padding: "8px 10px",
      borderRadius: "var(--radius-md)",
      background: "var(--color-bg-subtle)",
      border: "1px solid var(--color-border-faint)",
      marginBottom: "6px",
    }}>
      <div style={{
        ...IndexBadgeStyle,
        width: "22px",
        height: "22px",
        fontSize: "10px",
      }}>
        {index + 1}
      </div>
      <FieldS label="Tipo">
        <input
          type="text"
          value={contenedor.tipo_contenedor}
          onChange={e => onUpdate({ tipo_contenedor: e.target.value })}
          placeholder="40' HC"
          style={{ ...INPUT, height: "32px", fontSize: "12px" }}
        />
      </FieldS>
      <FieldS label="Guía">
        <input
          type="text"
          value={contenedor.guia_contenedor}
          onChange={e => onUpdate({ guia_contenedor: e.target.value })}
          style={{ ...INPUT, height: "32px", fontSize: "12px", fontFamily: "monospace" }}
        />
      </FieldS>
      <FieldS label="Placa VM">
        <input
          type="text"
          value={contenedor.placa_vm ?? ""}
          onChange={e => onUpdate({ placa_vm: e.target.value || undefined })}
          style={{ ...INPUT, height: "32px", fontSize: "12px", fontFamily: "monospace" }}
        />
      </FieldS>
      <button
        type="button"
        onClick={onRemove}
        title="Quitar contenedor"
        style={{
          ...DeleteBtnStyle,
          padding: "6px",
          marginBottom: "1px",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers de UI compartidos
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

const GRID2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "10px",
};

const IndexBadgeStyle: React.CSSProperties = {
  width: "26px",
  height: "26px",
  borderRadius: "var(--radius-md)",
  background: "var(--color-bg-subtle)",
  border: "1px solid var(--color-border-faint)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--color-text-second)",
  fontVariantNumeric: "tabular-nums",
  marginBottom: "2px",
  flexShrink: 0,
};

const DeleteBtnStyle: React.CSSProperties = {
  padding: "8px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-danger-border)",
  background: "var(--color-danger-bg)",
  color: "var(--color-danger-text)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "2px",
};

function CardGroup({
  title,
  subtitle,
  rightHeader,
  children,
}: {
  title: string;
  subtitle?: string;
  rightHeader?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: "var(--radius-md)",
      background: "var(--color-bg-subtle)",
      border: "1px solid var(--color-border-faint)",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "12px",
        gap: "12px",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--color-text-primary)",
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontSize: "11px",
              color: "var(--color-text-muted)",
              marginTop: "2px",
              lineHeight: 1.5,
            }}>
              {subtitle}
            </div>
          )}
        </div>
        {rightHeader}
      </div>
      {children}
    </div>
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

function DashedAdd({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
      {label}
    </button>
  );
}
