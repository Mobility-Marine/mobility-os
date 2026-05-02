"use client";

// ═══════════════════════════════════════════════════════════════════════
// AereoForm — Datos del transporte aéreo
// ═══════════════════════════════════════════════════════════════════════

import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type { TransporteAereo } from "../../types/carta_porte.types";

interface Props {
  value: TransporteAereo;
  onChange: (next: TransporteAereo) => void;
}

export function AereoForm({ value, onChange }: Props) {
  const { items: codigos } = useSATCatalog("codigo_transporte_aereo");
  const { items: paises } = useSATCatalog("paises_comunes");

  const update = (patch: Partial<TransporteAereo>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-5">
      {/* ── Permiso ── */}
      <CardGroup title="Permiso SCT" color="indigo">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label required>Tipo de permiso SCT</Label>
            <input
              type="text"
              value={value.perm_sct}
              onChange={e => update({ perm_sct: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <Label required>Número de permiso SCT</Label>
            <input
              type="text"
              value={value.num_permiso_sct}
              onChange={e => update({ num_permiso_sct: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>
      </CardGroup>

      {/* ── Aeronave ── */}
      <CardGroup title="Aeronave y vuelo" color="indigo">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label required>Matrícula de la aeronave</Label>
            <input
              type="text"
              value={value.matricula_aeronave}
              onChange={e => update({ matricula_aeronave: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              placeholder="XA-AMP"
            />
          </div>
          <div>
            <Label required>Código de transportista (IATA/ICAO)</Label>
            <select
              value={value.codigo_transportista}
              onChange={e => update({ codigo_transportista: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="">Selecciona aerolínea...</option>
              {codigos.map(c => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label required>Número de guía aérea</Label>
            <input
              type="text"
              value={value.numero_guia}
              onChange={e => update({ numero_guia: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              placeholder="Air Waybill (AWB)"
            />
          </div>
          <div>
            <Label required>Lugar de contrato</Label>
            <input
              type="text"
              value={value.lugar_contrato}
              onChange={e => update({ lugar_contrato: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              placeholder="Ciudad / Aeropuerto"
            />
          </div>
        </div>
      </CardGroup>

      {/* ── Seguros ── */}
      <CardGroup title="Seguros" color="indigo">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label required>Aseguradora</Label>
            <input
              type="text"
              value={value.nombre_aseg}
              onChange={e => update({ nombre_aseg: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <Label required>Número de póliza</Label>
            <input
              type="text"
              value={value.num_poliza_seguro}
              onChange={e => update({ num_poliza_seguro: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>
      </CardGroup>

      {/* ── Embarcador (opcional) ── */}
      <CardGroup
        title="Embarcador (opcional)"
        subtitle="Datos del exportador o expedidor de la mercancía"
        color="indigo"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>RFC del embarcador</Label>
            <input
              type="text"
              value={value.rfc_embarcador ?? ""}
              onChange={e => update({ rfc_embarcador: e.target.value.toUpperCase() || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              maxLength={13}
            />
          </div>
          <div>
            <Label>Nombre del embarcador</Label>
            <input
              type="text"
              value={value.nombre_embarcador ?? ""}
              onChange={e => update({ nombre_embarcador: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <Label>Núm. registro tributario (extranjero)</Label>
            <input
              type="text"
              value={value.num_reg_id_trib_embarc ?? ""}
              onChange={e => update({ num_reg_id_trib_embarc: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <Label>Residencia fiscal</Label>
            <select
              value={value.residencia_fiscal_embarc ?? ""}
              onChange={e => update({ residencia_fiscal_embarc: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="">No aplica</option>
              {paises.map(p => (
                <option key={p.code} value={p.code}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
      </CardGroup>
    </div>
  );
}

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
