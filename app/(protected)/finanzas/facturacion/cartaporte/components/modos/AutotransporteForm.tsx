"use client";

// ═══════════════════════════════════════════════════════════════════════
// AutotransporteForm — Datos del transporte por carretera
//
// Captura: permiso SCT, vehículo (config, peso, placa, año), seguros,
// y remolques opcionales (hasta 2).
// ═══════════════════════════════════════════════════════════════════════

import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type { Autotransporte, Remolque } from "../../types/carta_porte.types";

interface Props {
  value: Autotransporte;
  onChange: (next: Autotransporte) => void;
}

export function AutotransporteForm({ value, onChange }: Props) {
  const { items: permisos, loading: loadingPermisos } = useSATCatalog("tipo_permiso_sct");
  const { items: configs, loading: loadingConfigs } = useSATCatalog("config_autotransporte");
  const { items: subtipos, loading: loadingSubtipos } = useSATCatalog("subtipo_remolque");

  // Updaters
  const update = (patch: Partial<Autotransporte>) => onChange({ ...value, ...patch });
  const updateIdent = (patch: Partial<Autotransporte["identificacion_vehicular"]>) =>
    onChange({ ...value, identificacion_vehicular: { ...value.identificacion_vehicular, ...patch } });
  const updateSeguros = (patch: Partial<Autotransporte["seguros"]>) =>
    onChange({ ...value, seguros: { ...value.seguros, ...patch } });

  const addRemolque = () => {
    const nuevo: Remolque = { subtipo_rem: "", placa: "" };
    onChange({ ...value, remolques: [...(value.remolques ?? []), nuevo] });
  };

  const updateRemolque = (idx: number, patch: Partial<Remolque>) => {
    const list = [...(value.remolques ?? [])];
    list[idx] = { ...list[idx], ...patch };
    onChange({ ...value, remolques: list });
  };

  const removeRemolque = (idx: number) => {
    const list = [...(value.remolques ?? [])];
    list.splice(idx, 1);
    onChange({ ...value, remolques: list });
  };

  return (
    <div className="space-y-5">
      {/* ── Permiso SCT ── */}
      <CardGroup
        title="Permiso SCT"
        subtitle="Permiso de la Secretaría de Comunicaciones y Transportes"
        color="blue"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label required>Tipo de permiso SCT</Label>
            <select
              value={value.perm_sct}
              onChange={e => update({ perm_sct: e.target.value })}
              disabled={loadingPermisos}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">{loadingPermisos ? "Cargando..." : "Selecciona tipo de permiso..."}</option>
              {permisos.map(p => (
                <option key={p.code} value={p.code}>
                  {p.code} — {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label required>Número de permiso SCT</Label>
            <input
              type="text"
              value={value.num_permiso_sct}
              onChange={e => update({ num_permiso_sct: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Ej: A-12345/2024"
            />
          </div>
        </div>
      </CardGroup>

      {/* ── Identificación vehicular ── */}
      <CardGroup title="Identificación del vehículo motriz" color="blue">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label required>Configuración vehicular</Label>
            <select
              value={value.identificacion_vehicular.config_vehicular}
              onChange={e => updateIdent({ config_vehicular: e.target.value })}
              disabled={loadingConfigs}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">{loadingConfigs ? "Cargando..." : "Selecciona configuración..."}</option>
              {configs.map(c => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Indica el tipo de unidad (camión, tractocamión, articulado, etc.)
            </p>
          </div>
          <div>
            <Label required>Placa del vehículo motriz</Label>
            <input
              type="text"
              value={value.identificacion_vehicular.placa_vm}
              onChange={e => updateIdent({ placa_vm: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="ABC-123-D"
            />
          </div>
          <div>
            <Label required>Año modelo</Label>
            <input
              type="number"
              min="1900"
              max="2100"
              value={value.identificacion_vehicular.anio_modelo_vm}
              onChange={e => updateIdent({ anio_modelo_vm: parseInt(e.target.value, 10) || new Date().getFullYear() })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div className="md:col-span-2">
            <Label required>Peso bruto vehicular (toneladas)</Label>
            <input
              type="number"
              min="0"
              step="0.001"
              value={value.identificacion_vehicular.peso_bruto_vehicular || ""}
              onChange={e => updateIdent({ peso_bruto_vehicular: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="0.000"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Capacidad máxima de carga del vehículo en toneladas
            </p>
          </div>
        </div>
      </CardGroup>

      {/* ── Seguros ── */}
      <CardGroup title="Seguros" color="blue">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label required>Aseguradora de responsabilidad civil</Label>
            <input
              type="text"
              value={value.seguros.asegura_resp_civil}
              onChange={e => updateSeguros({ asegura_resp_civil: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Ej: GNP Seguros"
            />
          </div>
          <div>
            <Label required>Póliza de responsabilidad civil</Label>
            <input
              type="text"
              value={value.seguros.poliza_resp_civil}
              onChange={e => updateSeguros({ poliza_resp_civil: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Número de póliza"
            />
          </div>
          <div>
            <Label>Aseguradora medio ambiente (opcional)</Label>
            <input
              type="text"
              value={value.seguros.asegura_med_ambiente ?? ""}
              onChange={e => updateSeguros({ asegura_med_ambiente: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Solo si transportas materiales peligrosos"
            />
          </div>
          <div>
            <Label>Póliza medio ambiente</Label>
            <input
              type="text"
              value={value.seguros.poliza_med_ambiente ?? ""}
              onChange={e => updateSeguros({ poliza_med_ambiente: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <Label>Aseguradora de carga (opcional)</Label>
            <input
              type="text"
              value={value.seguros.asegura_carga ?? ""}
              onChange={e => updateSeguros({ asegura_carga: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <Label>Póliza de carga</Label>
            <input
              type="text"
              value={value.seguros.poliza_carga ?? ""}
              onChange={e => updateSeguros({ poliza_carga: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Prima del seguro (opcional)</Label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={value.seguros.prima_seguro ?? ""}
              onChange={e =>
                updateSeguros({ prima_seguro: e.target.value ? parseFloat(e.target.value) : undefined })
              }
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="0.00"
            />
          </div>
        </div>
      </CardGroup>

      {/* ── Remolques ── */}
      <CardGroup
        title="Remolques (opcional)"
        subtitle="Hasta 2 remolques o semirremolques que arrastra la unidad motriz"
        color="blue"
      >
        {(value.remolques ?? []).length === 0 ? (
          <button
            type="button"
            onClick={addRemolque}
            className="w-full py-2 text-sm border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-blue-300 hover:border-blue-500/50 hover:bg-blue-950/20 transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar remolque
          </button>
        ) : (
          <div className="space-y-2">
            {(value.remolques ?? []).map((r, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end p-3 bg-slate-800/40 border border-slate-700 rounded-lg"
              >
                <div>
                  <Label required>Subtipo de remolque</Label>
                  <select
                    value={r.subtipo_rem}
                    onChange={e => updateRemolque(idx, { subtipo_rem: e.target.value })}
                    disabled={loadingSubtipos}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">{loadingSubtipos ? "Cargando..." : "Selecciona..."}</option>
                    {subtipos.map(s => (
                      <option key={s.code} value={s.code}>
                        {s.code} — {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label required>Placa</Label>
                  <input
                    type="text"
                    value={r.placa}
                    onChange={e => updateRemolque(idx, { placa: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="ABC-123-D"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRemolque(idx)}
                  className="px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition"
                  title="Quitar remolque"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            {(value.remolques?.length ?? 0) < 2 && (
              <button
                type="button"
                onClick={addRemolque}
                className="w-full py-2 text-sm border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-blue-300 hover:border-blue-500/50 hover:bg-blue-950/20 transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar otro remolque
              </button>
            )}
          </div>
        )}
      </CardGroup>
    </div>
  );
}

// ─── Helpers UI ───
function CardGroup({
  title,
  subtitle,
  color,
  children,
}: {
  title: string;
  subtitle?: string;
  color: "blue" | "cyan" | "indigo" | "amber";
  children: React.ReactNode;
}) {
  const borderColors: Record<string, string> = {
    blue: "border-blue-800/30",
    cyan: "border-cyan-800/30",
    indigo: "border-indigo-800/30",
    amber: "border-amber-800/30",
  };
  return (
    <div className={`bg-slate-800/30 border rounded-xl p-4 ${borderColors[color]}`}>
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
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
