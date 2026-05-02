"use client";

// ═══════════════════════════════════════════════════════════════════════
// RegimenAduaneroSection — Sección 6 del drawer Carta Porte 3.1
//
// Solo aplica si transp_internac = "Sí". Para mercancía nacional muestra
// un empty state explicando que no aplica.
//
// El SAT permite múltiples regímenes en una misma operación cuando la
// mercancía tiene tratamiento mixto (parte importación definitiva,
// parte temporal, etc.). Por eso es un array.
// ═══════════════════════════════════════════════════════════════════════

import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type {
  CartaPorteData,
  RegimenAduaneroLine,
} from "../../types/carta_porte.types";
import { newRegimenAduanero } from "../../types/carta_porte.defaults";
import type { ValidationError } from "../../types/carta_porte.validations";

interface Props {
  data: CartaPorteData;
  setRegimenes: (next: RegimenAduaneroLine[] | undefined) => void;
  showValidation: boolean;
  errors: ValidationError[];
}

export function RegimenAduaneroSection({
  data,
  setRegimenes,
  showValidation,
  errors,
}: Props) {
  const { items: regimenes, loading } = useSATCatalog("regimen_aduanero");

  const isInternacional = data.header.transp_internac === "Sí";
  const lineas = data.regimenes_aduaneros ?? [];

  // ─── Operaciones ───
  const updateLinea = (tempId: string, regimen: string) => {
    setRegimenes(
      lineas.map(l => (l._temp_id === tempId ? { ...l, regimen_aduanero: regimen } : l))
    );
  };

  const addLinea = () => {
    const nueva = newRegimenAduanero();
    setRegimenes([...lineas, nueva]);
  };

  const removeLinea = (tempId: string) => {
    const next = lineas.filter(l => l._temp_id !== tempId);
    setRegimenes(next.length ? next : undefined);
  };

  // ─── Caso: operación nacional ───
  if (!isInternacional) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-emerald-600/10 border border-emerald-600/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">Régimen aduanero no aplica</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Esta operación es <strong className="text-emerald-300">nacional</strong> (no cruza
          fronteras). Solo se requiere régimen aduanero cuando el traslado es internacional.
        </p>
        <p className="text-xs text-slate-500 mt-4">
          Para activarlo, ve a <strong className="text-white">Datos Generales</strong> y
          marca la operación como Internacional.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Banner ── */}
      <div className="bg-gradient-to-br from-orange-950/40 to-amber-950/40 border border-orange-800/40 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-600/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 text-sm text-orange-100/90 leading-relaxed">
            Indica el régimen aduanero bajo el que está la mercancía. Si es una operación
            mixta (ej: parte definitiva + parte temporal), puedes agregar varios regímenes.
          </div>
        </div>
      </div>

      {/* ── Lista de regímenes ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Regímenes aduaneros aplicables
            </h3>
            <p className="text-xs text-slate-400">
              {lineas.length === 0
                ? "Mínimo 1 régimen"
                : `${lineas.length} ${lineas.length === 1 ? "registrado" : "registrados"}`}
            </p>
          </div>
          {showValidation && errors.length > 0 && (
            <span className="px-2 py-1 text-xs bg-red-600/20 text-red-300 rounded">
              {errors.length} {errors.length === 1 ? "error" : "errores"}
            </span>
          )}
        </div>

        {lineas.length === 0 ? (
          <div className="border border-dashed border-slate-600 rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto mb-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-slate-400 mb-3">Sin régimen aduanero registrado</p>
            <button
              type="button"
              onClick={addLinea}
              className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar primer régimen
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {lineas.map((linea, idx) => {
              const selected = regimenes.find(r => r.code === linea.regimen_aduanero);
              return (
                <div
                  key={linea._temp_id}
                  className="bg-slate-800/30 border border-slate-700 rounded-xl p-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-3 items-start">
                    {/* Numerador */}
                    <div className="w-8 h-8 rounded-lg bg-orange-600/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-orange-400 tabular-nums">
                        {idx + 1}
                      </span>
                    </div>

                    {/* Selector */}
                    <div className="flex-1 min-w-0">
                      <Label required>Régimen aduanero</Label>
                      <select
                        value={linea.regimen_aduanero}
                        onChange={e => updateLinea(linea._temp_id, e.target.value)}
                        disabled={loading}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                      >
                        <option value="">{loading ? "Cargando..." : "Selecciona régimen..."}</option>
                        {regimenes.map(r => (
                          <option key={r.code} value={r.code}>
                            {r.code} — {r.label}
                          </option>
                        ))}
                      </select>
                      {selected && (
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                          {selected.label}
                        </p>
                      )}
                    </div>

                    {/* Eliminar */}
                    <button
                      type="button"
                      onClick={() => removeLinea(linea._temp_id)}
                      className="px-2.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition self-end"
                      title="Eliminar régimen"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={addLinea}
              className="w-full py-2.5 text-sm border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-orange-300 hover:border-orange-500/50 hover:bg-orange-950/20 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar otro régimen
            </button>
          </div>
        )}
      </section>

      {/* ── Guía de regímenes comunes ── */}
      <section className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
        <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-3">
          Regímenes más comunes (referencia)
        </h4>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900/40 rounded-lg p-2.5">
            <dt className="font-mono text-orange-300">IMD</dt>
            <dd className="text-slate-400 mt-0.5">Importación definitiva — la mercancía permanece en el país sin retornar.</dd>
          </div>
          <div className="bg-slate-900/40 rounded-lg p-2.5">
            <dt className="font-mono text-orange-300">EXD</dt>
            <dd className="text-slate-400 mt-0.5">Exportación definitiva — la mercancía sale del país sin retornar.</dd>
          </div>
          <div className="bg-slate-900/40 rounded-lg p-2.5">
            <dt className="font-mono text-orange-300">ITR / ETR</dt>
            <dd className="text-slate-400 mt-0.5">Temporales para retornar al estado de origen sin transformación.</dd>
          </div>
          <div className="bg-slate-900/40 rounded-lg p-2.5">
            <dt className="font-mono text-orange-300">ITE / ETE</dt>
            <dd className="text-slate-400 mt-0.5">Temporales para elaboración, transformación o reparación (programas IMMEX).</dd>
          </div>
        </dl>
      </section>
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
