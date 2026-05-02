"use client";

// ═══════════════════════════════════════════════════════════════════════
// MaritimoForm — Datos del transporte marítimo
//
// Captura: permiso SCT, embarcación (tipo, matrícula, OMI, nombre,
// nacionalidad, dimensiones), tipo de carga, datos de la línea naviera,
// y contenedores transportados.
// ═══════════════════════════════════════════════════════════════════════

import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type {
  TransporteMaritimo,
  ContenedorMaritimo,
} from "../../types/carta_porte.types";

interface Props {
  value: TransporteMaritimo;
  onChange: (next: TransporteMaritimo) => void;
}

export function MaritimoForm({ value, onChange }: Props) {
  const { items: tiposEmb } = useSATCatalog("tipo_embarcacion");
  const { items: tiposCarga } = useSATCatalog("tipo_carga");
  const { items: paises } = useSATCatalog("paises_comunes");

  const update = (patch: Partial<TransporteMaritimo>) =>
    onChange({ ...value, ...patch });

  const addContenedor = () => {
    const nuevo: ContenedorMaritimo = { matricula_contenedor: "", tipo_contenedor: "" };
    onChange({ ...value, contenedores: [...(value.contenedores ?? []), nuevo] });
  };

  const updateContenedor = (idx: number, patch: Partial<ContenedorMaritimo>) => {
    const list = [...(value.contenedores ?? [])];
    list[idx] = { ...list[idx], ...patch };
    onChange({ ...value, contenedores: list });
  };

  const removeContenedor = (idx: number) => {
    const list = [...(value.contenedores ?? [])];
    list.splice(idx, 1);
    onChange({ ...value, contenedores: list });
  };

  return (
    <div className="space-y-5">
      {/* ── Permiso ── */}
      <CardGroup title="Permiso SCT (opcional)" color="cyan">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Tipo de permiso SCT</Label>
            <input
              type="text"
              value={value.perm_sct ?? ""}
              onChange={e => update({ perm_sct: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div>
            <Label>Número de permiso SCT</Label>
            <input
              type="text"
              value={value.num_permiso_sct ?? ""}
              onChange={e => update({ num_permiso_sct: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
        </div>
      </CardGroup>

      {/* ── Embarcación ── */}
      <CardGroup title="Embarcación" subtitle="Datos del buque que transporta la carga" color="cyan">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label required>Tipo de embarcación</Label>
            <select
              value={value.tipo_embarcacion}
              onChange={e => update({ tipo_embarcacion: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="">Selecciona tipo...</option>
              {tiposEmb.map(t => (
                <option key={t.code} value={t.code}>
                  {t.code} — {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label required>Matrícula</Label>
            <input
              type="text"
              value={value.matricula}
              onChange={e => update({ matricula: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div>
            <Label required>Número OMI</Label>
            <input
              type="text"
              value={value.numero_omi}
              onChange={e => update({ numero_omi: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              placeholder="7 dígitos"
              maxLength={7}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Identificador único de la Organización Marítima Internacional
            </p>
          </div>
          <div>
            <Label required>Nombre de la embarcación</Label>
            <input
              type="text"
              value={value.nombre_embarc}
              onChange={e => update({ nombre_embarc: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div>
            <Label required>Nacionalidad</Label>
            <select
              value={value.nacionalidad_embarc}
              onChange={e => update({ nacionalidad_embarc: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              {paises.map(p => (
                <option key={p.code} value={p.code}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label required>Año de construcción</Label>
            <input
              type="number"
              min="1900"
              max="2100"
              value={value.anio_embarcacion}
              onChange={e => update({ anio_embarcacion: parseInt(e.target.value, 10) || new Date().getFullYear() })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div>
            <Label required>Unidades de arqueo bruto</Label>
            <input
              type="number"
              min="0"
              value={value.unidades_de_arq_bruto || ""}
              onChange={e => update({ unidades_de_arq_bruto: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
        </div>

        {/* Dimensiones */}
        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-700/50">
          <div>
            <Label required>Eslora (m)</Label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={value.eslora || ""}
              onChange={e => update({ eslora: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div>
            <Label required>Manga (m)</Label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={value.manga || ""}
              onChange={e => update({ manga: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div>
            <Label required>Calado (m)</Label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={value.calado || ""}
              onChange={e => update({ calado: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
        </div>
      </CardGroup>

      {/* ── Carga y seguros ── */}
      <CardGroup title="Carga y seguros" color="cyan">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label required>Tipo de carga</Label>
            <select
              value={value.tipo_carga}
              onChange={e => update({ tipo_carga: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="">Selecciona...</option>
              {tiposCarga.map(t => (
                <option key={t.code} value={t.code}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Número certificado ITC</Label>
            <input
              type="text"
              value={value.num_cert_itc ?? ""}
              onChange={e => update({ num_cert_itc: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div>
            <Label>Aseguradora</Label>
            <input
              type="text"
              value={value.nombre_aseg ?? ""}
              onChange={e => update({ nombre_aseg: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div>
            <Label>Número de póliza</Label>
            <input
              type="text"
              value={value.num_poliza_seguro ?? ""}
              onChange={e => update({ num_poliza_seguro: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
        </div>
      </CardGroup>

      {/* ── Línea naviera ── */}
      <CardGroup title="Línea naviera y viaje (opcional)" color="cyan">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Línea naviera</Label>
            <input
              type="text"
              value={value.linea_naviera ?? ""}
              onChange={e => update({ linea_naviera: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              placeholder="Ej: MSC, Maersk, Hapag-Lloyd"
            />
          </div>
          <div>
            <Label>Nombre del agente naviero</Label>
            <input
              type="text"
              value={value.nombre_agente_naviero ?? ""}
              onChange={e => update({ nombre_agente_naviero: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div>
            <Label>Núm. autorización del agente</Label>
            <input
              type="text"
              value={value.num_autorizacion_naviero ?? ""}
              onChange={e => update({ num_autorizacion_naviero: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div>
            <Label>Número de viaje</Label>
            <input
              type="text"
              value={value.num_viaje ?? ""}
              onChange={e => update({ num_viaje: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Conocimiento de embarque (Bill of Lading)</Label>
            <input
              type="text"
              value={value.num_conoc_embarc ?? ""}
              onChange={e => update({ num_conoc_embarc: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              placeholder="B/L number"
            />
          </div>
        </div>
      </CardGroup>

      {/* ── Contenedores ── */}
      <CardGroup
        title="Contenedores"
        subtitle="Contenedores transportados en este viaje"
        color="cyan"
      >
        {(value.contenedores ?? []).length === 0 ? (
          <button
            type="button"
            onClick={addContenedor}
            className="w-full py-2 text-sm border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 hover:bg-cyan-950/20 transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar contenedor
          </button>
        ) : (
          <div className="space-y-2">
            {(value.contenedores ?? []).map((c, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end p-3 bg-slate-800/40 border border-slate-700 rounded-lg"
              >
                <div>
                  <Label required>Matrícula</Label>
                  <input
                    type="text"
                    value={c.matricula_contenedor}
                    onChange={e => updateContenedor(idx, { matricula_contenedor: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    placeholder="MSCU1234567"
                  />
                </div>
                <div>
                  <Label required>Tipo</Label>
                  <input
                    type="text"
                    value={c.tipo_contenedor}
                    onChange={e => updateContenedor(idx, { tipo_contenedor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    placeholder="20', 40' HC, 40' RF..."
                  />
                </div>
                <div>
                  <Label>Núm. precinto</Label>
                  <input
                    type="text"
                    value={c.num_precinto ?? ""}
                    onChange={e => updateContenedor(idx, { num_precinto: e.target.value || undefined })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeContenedor(idx)}
                  className="px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addContenedor}
              className="w-full py-2 text-sm border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 hover:bg-cyan-950/20 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar otro contenedor
            </button>
          </div>
        )}
      </CardGroup>
    </div>
  );
}

// ─── Helpers UI (locales al archivo) ───
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
