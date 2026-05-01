"use client";

// ═══════════════════════════════════════════════════════════════════════
// FerroviarioForm — Datos del transporte ferroviario
// 
// Captura: tipo de servicio/tráfico, derechos de paso, carros del tren
// con sus contenedores.
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
  const { items: servicios } = useSATCatalog("tipo_servicio_ferroviario");
  const { items: traficos }  = useSATCatalog("tipo_trafico_ferroviario");
  const { items: carros }    = useSATCatalog("tipo_carro");
  const { items: derechos }  = useSATCatalog("derechos_de_paso");

  const update = (patch: Partial<TransporteFerroviario>) => onChange({ ...value, ...patch });

  // Derechos de paso
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

  // Carros
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

  // Contenedores dentro de un carro
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
    <div className="space-y-5">
      {/* ── Servicio ── */}
      <CardGroup title="Tipo de servicio ferroviario" color="amber">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label required>Tipo de servicio</Label>
            <select
              value={value.tipo_de_servicio}
              onChange={e => update({ tipo_de_servicio: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="">Selecciona...</option>
              {servicios.map(s => (
                <option key={s.code} value={s.code}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label required>Tipo de tráfico</Label>
            <select
              value={value.tipo_de_trafico}
              onChange={e => update({ tipo_de_trafico: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="">Selecciona...</option>
              {traficos.map(t => (
                <option key={t.code} value={t.code}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Aseguradora (opcional)</Label>
            <input
              type="text"
              value={value.nombre_aseg ?? ""}
              onChange={e => update({ nombre_aseg: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div>
            <Label>Número de póliza</Label>
            <input
              type="text"
              value={value.num_poliza_seguro ?? ""}
              onChange={e => update({ num_poliza_seguro: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>
      </CardGroup>

      {/* ── Derechos de paso ── */}
      <CardGroup
        title="Derechos de paso (opcional)"
        subtitle="Solo si la unidad transita por vías de otro concesionario"
        color="amber"
      >
        {(value.derechos_de_paso ?? []).length === 0 ? (
          <button
            type="button"
            onClick={addDerecho}
            className="w-full py-2 text-sm border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-amber-300 hover:border-amber-500/50 hover:bg-amber-950/20 transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar derecho de paso
          </button>
        ) : (
          <div className="space-y-2">
            {(value.derechos_de_paso ?? []).map((d, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end p-3 bg-slate-800/40 border border-slate-700 rounded-lg"
              >
                <div>
                  <Label required>Tipo de derecho</Label>
                  <select
                    value={d.tipo_derecho_de_paso}
                    onChange={e => updateDerecho(idx, { tipo_derecho_de_paso: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="">Selecciona...</option>
                    {derechos.map(r => (
                      <option key={r.code} value={r.code}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label required>Kilometraje pagado</Label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={d.kilometraje_pagado || ""}
                    onChange={e => updateDerecho(idx, { kilometraje_pagado: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeDerecho(idx)}
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
              onClick={addDerecho}
              className="w-full py-2 text-sm border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-amber-300 hover:border-amber-500/50 hover:bg-amber-950/20 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar otro
            </button>
          </div>
        )}
      </CardGroup>

      {/* ── Carros del tren ── */}
      <CardGroup
        title="Carros del tren"
        subtitle="Mínimo 1 carro. Cada carro puede llevar contenedores."
        color="amber"
      >
        {value.carros.length === 0 ? (
          <button
            type="button"
            onClick={addCarro}
            className="w-full py-2.5 text-sm border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-amber-300 hover:border-amber-500/50 hover:bg-amber-950/20 transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar primer carro
          </button>
        ) : (
          <div className="space-y-3">
            {value.carros.map((c, cIdx) => (
              <div
                key={cIdx}
                className="bg-slate-800/40 border border-slate-700 rounded-lg p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium text-amber-200">Carro {cIdx + 1}</h5>
                  <button
                    type="button"
                    onClick={() => removeCarro(cIdx)}
                    className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Quitar carro
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label required>Tipo de carro</Label>
                    <select
                      value={c.tipo_carro}
                      onChange={e => updateCarro(cIdx, { tipo_carro: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    >
                      <option value="">Selecciona...</option>
                      {carros.map(t => (
                        <option key={t.code} value={t.code}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label required>Matrícula del carro</Label>
                    <input
                      type="text"
                      value={c.matricula_carro}
                      onChange={e => updateCarro(cIdx, { matricula_carro: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                  <div>
                    <Label required>Guía del carro</Label>
                    <input
                      type="text"
                      value={c.guia_carro}
                      onChange={e => updateCarro(cIdx, { guia_carro: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                  <div>
                    <Label required>Toneladas netas</Label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={c.toneladas_netas_carro || ""}
                      onChange={e => updateCarro(cIdx, { toneladas_netas_carro: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                </div>

                {/* Contenedores del carro */}
                <div className="pt-3 border-t border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Contenedores en este carro</Label>
                    <span className="text-[11px] text-slate-500">
                      {(c.contenedores ?? []).length}{" "}
                      {(c.contenedores ?? []).length === 1 ? "contenedor" : "contenedores"}
                    </span>
                  </div>

                  {(c.contenedores ?? []).map((cont, contIdx) => (
                    <div
                      key={contIdx}
                      className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end p-2 bg-slate-900/60 border border-slate-700 rounded mb-2"
                    >
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tipo</label>
                        <input
                          type="text"
                          value={cont.tipo_contenedor}
                          onChange={e => updateContenedor(cIdx, contIdx, { tipo_contenedor: e.target.value })}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                          placeholder="40' HC"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Guía</label>
                        <input
                          type="text"
                          value={cont.guia_contenedor}
                          onChange={e => updateContenedor(cIdx, contIdx, { guia_contenedor: e.target.value })}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Placa VM</label>
                        <input
                          type="text"
                          value={cont.placa_vm ?? ""}
                          onChange={e => updateContenedor(cIdx, contIdx, { placa_vm: e.target.value || undefined })}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeContenedor(cIdx, contIdx)}
                        className="px-2 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addContenedor(cIdx)}
                    className="w-full py-1.5 text-xs border border-dashed border-slate-600 rounded text-slate-400 hover:text-amber-300 hover:border-amber-500/50 transition"
                  >
                    + Agregar contenedor
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addCarro}
              className="w-full py-2 text-sm border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-amber-300 hover:border-amber-500/50 hover:bg-amber-950/20 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar otro carro
            </button>
          </div>
        )}
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
    blue: "border-blue-800/30", cyan: "border-cyan-800/30",
    indigo: "border-indigo-800/30", amber: "border-amber-800/30",
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
