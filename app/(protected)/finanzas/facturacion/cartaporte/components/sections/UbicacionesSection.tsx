"use client";

// ═══════════════════════════════════════════════════════════════════════
// UbicacionesSection — Sección 2 del drawer Carta Porte 3.1
//
// Captura:
// - 1 o más Origenes (típicamente 1)
// - 1 o más Destinos
// - Cada ubicación con su domicilio completo
// - RFC + nombre del remitente/destinatario
// - Fecha y hora de salida/llegada
// - Distancia recorrida (solo en destinos)
//
// UX: Cards plegables. Expandes solo la que estás editando.
// ═══════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type {
  CartaPorteData,
  CartaPorteUbicacion,
  TipoUbicacion,
} from "../../types/carta_porte.types";
import { newUbicacion } from "../../types/carta_porte.defaults";
import type { ValidationError } from "../../types/carta_porte.validations";

interface Props {
  data: CartaPorteData;
  setUbicaciones: (next: CartaPorteUbicacion[]) => void;
  showValidation: boolean;
  errors: ValidationError[];
}

export function UbicacionesSection({
  data,
  setUbicaciones,
  showValidation,
  errors,
}: Props) {
  // Por defecto, expandir solo la primera ubicación
  const [expandedId, setExpandedId] = useState<string | null>(
    data.ubicaciones[0]?._temp_id ?? null
  );

  // ─── Operaciones sobre el array ───
  const updateUbicacion = (
    tempId: string,
    patch: Partial<CartaPorteUbicacion>
  ) => {
    setUbicaciones(
      data.ubicaciones.map(u =>
        u._temp_id === tempId ? { ...u, ...patch } : u
      )
    );
  };

  const updateDomicilio = (
    tempId: string,
    patch: Partial<CartaPorteUbicacion["domicilio"]>
  ) => {
    setUbicaciones(
      data.ubicaciones.map(u =>
        u._temp_id === tempId
          ? { ...u, domicilio: { ...u.domicilio, ...patch } }
          : u
      )
    );
  };

  const addUbicacion = (tipo: TipoUbicacion) => {
    const nueva = newUbicacion(tipo);
    setUbicaciones([...data.ubicaciones, nueva]);
    setExpandedId(nueva._temp_id);
  };

  const removeUbicacion = (tempId: string) => {
    setUbicaciones(data.ubicaciones.filter(u => u._temp_id !== tempId));
    if (expandedId === tempId) setExpandedId(null);
  };

  // Cantidad de errores por ubicación (para mostrar badge en card colapsada)
  const errorsByUbicacion = (idx: number): number =>
    showValidation
      ? errors.filter(e => e.field.includes(`ubicaciones[${idx}]`)).length
      : 0;

  const origenes = data.ubicaciones.filter(u => u.tipo_ubicacion === "Origen");
  const destinos = data.ubicaciones.filter(u => u.tipo_ubicacion === "Destino");

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Banner explicativo ── */}
      <div className="bg-gradient-to-br from-indigo-950/40 to-blue-950/40 border border-indigo-800/40 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 text-sm text-indigo-100/90 leading-relaxed">
            Define el <strong className="text-white">trayecto físico</strong> de la mercancía:
            de dónde sale (Origen) y a dónde llega (Destino). Cada destino debe indicar la
            distancia recorrida desde la ubicación anterior.
          </div>
        </div>
      </div>

      {/* ══════ ORÍGENES ══════ */}
      <section>
        <SectionHeader
          icon="origen"
          title="Origen"
          subtitle="Punto de salida del trayecto"
          count={origenes.length}
        />
        <div className="space-y-2">
          {origenes.map((u, _idx) => {
            const idx = data.ubicaciones.findIndex(x => x._temp_id === u._temp_id);
            return (
              <UbicacionCard
                key={u._temp_id}
                ubicacion={u}
                indexGlobal={idx}
                isExpanded={expandedId === u._temp_id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === u._temp_id ? null : u._temp_id)
                }
                onUpdate={patch => updateUbicacion(u._temp_id, patch)}
                onUpdateDomicilio={patch => updateDomicilio(u._temp_id, patch)}
                onRemove={origenes.length > 1 ? () => removeUbicacion(u._temp_id) : undefined}
                showValidation={showValidation}
                errorCount={errorsByUbicacion(idx)}
                allUbicaciones={data.ubicaciones}
              />
            );
          })}
          <button
            type="button"
            onClick={() => addUbicacion("Origen")}
            className="w-full py-2.5 text-sm border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar otro origen
          </button>
        </div>
      </section>

      {/* ══════ DESTINOS ══════ */}
      <section>
        <SectionHeader
          icon="destino"
          title="Destino(s)"
          subtitle="Punto(s) de llegada del trayecto"
          count={destinos.length}
        />
        <div className="space-y-2">
          {destinos.map((u, _idx) => {
            const idx = data.ubicaciones.findIndex(x => x._temp_id === u._temp_id);
            return (
              <UbicacionCard
                key={u._temp_id}
                ubicacion={u}
                indexGlobal={idx}
                isExpanded={expandedId === u._temp_id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === u._temp_id ? null : u._temp_id)
                }
                onUpdate={patch => updateUbicacion(u._temp_id, patch)}
                onUpdateDomicilio={patch => updateDomicilio(u._temp_id, patch)}
                onRemove={destinos.length > 1 ? () => removeUbicacion(u._temp_id) : undefined}
                showValidation={showValidation}
                errorCount={errorsByUbicacion(idx)}
                allUbicaciones={data.ubicaciones}
              />
            );
          })}
          <button
            type="button"
            onClick={() => addUbicacion("Destino")}
            className="w-full py-2.5 text-sm border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-blue-300 hover:border-blue-500/50 hover:bg-blue-950/20 transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar otro destino
          </button>
        </div>
      </section>

      {/* ── Resumen de distancias ── */}
      <section className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
        <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-3">
          Resumen del trayecto
        </h4>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-slate-500 text-xs">Total ubicaciones</div>
            <div className="text-white mt-0.5 text-base font-semibold tabular-nums">
              {data.ubicaciones.length}
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-xs">Suma distancias capturadas</div>
            <div className="text-white mt-0.5 text-base font-semibold tabular-nums">
              {destinos
                .reduce((acc, u) => acc + (u.distancia_recorrida ?? 0), 0)
                .toLocaleString("es-MX", { maximumFractionDigits: 3 })}{" "}
              km
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-xs">Total declarado en Datos Generales</div>
            <div className="text-white mt-0.5 text-base font-semibold tabular-nums">
              {data.header.total_dist_rec.toLocaleString("es-MX", {
                maximumFractionDigits: 3,
              })}{" "}
              km
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card de una ubicación (plegable)
// ─────────────────────────────────────────────────────────────
interface UbicacionCardProps {
  ubicacion: CartaPorteUbicacion;
  indexGlobal: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (patch: Partial<CartaPorteUbicacion>) => void;
  onUpdateDomicilio: (patch: Partial<CartaPorteUbicacion["domicilio"]>) => void;
  onRemove?: () => void;
  showValidation: boolean;
  errorCount: number;
  allUbicaciones: CartaPorteUbicacion[];
}

function UbicacionCard({
  ubicacion,
  indexGlobal,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onUpdateDomicilio,
  onRemove,
  showValidation,
  errorCount,
  allUbicaciones,
}: UbicacionCardProps) {
  const { items: estados, loading: loadingEstados } = useSATCatalog("estados_mexico");
  const { items: paises, loading: loadingPaises } = useSATCatalog("paises_comunes");

  const isOrigen = ubicacion.tipo_ubicacion === "Origen";
  const accentColor = isOrigen ? "emerald" : "blue";

  // Ordinal del Origen/Destino dentro de su grupo
  const sameTypeList = allUbicaciones.filter(
    u => u.tipo_ubicacion === ubicacion.tipo_ubicacion
  );
  const ordinal = sameTypeList.findIndex(u => u._temp_id === ubicacion._temp_id) + 1;

  // Resumen para el header colapsado
  const headerSummary = [
    ubicacion.rfc_remitente_destinatario || "RFC pendiente",
    ubicacion.domicilio.codigo_postal && `CP ${ubicacion.domicilio.codigo_postal}`,
    ubicacion.domicilio.estado,
  ]
    .filter(Boolean)
    .join(" · ");

  const fieldHasError = (suffix: string) =>
    showValidation &&
    errorCount > 0 &&
    // No tenemos errores específicos por field (vienen como ubicaciones[N].xxx)
    // así que solo marcamos cuando el card tiene errores generales y el field está vacío
    false;

  return (
    <div
      className={`bg-slate-800/30 border rounded-xl overflow-hidden transition ${
        isExpanded
          ? `border-${accentColor}-500/50`
          : errorCount > 0
          ? "border-red-500/40"
          : "border-slate-700"
      }`}
    >
      {/* ── Header del card (siempre visible) ── */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-800/50 transition text-left"
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isOrigen ? "bg-emerald-600/20" : "bg-blue-600/20"
          }`}
        >
          <span className={`text-xs font-bold ${isOrigen ? "text-emerald-400" : "text-blue-400"}`}>
            {isOrigen ? "OR" : "DE"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white">
              {ubicacion.tipo_ubicacion} {ordinal}
            </span>
            {ubicacion.nombre_remitente_destinatario && (
              <span className="text-xs text-slate-400 truncate">
                · {ubicacion.nombre_remitente_destinatario}
              </span>
            )}
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

      {/* ── Body (solo si está expandida) ── */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-slate-700/50">
          {/* ── Datos del remitente / destinatario ── */}
          <div>
            <h5 className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-2 mt-3">
              {isOrigen ? "Remitente" : "Destinatario"}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label required>Nombre / Razón social</Label>
                <input
                  type="text"
                  value={ubicacion.nombre_remitente_destinatario ?? ""}
                  onChange={e => onUpdate({ nombre_remitente_destinatario: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Ej: Mobility Marine S.A. de C.V."
                />
              </div>
              <div>
                <Label required>RFC</Label>
                <input
                  type="text"
                  value={ubicacion.rfc_remitente_destinatario}
                  onChange={e => onUpdate({ rfc_remitente_destinatario: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="ABC850101XXX"
                  maxLength={13}
                />
              </div>
              <div>
                <Label>Núm. registro tributario (extranjero)</Label>
                <input
                  type="text"
                  value={ubicacion.num_reg_id_trib ?? ""}
                  onChange={e => onUpdate({ num_reg_id_trib: e.target.value || undefined })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Solo si es residente extranjero"
                />
              </div>
            </div>
          </div>

          {/* ── Fecha/Hora + distancia (solo destino) ── */}
          <div>
            <h5 className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-2">
              Tiempo y trayecto
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label required>
                  Fecha y hora de {isOrigen ? "salida" : "llegada"}
                </Label>
                <input
                  type="datetime-local"
                  value={ubicacion.fecha_hora_salida_llegada.slice(0, 16)}
                  onChange={e => onUpdate({ fecha_hora_salida_llegada: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              {!isOrigen && (
                <div>
                  <Label required>Distancia recorrida (km)</Label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={ubicacion.distancia_recorrida ?? ""}
                    onChange={e =>
                      onUpdate({ distancia_recorrida: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="0.000"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Domicilio completo ── */}
          <div>
            <h5 className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-2">
              Domicilio
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Calle */}
              <div className="md:col-span-2">
                <Label>Calle</Label>
                <input
                  type="text"
                  value={ubicacion.domicilio.calle ?? ""}
                  onChange={e => onUpdateDomicilio({ calle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Ej: Av. Insurgentes Sur"
                />
              </div>
              {/* Núm exterior */}
              <div>
                <Label>Núm. exterior</Label>
                <input
                  type="text"
                  value={ubicacion.domicilio.numero_exterior ?? ""}
                  onChange={e => onUpdateDomicilio({ numero_exterior: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="123"
                />
              </div>
              {/* Núm interior */}
              <div>
                <Label>Núm. interior</Label>
                <input
                  type="text"
                  value={ubicacion.domicilio.numero_interior ?? ""}
                  onChange={e => onUpdateDomicilio({ numero_interior: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="A, B, 4"
                />
              </div>
              {/* Colonia */}
              <div>
                <Label>Colonia</Label>
                <input
                  type="text"
                  value={ubicacion.domicilio.colonia ?? ""}
                  onChange={e => onUpdateDomicilio({ colonia: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Ej: Roma Norte"
                />
              </div>
              {/* Localidad */}
              <div>
                <Label>Localidad</Label>
                <input
                  type="text"
                  value={ubicacion.domicilio.localidad ?? ""}
                  onChange={e => onUpdateDomicilio({ localidad: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Opcional"
                />
              </div>
              {/* Municipio */}
              <div>
                <Label>Municipio / Alcaldía</Label>
                <input
                  type="text"
                  value={ubicacion.domicilio.municipio ?? ""}
                  onChange={e => onUpdateDomicilio({ municipio: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Ej: Cuauhtémoc"
                />
              </div>
              {/* CP */}
              <div>
                <Label required>Código postal</Label>
                <input
                  type="text"
                  value={ubicacion.domicilio.codigo_postal}
                  onChange={e =>
                    onUpdateDomicilio({
                      codigo_postal: e.target.value.replace(/\D/g, "").slice(0, 5),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="06700"
                  maxLength={5}
                />
              </div>
              {/* Estado */}
              <div>
                <Label required>Estado</Label>
                {ubicacion.domicilio.pais === "MEX" ? (
                  <select
                    value={ubicacion.domicilio.estado}
                    onChange={e => onUpdateDomicilio({ estado: e.target.value })}
                    disabled={loadingEstados}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">{loadingEstados ? "Cargando..." : "Selecciona estado..."}</option>
                    {estados.map(s => (
                      <option key={s.code} value={s.code}>{s.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={ubicacion.domicilio.estado}
                    onChange={e => onUpdateDomicilio({ estado: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Estado/Provincia/Región"
                  />
                )}
              </div>
              {/* País */}
              <div>
                <Label required>País</Label>
                <select
                  value={ubicacion.domicilio.pais}
                  onChange={e =>
                    onUpdateDomicilio({
                      pais: e.target.value,
                      estado: e.target.value === "MEX" ? "" : ubicacion.domicilio.estado,
                    })
                  }
                  disabled={loadingPaises}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {loadingPaises ? (
                    <option value={ubicacion.domicilio.pais}>Cargando...</option>
                  ) : (
                    paises.map(p => (
                      <option key={p.code} value={p.code}>{p.label}</option>
                    ))
                  )}
                </select>
              </div>
              {/* Referencia (full width) */}
              <div className="md:col-span-3">
                <Label>Referencia (entre calles, puntos cercanos)</Label>
                <input
                  type="text"
                  value={ubicacion.domicilio.referencia ?? ""}
                  onChange={e => onUpdateDomicilio({ referencia: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Ej: entre Insurgentes y Reforma, junto al banco"
                />
              </div>
            </div>
          </div>

          {/* ── Acciones ── */}
          {onRemove && (
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
                Eliminar esta ubicación
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers de UI
// ─────────────────────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  subtitle,
  count,
}: {
  icon: "origen" | "destino";
  title: string;
  subtitle: string;
  count: number;
}) {
  const isOrigen = icon === "origen";
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isOrigen ? "bg-emerald-600/20" : "bg-blue-600/20"
          }`}
        >
          <svg
            className={`w-4 h-4 ${isOrigen ? "text-emerald-400" : "text-blue-400"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isOrigen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            )}
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <span className="text-xs text-slate-500 tabular-nums">
        {count} {count === 1 ? "registrado" : "registrados"}
      </span>
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs text-slate-400 mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}
