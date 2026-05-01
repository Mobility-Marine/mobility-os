"use client";

// ═══════════════════════════════════════════════════════════════════════
// FigurasSection — Sección 5 del drawer Carta Porte 3.1
// 
// Captura las figuras involucradas en el transporte:
//   - 01 Operador (chofer): obligatorio si modo=autotransporte
//   - 02 Propietario: si el vehículo no es del emisor
//   - 03 Arrendatario: si el vehículo está rentado
//   - 04 Notificado: parte adicional a notificar (opcional)
// 
// Cada figura tiene su propio domicilio (opcional) y los Propietarios/
// Arrendatarios pueden indicar en qué tramos del trayecto participan.
// ═══════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type {
  CartaPorteData,
  CartaPorteFigura,
  TipoFiguraCode,
} from "../../types/carta_porte.types";
import { newFigura } from "../../types/carta_porte.defaults";
import type { ValidationError } from "../../types/carta_porte.validations";

// ─── Metadata visual de los tipos de figura ───
type FiguraInfoEntry = {
  label: string;
  shortLabel: string;
  desc: string;
  color: "blue" | "emerald" | "purple" | "slate";
  iconPath: string;
};

const FIGURA_INFO: Record<TipoFiguraCode, FiguraInfoEntry> = {
  "01": {
    label: "Operador (chofer)",
    shortLabel: "Operador",
    desc: "Conductor de la unidad. Obligatorio si hay autotransporte.",
    color: "blue",
    iconPath: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
  "02": {
    label: "Propietario del vehículo",
    shortLabel: "Propietario",
    desc: "Solo si el vehículo no es del emisor del CFDI.",
    color: "emerald",
    iconPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  "03": {
    label: "Arrendatario del vehículo",
    shortLabel: "Arrendatario",
    desc: "Solo si el vehículo está rentado a un tercero.",
    color: "purple",
    iconPath: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  "04": {
    label: "Notificado",
    shortLabel: "Notificado",
    desc: "Parte adicional a notificar del traslado (opcional).",
    color: "slate",
    iconPath: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  },
};

const COLOR_CLASSES: Record<string, { bg: string; border: string; ringFocus: string; iconBg: string }> = {
  blue:    { bg: "bg-blue-600/15",    border: "border-blue-500/50",    ringFocus: "focus:ring-blue-500/50",    iconBg: "bg-blue-600/20 text-blue-400" },
  emerald: { bg: "bg-emerald-600/15", border: "border-emerald-500/50", ringFocus: "focus:ring-emerald-500/50", iconBg: "bg-emerald-600/20 text-emerald-400" },
  purple:  { bg: "bg-purple-600/15",  border: "border-purple-500/50",  ringFocus: "focus:ring-purple-500/50",  iconBg: "bg-purple-600/20 text-purple-400" },
  slate:   { bg: "bg-slate-600/15",   border: "border-slate-500/50",   ringFocus: "focus:ring-slate-500/50",   iconBg: "bg-slate-600/20 text-slate-400" },
};

interface Props {
  data: CartaPorteData;
  setFiguras: (next: CartaPorteFigura[]) => void;
  showValidation: boolean;
  errors: ValidationError[];
}

export function FigurasSection({
  data,
  setFiguras,
  showValidation,
  errors,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(
    data.figuras[0]?._temp_id ?? null
  );

  const tieneAutotransporte = data.header.modos_transporte.includes("04");

  // ─── Operaciones ───
  const updateFigura = (tempId: string, patch: Partial<CartaPorteFigura>) => {
    setFiguras(
      data.figuras.map(f => (f._temp_id === tempId ? { ...f, ...patch } : f))
    );
  };

  const updateDomicilio = (
    tempId: string,
    patch: Partial<NonNullable<CartaPorteFigura["domicilio"]>>
  ) => {
    setFiguras(
      data.figuras.map(f =>
        f._temp_id === tempId
          ? {
              ...f,
              domicilio: {
                ...(f.domicilio ?? {
                  estado: "",
                  pais: "MEX",
                  codigo_postal: "",
                }),
                ...patch,
              },
            }
          : f
      )
    );
  };

  const addFigura = (tipo: TipoFiguraCode) => {
    const nueva = newFigura(tipo);
    setFiguras([...data.figuras, nueva]);
    setExpandedId(nueva._temp_id);
  };

  const removeFigura = (tempId: string) => {
    setFiguras(data.figuras.filter(f => f._temp_id !== tempId));
    if (expandedId === tempId) setExpandedId(null);
  };

  const errorsByFigura = (idx: number): number =>
    showValidation
      ? errors.filter(e => e.field.includes(`figuras[${idx}]`)).length
      : 0;

  // Conteos por tipo (para mostrar resumen)
  const countByType = (tipo: TipoFiguraCode): number =>
    data.figuras.filter(f => f.tipo_figura === tipo).length;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Banner ── */}
      <div className="bg-gradient-to-br from-blue-950/40 to-purple-950/40 border border-blue-800/40 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 text-sm text-blue-100/90 leading-relaxed">
            Registra a las personas y empresas involucradas en el traslado.
            {tieneAutotransporte && (
              <strong className="text-white"> Con autotransporte, el operador (chofer) es obligatorio.</strong>
            )}
          </div>
        </div>
      </div>

      {/* ── Botones para agregar figura por tipo ── */}
      <section>
        <h3 className="text-sm font-semibold text-white mb-3">Agregar figura</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {(["01", "02", "03", "04"] as TipoFiguraCode[]).map(tipo => {
            const info = FIGURA_INFO[tipo];
            const colors = COLOR_CLASSES[info.color];
            const count = countByType(tipo);
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => addFigura(tipo)}
                className={`p-3 rounded-lg border bg-slate-800/40 border-slate-700 hover:${colors.border} hover:${colors.bg} transition text-left group`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-lg ${colors.iconBg} flex items-center justify-center shrink-0`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={info.iconPath} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-white">{info.shortLabel}</span>
                      {count > 0 && (
                        <span className="text-[10px] text-slate-400 bg-slate-700/60 px-1.5 rounded">
                          {count}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{info.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Lista de figuras ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Figuras registradas</h3>
            <p className="text-xs text-slate-400">
              {data.figuras.length === 0
                ? "Agrega al menos una figura"
                : `${data.figuras.length} ${data.figuras.length === 1 ? "registrada" : "registradas"}`}
            </p>
          </div>
        </div>

        {data.figuras.length === 0 ? (
          <div className="border border-dashed border-slate-600 rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto mb-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-sm text-slate-400">
              Sin figuras registradas. Selecciona arriba el tipo que quieres agregar.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.figuras.map((f, idx) => (
              <FiguraCard
                key={f._temp_id}
                figura={f}
                index={idx}
                isExpanded={expandedId === f._temp_id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === f._temp_id ? null : f._temp_id)
                }
                onUpdate={patch => updateFigura(f._temp_id, patch)}
                onUpdateDomicilio={patch => updateDomicilio(f._temp_id, patch)}
                onRemove={() => removeFigura(f._temp_id)}
                showValidation={showValidation}
                errorCount={errorsByFigura(idx)}
                ubicaciones={data.ubicaciones}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card de una figura (plegable)
// ─────────────────────────────────────────────────────────────
interface FiguraCardProps {
  figura: CartaPorteFigura;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (patch: Partial<CartaPorteFigura>) => void;
  onUpdateDomicilio: (
    patch: Partial<NonNullable<CartaPorteFigura["domicilio"]>>
  ) => void;
  onRemove: () => void;
  showValidation: boolean;
  errorCount: number;
  ubicaciones: CartaPorteData["ubicaciones"];
}

function FiguraCard({
  figura,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onUpdateDomicilio,
  onRemove,
  showValidation,
  errorCount,
  ubicaciones,
}: FiguraCardProps) {
  const { items: paises, loading: loadingPaises } = useSATCatalog("paises_comunes");
  const { items: estados, loading: loadingEstados } = useSATCatalog("estados_mexico");

  const info = FIGURA_INFO[figura.tipo_figura];
  const colors = COLOR_CLASSES[info.color];

  const isOperador = figura.tipo_figura === "01";
  const requiereParTrans = figura.tipo_figura === "02" || figura.tipo_figura === "03";

  const headerSummary = [
    figura.nombre_figura || "Sin nombre",
    figura.rfc_figura,
    isOperador && figura.num_licencia && `Licencia: ${figura.num_licencia}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const togglePartTrans = (idUbicacion: string) => {
    const current = figura.partes_transporte ?? [];
    const next = current.includes(idUbicacion)
      ? current.filter(id => id !== idUbicacion)
      : [...current, idUbicacion];
    onUpdate({ partes_transporte: next.length ? next : undefined });
  };

  return (
    <div
      className={`bg-slate-800/30 border rounded-xl overflow-hidden transition ${
        isExpanded
          ? colors.border
          : errorCount > 0
          ? "border-red-500/40"
          : "border-slate-700"
      }`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-800/50 transition text-left"
      >
        <div className={`w-8 h-8 rounded-lg ${colors.iconBg} flex items-center justify-center shrink-0`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={info.iconPath} />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white">
              {info.shortLabel}
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-700/60 px-1.5 rounded font-mono">
              Tipo {figura.tipo_figura}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5 truncate">{headerSummary}</div>
        </div>

        {errorCount > 0 && !isExpanded && (
          <span className="px-2 py-0.5 text-[11px] bg-red-600/20 text-red-300 rounded shrink-0">
            {errorCount} {errorCount === 1 ? "error" : "errores"}
          </span>
        )}

        <svg
          className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Body */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-slate-700/50">

          {/* Datos personales/empresa */}
          <div>
            <h5 className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-2 mt-3">
              Identificación
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label>Nombre / Razón social</Label>
                <input
                  type="text"
                  value={figura.nombre_figura ?? ""}
                  onChange={e => onUpdate({ nombre_figura: e.target.value || undefined })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder={isOperador ? "Ej: Juan Pérez Hernández" : "Ej: Mobility Marine S.A. de C.V."}
                />
              </div>

              <div>
                <Label>RFC</Label>
                <input
                  type="text"
                  value={figura.rfc_figura ?? ""}
                  onChange={e => onUpdate({ rfc_figura: e.target.value.toUpperCase() || undefined })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="ABC850101XXX"
                  maxLength={13}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  RFC mexicano. Si es extranjero, deja vacío y llena registro tributario.
                </p>
              </div>

              <div>
                <Label>Núm. registro tributario (extranjero)</Label>
                <input
                  type="text"
                  value={figura.num_reg_id_trib ?? ""}
                  onChange={e => onUpdate({ num_reg_id_trib: e.target.value || undefined })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Solo si es residente extranjero"
                />
              </div>

              {!isOperador && (
                <div className="md:col-span-2">
                  <Label>Residencia fiscal (país)</Label>
                  <select
                    value={figura.residencia_fiscal ?? ""}
                    onChange={e => onUpdate({ residencia_fiscal: e.target.value || undefined })}
                    disabled={loadingPaises}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">No aplica</option>
                    {paises.map(p => (
                      <option key={p.code} value={p.code}>{p.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Núm de licencia (solo operador) */}
              {isOperador && (
                <div className="md:col-span-2">
                  <Label required>Número de licencia de conducir</Label>
                  <input
                    type="text"
                    value={figura.num_licencia ?? ""}
                    onChange={e => onUpdate({ num_licencia: e.target.value || undefined })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Ej: A1234567"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Licencia federal o estatal del operador
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Domicilio (opcional) */}
          <div>
            <h5 className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-2">
              Domicilio (opcional)
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Label>Calle</Label>
                <input
                  type="text"
                  value={figura.domicilio?.calle ?? ""}
                  onChange={e => onUpdateDomicilio({ calle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <Label>Núm. exterior</Label>
                <input
                  type="text"
                  value={figura.domicilio?.numero_exterior ?? ""}
                  onChange={e => onUpdateDomicilio({ numero_exterior: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <Label>Núm. interior</Label>
                <input
                  type="text"
                  value={figura.domicilio?.numero_interior ?? ""}
                  onChange={e => onUpdateDomicilio({ numero_interior: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <Label>Colonia</Label>
                <input
                  type="text"
                  value={figura.domicilio?.colonia ?? ""}
                  onChange={e => onUpdateDomicilio({ colonia: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <Label>Municipio</Label>
                <input
                  type="text"
                  value={figura.domicilio?.municipio ?? ""}
                  onChange={e => onUpdateDomicilio({ municipio: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <Label>Código postal</Label>
                <input
                  type="text"
                  value={figura.domicilio?.codigo_postal ?? ""}
                  onChange={e =>
                    onUpdateDomicilio({
                      codigo_postal: e.target.value.replace(/\D/g, "").slice(0, 5),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  maxLength={5}
                />
              </div>
              <div>
                <Label>Estado</Label>
                {(figura.domicilio?.pais ?? "MEX") === "MEX" ? (
                  <select
                    value={figura.domicilio?.estado ?? ""}
                    onChange={e => onUpdateDomicilio({ estado: e.target.value })}
                    disabled={loadingEstados}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">{loadingEstados ? "Cargando..." : "Selecciona..."}</option>
                    {estados.map(s => (
                      <option key={s.code} value={s.code}>{s.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={figura.domicilio?.estado ?? ""}
                    onChange={e => onUpdateDomicilio({ estado: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                )}
              </div>
              <div>
                <Label>País</Label>
                <select
                  value={figura.domicilio?.pais ?? "MEX"}
                  onChange={e =>
                    onUpdateDomicilio({
                      pais: e.target.value,
                      estado: e.target.value === "MEX" ? "" : figura.domicilio?.estado ?? "",
                    })
                  }
                  disabled={loadingPaises}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {paises.map(p => (
                    <option key={p.code} value={p.code}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Partes del transporte (solo Propietario / Arrendatario) */}
          {requiereParTrans && ubicaciones.length > 0 && (
            <div>
              <h5 className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-2">
                Tramos donde participa esta figura
              </h5>
              <p className="text-[11px] text-slate-500 mb-2">
                Marca las ubicaciones del trayecto donde el {info.shortLabel.toLowerCase()} interviene.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {ubicaciones.map(u => {
                  const id = u._temp_id;
                  const isChecked = figura.partes_transporte?.includes(id) ?? false;
                  return (
                    <label
                      key={id}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                        isChecked
                          ? "bg-slate-700/40 border-slate-500"
                          : "bg-slate-800/40 border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePartTrans(id)}
                        className="mt-0.5 accent-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white font-medium">
                          {u.tipo_ubicacion} ·{" "}
                          {u.nombre_remitente_destinatario || u.rfc_remitente_destinatario || "Sin nombre"}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {u.domicilio.codigo_postal && `CP ${u.domicilio.codigo_postal} · `}
                          {u.domicilio.estado}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="pt-3 border-t border-slate-700/50 flex justify-end">
            <button
              type="button"
              onClick={onRemove}
              className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar figura
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers UI ───
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs text-slate-400 mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}
