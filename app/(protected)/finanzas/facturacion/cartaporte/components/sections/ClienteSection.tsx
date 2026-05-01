"use client";

// ═══════════════════════════════════════════════════════════════════════
// ClienteSection — Captura datos del receptor del CFDI
// 
// Permite seleccionar un cliente existente de BD (autocompleta datos)
// o capturar manualmente. Multi-tenant: filtra por company_id.
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { CFDIClienteData, CFDIBaseData } from "../../types/carta_porte.types";

// Catálogos cortos hardcoded (estables, raramente cambian)
type CatalogPair = { code: string; label: string };

const REGIMEN_FISCAL: CatalogPair[] = [
  { code: "601", label: "601 — General de Ley Personas Morales" },
  { code: "603", label: "603 — Personas Morales con Fines no Lucrativos" },
  { code: "605", label: "605 — Sueldos y Salarios e Ingresos Asimilados" },
  { code: "606", label: "606 — Arrendamiento" },
  { code: "612", label: "612 — Personas Físicas con Actividades Empresariales" },
  { code: "621", label: "621 — Incorporación Fiscal" },
  { code: "626", label: "626 — Régimen Simplificado de Confianza (RESICO)" },
  { code: "616", label: "616 — Sin obligaciones fiscales" },
];

const USO_CFDI: CatalogPair[] = [
  { code: "G01", label: "G01 — Adquisición de mercancías" },
  { code: "G02", label: "G02 — Devoluciones, descuentos o bonificaciones" },
  { code: "G03", label: "G03 — Gastos en general" },
  { code: "I01", label: "I01 — Construcciones" },
  { code: "I04", label: "I04 — Equipo de cómputo y accesorios" },
  { code: "I05", label: "I05 — Dados, troqueles, moldes, matrices y herramentales" },
  { code: "I08", label: "I08 — Otra maquinaria y equipo" },
  { code: "S01", label: "S01 — Sin efectos fiscales" },
  { code: "CP01", label: "CP01 — Pagos" },
];

interface Props {
  data: CFDIBaseData;
  setCliente: (next: CFDIClienteData) => void;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

export function ClienteSection({ data, setCliente, showValidation, errors }: Props) {
  const { companyId } = useTenant();
  const [clientes, setClientes]     = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showList, setShowList]     = useState(false);

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from("clients")
      .select("id, name, legal_name, rfc, email, tax_regime, zip_code")
      .eq("company_id", companyId)
      .order("name")
      .limit(200)
      .then(({ data }) => setClientes(data ?? []));
  }, [companyId]);

  const filteredClientes = clientes.filter(c => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(s) ||
      c.legal_name?.toLowerCase().includes(s) ||
      c.rfc?.toLowerCase().includes(s)
    );
  });

  const updateCliente = (patch: Partial<CFDIClienteData>) => {
    setCliente({ ...data.cliente, ...patch });
  };

  const selectFromList = (c: any) => {
    setCliente({
      client_id:              c.id,
      receiver_rfc:           c.rfc ?? "",
      receiver_name:          c.legal_name ?? c.name ?? "",
      receiver_fiscal_regime: c.tax_regime ?? "601",
      receiver_zip:           c.zip_code ?? "",
      receiver_email:         c.email ?? "",
      receiver_cfdi_use:      data.cliente.receiver_cfdi_use,
    });
    setSearchTerm(c.legal_name ?? c.name ?? "");
    setShowList(false);
  };

  const fieldHasError = (field: string) =>
    showValidation && errors.some(e => e.field === field);

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Banner */}
      <div className="bg-gradient-to-br from-blue-950/40 to-cyan-950/40 border border-blue-800/40 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 text-sm text-blue-100/90 leading-relaxed">
            Datos fiscales del receptor del CFDI. Selecciona un cliente registrado o
            captura los datos manualmente.
          </div>
        </div>
      </div>

      {/* Selector de cliente */}
      <section>
        <h3 className="text-sm font-semibold text-white mb-2">Buscar cliente registrado</h3>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setShowList(true); }}
            onFocus={() => setShowList(true)}
            placeholder="Busca por nombre, razón social o RFC..."
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          {showList && filteredClientes.length > 0 && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg max-h-64 overflow-y-auto shadow-xl">
              {filteredClientes.slice(0, 30).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectFromList(c)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 border-b border-slate-800 last:border-0 transition"
                >
                  <div className="text-sm text-white">{c.legal_name ?? c.name}</div>
                  <div className="text-xs text-slate-400 font-mono">
                    {c.rfc ?? "Sin RFC"} {c.zip_code && `· CP ${c.zip_code}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {data.cliente.client_id && (
          <p className="text-xs text-emerald-300 mt-1.5 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Cliente vinculado de la base de datos
          </p>
        )}
      </section>

      {/* Datos fiscales */}
      <section>
        <h3 className="text-sm font-semibold text-white mb-3">Datos fiscales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label required>Razón social / Nombre completo</Label>
            <input
              type="text"
              value={data.cliente.receiver_name}
              onChange={e => updateCliente({ receiver_name: e.target.value })}
              className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                fieldHasError("receiver_name") ? "border-red-500" : "border-slate-700"
              }`}
              placeholder="Ej: Empresa S.A. de C.V."
            />
          </div>

          <div>
            <Label required>RFC</Label>
            <input
              type="text"
              value={data.cliente.receiver_rfc}
              onChange={e => updateCliente({ receiver_rfc: e.target.value.toUpperCase() })}
              maxLength={13}
              className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                fieldHasError("receiver_rfc") ? "border-red-500" : "border-slate-700"
              }`}
              placeholder="ABC850101XXX"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Genéricos: <code className="text-blue-300 bg-blue-950/40 px-1 rounded">XAXX010101000</code> (público) ·{" "}
              <code className="text-blue-300 bg-blue-950/40 px-1 rounded">XEXX010101000</code> (extranjero)
            </p>
          </div>

          <div>
            <Label required>Código postal</Label>
            <input
              type="text"
              value={data.cliente.receiver_zip}
              onChange={e =>
                updateCliente({ receiver_zip: e.target.value.replace(/\D/g, "").slice(0, 5) })
              }
              maxLength={5}
              className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-sm text-white tabular-nums font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                fieldHasError("receiver_zip") ? "border-red-500" : "border-slate-700"
              }`}
              placeholder="06700"
            />
          </div>

          <div>
            <Label required>Régimen fiscal</Label>
            <select
              value={data.cliente.receiver_fiscal_regime}
              onChange={e => updateCliente({ receiver_fiscal_regime: e.target.value })}
              className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                fieldHasError("receiver_fiscal_regime") ? "border-red-500" : "border-slate-700"
              }`}
            >
              {REGIMEN_FISCAL.map(r => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <Label required>Uso del CFDI</Label>
            <select
              value={data.cliente.receiver_cfdi_use}
              onChange={e => updateCliente({ receiver_cfdi_use: e.target.value })}
              className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                fieldHasError("receiver_cfdi_use") ? "border-red-500" : "border-slate-700"
              }`}
            >
              {USO_CFDI.map(u => (
                <option key={u.code} value={u.code}>{u.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <Label>Email (opcional)</Label>
            <input
              type="email"
              value={data.cliente.receiver_email ?? ""}
              onChange={e => updateCliente({ receiver_email: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="contacto@cliente.com"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Si llenas el email, podrás enviar el CFDI directamente al cliente al timbrar.
            </p>
          </div>
        </div>
      </section>
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
