"use client";

// ═══════════════════════════════════════════════════════════════════════
// DatosGeneralesSection — Sección 1 del drawer Carta Porte 3.1
// 
// Captura los datos generales del CCP:
//   - Modos de transporte usados (multi-select)
//   - Si es transporte internacional (Sí/No)
//   - Datos internacionales si aplica
//   - Distancia total recorrida
// 
// Los selects de país y vía consumen catálogos SAT vía endpoint API
// con cache automático (useSATCatalog).
// ═══════════════════════════════════════════════════════════════════════

import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type {
  CartaPorteData,
  CartaPorteParentType,
  ModoTransporteCode,
} from "../../types/carta_porte.types";
import type { ValidationError } from "../../types/carta_porte.validations";

// ─── Metadata visual de los modos de transporte ───
type ModoInfoEntry = {
  label: string;
  iconPath: string;
  desc: string;
  color: string;
};

type ColorClassEntry = {
  bg: string;
  border: string;
  text: string;
  iconBg: string;
};

const MODO_INFO: Record<ModoTransporteCode, ModoInfoEntry> = {
  "04": {
    label: "Autotransporte",
    desc: "Camiones y vehículos terrestres",
    color: "blue",
    iconPath:
      "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 110-5 2.5 2.5 0 010 5zM18.5 21a2.5 2.5 0 110-5 2.5 2.5 0 010 5z",
  },
  "01": {
    label: "Marítimo",
    desc: "Embarcaciones y barcos",
    color: "cyan",
    iconPath:
      "M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M19.38 20A11.6 11.6 0 0021 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76M19 13V7a2 2 0 00-2-2H7a2 2 0 00-2 2v6M12 10v4M2 20h20",
  },
  "02": {
    label: "Aéreo",
    desc: "Aeronaves y vuelos",
    color: "indigo",
    iconPath:
      "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z",
  },
  "03": {
    label: "Ferroviario",
    desc: "Trenes de carga",
    color: "amber",
    iconPath:
      "M4 15.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V5c0-3.5-3.58-4-8-4s-8 .5-8 4v10.5zM7.5 17a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5-7H6V5h5v5zm2 0V5h5v5h-5zm3.5 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z",
  },
};

const COLOR_CLASSES: Record<string, ColorClassEntry> = {
  blue:   { bg: "bg-blue-600/15",   border: "border-blue-500",   text: "text-blue-100",   iconBg: "text-blue-400" },
  cyan:   { bg: "bg-cyan-600/15",   border: "border-cyan-500",   text: "text-cyan-100",   iconBg: "text-cyan-400" },
  indigo: { bg: "bg-indigo-600/15", border: "border-indigo-500", text: "text-indigo-100", iconBg: "text-indigo-400" },
  amber:  { bg: "bg-amber-600/15",  border: "border-amber-500",  text: "text-amber-100",  iconBg: "text-amber-400" },
};

interface Props {
  data: CartaPorteData;
  updateHeader: (patch: Partial<CartaPorteData["header"]>) => void;
  parentType: CartaPorteParentType;
  showValidation: boolean;
  errors: ValidationError[];
}

export function DatosGeneralesSection({
  data,
  updateHeader,
  parentType,
  showValidation,
  errors,
}: Props) {
  // Catálogos cargados desde BD (cache automático)
  const { items: vias,  loading: loadingVias }  = useSATCatalog("vias_transporte");
  const { items: paises, loading: loadingPaises } = useSATCatalog("paises_comunes");

  const isInternacional = data.header.transp_internac === "Sí";

  const toggleModo = (modo: ModoTransporteCode) => {
    const current = data.header.modos_transporte;
    const next = current.includes(modo)
      ? current.filter(m => m !== modo)
      : [...current, modo];
    updateHeader({ modos_transporte: next });
  };

  const fieldHasError = (field: string) =>
    showValidation && errors.some(e => e.field === field);

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── Banner del tipo de CFDI base ── */}
      <div className="bg-gradient-to-br from-blue-950/40 to-indigo-950/40 border border-blue-800/40 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">
              {parentType === "factura_carta_porte"
                ? "CFDI Tipo I (Ingreso) + Carta Porte 3.1"
                : "CFDI Tipo T (Traslado) + Carta Porte 3.1"}
            </p>
            <p className="text-xs text-blue-200/80 mt-1 leading-relaxed">
              {parentType === "factura_carta_porte"
                ? "Para emitir cuando cobras al cliente por el servicio de transporte. La factura tiene valor comercial y el complemento describe el traslado físico."
                : "Para emitir cuando trasladas mercancía (propia o de un cliente) sin generar valor comercial. Sin pago, solo registro del movimiento."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Modos de transporte ── */}
      <section>
        <SectionHeader
          title="Modos de transporte"
          subtitle="Selecciona uno o más. Si la mercancía cambia de medio durante el viaje, marca todos los aplicables."
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(["04", "01", "02", "03"] as ModoTransporteCode[]).map(modo => {
            const isSelected = data.header.modos_transporte.includes(modo);
            const info = MODO_INFO[modo];
            const colors = COLOR_CLASSES[info.color];

            return (
              <button
                key={modo}
                type="button"
                onClick={() => toggleModo(modo)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition text-left ${
                  isSelected
                    ? `${colors.bg} ${colors.border} ${colors.text}`
                    : "bg-slate-800/40 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800/70"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-white/10" : "bg-slate-700/50"
                }`}>
                  <svg
                    className={`w-5 h-5 ${isSelected ? colors.iconBg : "text-slate-400"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d={info.iconPath}
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{info.label}</div>
                  <div className="text-xs text-slate-400 truncate">{info.desc}</div>
                </div>
                {isSelected && (
                  <svg className={`w-5 h-5 shrink-0 ${colors.iconBg}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
        {fieldHasError("modos_transporte") && (
          <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Selecciona al menos un modo de transporte
          </p>
        )}
      </section>

      {/* ── Internacional ── */}
      <section>
        <SectionHeader
          title="Tipo de operación"
          subtitle="¿La mercancía cruza fronteras del país?"
        />
        <div className="grid grid-cols-2 gap-2 max-w-md">
          <button
            type="button"
            onClick={() =>
              updateHeader({
                transp_internac: "No",
                entrada_salida_merc: undefined,
                pais_origen_destino: undefined,
                via_entrada_salida: undefined,
              })
            }
            className={`p-3 rounded-lg border transition text-sm font-medium ${
              !isInternacional
                ? "bg-emerald-600/15 border-emerald-500 text-emerald-100"
                : "bg-slate-800/40 border-slate-700 text-slate-300 hover:border-slate-600"
            }`}
          >
            Nacional (México)
          </button>
          <button
            type="button"
            onClick={() => updateHeader({ transp_internac: "Sí" })}
            className={`p-3 rounded-lg border transition text-sm font-medium ${
              isInternacional
                ? "bg-orange-600/15 border-orange-500 text-orange-100"
                : "bg-slate-800/40 border-slate-700 text-slate-300 hover:border-slate-600"
            }`}
          >
            Internacional
          </button>
        </div>
      </section>

      {/* ── Datos internacionales (condicional) ── */}
      {isInternacional && (
        <section className="bg-orange-950/20 border border-orange-800/30 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
            <h4 className="text-sm font-semibold text-orange-100">Datos internacionales</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Entrada / Salida */}
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-2">
                Operación <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 max-w-md">
                <button
                  type="button"
                  onClick={() => updateHeader({ entrada_salida_merc: "Entrada" })}
                  className={`p-2.5 rounded-lg border text-sm font-medium transition ${
                    data.header.entrada_salida_merc === "Entrada"
                      ? "bg-emerald-600/20 border-emerald-500 text-emerald-100"
                      : "bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  Entrada (Importación)
                </button>
                <button
                  type="button"
                  onClick={() => updateHeader({ entrada_salida_merc: "Salida" })}
                  className={`p-2.5 rounded-lg border text-sm font-medium transition ${
                    data.header.entrada_salida_merc === "Salida"
                      ? "bg-blue-600/20 border-blue-500 text-blue-100"
                      : "bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  Salida (Exportación)
                </button>
              </div>
              {fieldHasError("entrada_salida_merc") && (
                <p className="text-xs text-red-400 mt-1">Selecciona Entrada o Salida</p>
              )}
            </div>

            {/* País origen/destino */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                País{" "}
                {data.header.entrada_salida_merc === "Entrada"
                  ? "de origen"
                  : data.header.entrada_salida_merc === "Salida"
                  ? "de destino"
                  : ""}{" "}
                <span className="text-red-400">*</span>
              </label>
              <select
                value={data.header.pais_origen_destino ?? ""}
                onChange={e => updateHeader({ pais_origen_destino: e.target.value || undefined })}
                disabled={loadingPaises}
                className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                  fieldHasError("pais_origen_destino") ? "border-red-500" : "border-slate-700"
                }`}
              >
                <option value="">{loadingPaises ? "Cargando..." : "Selecciona país..."}</option>
                {paises
                  .filter(p => p.code !== "MEX")
                  .map(p => (
                    <option key={p.code} value={p.code}>
                      {p.label}
                    </option>
                  ))}
              </select>
            </div>

            {/* Vía de entrada/salida */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Vía de entrada/salida <span className="text-red-400">*</span>
              </label>
              <select
                value={data.header.via_entrada_salida ?? ""}
                onChange={e => updateHeader({ via_entrada_salida: e.target.value || undefined })}
                disabled={loadingVias}
                className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                  fieldHasError("via_entrada_salida") ? "border-red-500" : "border-slate-700"
                }`}
              >
                <option value="">{loadingVias ? "Cargando..." : "Selecciona vía..."}</option>
                {vias.map(v => (
                  <option key={v.code} value={v.code}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      )}

      {/* ── Distancia total ── */}
      <section>
        <SectionHeader
          title="Distancia total recorrida"
          subtitle="Suma en kilómetros de todas las distancias entre ubicaciones del trayecto."
          required
        />
        <div className="flex items-center gap-2 max-w-xs">
          <input
            type="number"
            min="0"
            step="0.001"
            value={data.header.total_dist_rec || ""}
            onChange={e =>
              updateHeader({ total_dist_rec: parseFloat(e.target.value) || 0 })
            }
            placeholder="0.000"
            className={`flex-1 px-3 py-2 bg-slate-800 border rounded-lg text-white text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
              fieldHasError("total_dist_rec") ? "border-red-500" : "border-slate-700"
            }`}
          />
          <span className="text-slate-400 text-sm font-medium px-2">km</span>
        </div>
        {fieldHasError("total_dist_rec") && (
          <p className="text-xs text-red-400 mt-1">La distancia debe ser mayor a 0</p>
        )}
      </section>

      {/* ── Resumen en vivo ── */}
      <section className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
        <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-3">
          Resumen de esta sección
        </h4>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500 text-xs">Tipo de operación</dt>
            <dd className="text-white mt-0.5">
              {isInternacional ? (
                <span className="text-orange-300">
                  Internacional ·{" "}
                  {data.header.entrada_salida_merc === "Entrada"
                    ? "Importación"
                    : data.header.entrada_salida_merc === "Salida"
                    ? "Exportación"
                    : "—"}
                </span>
              ) : (
                <span className="text-emerald-300">Nacional</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">Modos seleccionados</dt>
            <dd className="text-white mt-0.5">
              {data.header.modos_transporte.length === 0
                ? "—"
                : data.header.modos_transporte
                    .map(m => MODO_INFO[m].label)
                    .join(", ")}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-500 text-xs">Distancia total</dt>
            <dd className="text-white mt-0.5 tabular-nums">
              {data.header.total_dist_rec.toLocaleString("es-MX", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 3,
              })}{" "}
              km
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helper: Encabezado de subsección
// ─────────────────────────────────────────────────────────────
function SectionHeader({
  title,
  subtitle,
  required,
}: {
  title: string;
  subtitle?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-white flex items-center gap-1">
        {title}
        {required && <span className="text-red-400">*</span>}
      </h3>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}
