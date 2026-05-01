"use client";

// ═══════════════════════════════════════════════════════════════════════
// MercanciasSection — Sección 3 del drawer Carta Porte 3.1
// 
// Captura la lista de mercancías transportadas con sus datos SAT.
// 
// UX:
//   - Cards plegables (similar a Ubicaciones)
//   - Tabs internos por mercancía: Datos básicos · Material peligroso · COFEPRIS · Comercio Exterior
//   - Auto-cálculo del total de pesos para reflejar en el agregado
// 
// La búsqueda de claves SAT (ClaveProdServCP, ClaveUnidad) usa el endpoint
// /api/sat existente que pega contra Facturapi.
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type {
  CartaPorteData,
  CartaPorteMercancia,
  CartaPorteMercanciasAgregado,
} from "../../types/carta_porte.types";
import { newMercancia } from "../../types/carta_porte.defaults";
import type { ValidationError } from "../../types/carta_porte.validations";

interface Props {
  data: CartaPorteData;
  setMercancias: (next: CartaPorteMercancia[]) => void;
  setMercanciasAgregado: (next: CartaPorteMercanciasAgregado) => void;
  showValidation: boolean;
  errors: ValidationError[];
}

export function MercanciasSection({
  data,
  setMercancias,
  setMercanciasAgregado,
  showValidation,
  errors,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(
    data.mercancias[0]?._temp_id ?? null
  );

  const isInternacional = data.header.transp_internac === "Sí";

  // Auto-calcular peso bruto total y conteo cuando cambien las mercancías
  useEffect(() => {
    const sumaPesos = data.mercancias.reduce((acc, m) => acc + (m.peso_en_kg || 0), 0);
    const numTotal = data.mercancias.length;

    // Solo actualizar si difieren (evitar loops)
    if (
      Math.abs(sumaPesos - data.mercancias_agregado.peso_bruto_total) > 0.001 ||
      numTotal !== data.mercancias_agregado.num_total_mercancias
    ) {
      setMercanciasAgregado({
        ...data.mercancias_agregado,
        peso_bruto_total: parseFloat(sumaPesos.toFixed(3)),
        num_total_mercancias: numTotal,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.mercancias]);

  // ─── Operaciones ───
  const updateMercancia = (
    tempId: string,
    patch: Partial<CartaPorteMercancia>
  ) => {
    setMercancias(
      data.mercancias.map(m =>
        m._temp_id === tempId ? { ...m, ...patch } : m
      )
    );
  };

  const addMercancia = () => {
    const nueva = newMercancia();
    setMercancias([...data.mercancias, nueva]);
    setExpandedId(nueva._temp_id);
  };

  const removeMercancia = (tempId: string) => {
    setMercancias(data.mercancias.filter(m => m._temp_id !== tempId));
    if (expandedId === tempId) setExpandedId(null);
  };

  const errorsByMercancia = (idx: number): number =>
    showValidation
      ? errors.filter(e => e.field.includes(`mercancias[${idx}]`)).length
      : 0;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Banner ── */}
      <div className="bg-gradient-to-br from-amber-950/40 to-orange-950/40 border border-amber-800/40 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 text-sm text-amber-100/90 leading-relaxed">
            Registra cada tipo de mercancía que se transporta. Cada una requiere su{" "}
            <strong className="text-white">clave SAT del producto</strong>, descripción,
            cantidad y peso en kg. Si transportas material peligroso o medicamentos,
            llena las pestañas correspondientes.
          </div>
        </div>
      </div>

      {/* ── Lista de mercancías ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Mercancías a transportar</h3>
            <p className="text-xs text-slate-400">Mínimo 1 mercancía</p>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            {data.mercancias.length} {data.mercancias.length === 1 ? "registrada" : "registradas"}
          </span>
        </div>

        {data.mercancias.length === 0 ? (
          <div className="border border-dashed border-slate-600 rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto mb-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-sm text-slate-400 mb-3">Sin mercancías registradas</p>
            <button
              type="button"
              onClick={addMercancia}
              className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar primera mercancía
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {data.mercancias.map((m, idx) => (
              <MercanciaCard
                key={m._temp_id}
                mercancia={m}
                index={idx}
                isExpanded={expandedId === m._temp_id}
                isInternacional={isInternacional}
                onToggleExpand={() =>
                  setExpandedId(expandedId === m._temp_id ? null : m._temp_id)
                }
                onUpdate={patch => updateMercancia(m._temp_id, patch)}
                onRemove={() => removeMercancia(m._temp_id)}
                showValidation={showValidation}
                errorCount={errorsByMercancia(idx)}
              />
            ))}
            <button
              type="button"
              onClick={addMercancia}
              className="w-full py-2.5 text-sm border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-amber-300 hover:border-amber-500/50 hover:bg-amber-950/20 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar otra mercancía
            </button>
          </div>
        )}
      </section>

      {/* ── Totales agregados ── */}
      <section className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
        <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-3">
          Totales agregados (auto-calculados)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Número total de mercancías</label>
            <div className="text-2xl text-white font-semibold tabular-nums">
              {data.mercancias_agregado.num_total_mercancias}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Peso bruto total</label>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl text-white font-semibold tabular-nums">
                {data.mercancias_agregado.peso_bruto_total.toLocaleString("es-MX", {
                  maximumFractionDigits: 3,
                })}
              </div>
              <div className="text-sm text-slate-400">{data.mercancias_agregado.unidad_peso}</div>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Unidad de peso</label>
            <UnidadPesoSelector
              value={data.mercancias_agregado.unidad_peso}
              onChange={u =>
                setMercanciasAgregado({ ...data.mercancias_agregado, unidad_peso: u })
              }
            />
          </div>
        </div>

        {/* Peso neto opcional */}
        <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Peso neto total (opcional)</Label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.001"
                value={data.mercancias_agregado.peso_neto_total ?? ""}
                onChange={e =>
                  setMercanciasAgregado({
                    ...data.mercancias_agregado,
                    peso_neto_total: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="0.000"
              />
              <span className="text-xs text-slate-400 px-2">{data.mercancias_agregado.unidad_peso}</span>
            </div>
          </div>
          <div>
            <Label>Logística inversa / recolección / devolución</Label>
            <select
              value={data.mercancias_agregado.logistica_inversa_recoleccion_devolucion ?? ""}
              onChange={e =>
                setMercanciasAgregado({
                  ...data.mercancias_agregado,
                  logistica_inversa_recoleccion_devolucion:
                    (e.target.value as "Sí" | "No") || undefined,
                })
              }
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">No aplica</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card de una mercancía (plegable, con tabs internos)
// ─────────────────────────────────────────────────────────────
type MercanciaTab = "basicos" | "peligroso" | "cofepris" | "comex";

interface MercanciaCardProps {
  mercancia: CartaPorteMercancia;
  index: number;
  isExpanded: boolean;
  isInternacional: boolean;
  onToggleExpand: () => void;
  onUpdate: (patch: Partial<CartaPorteMercancia>) => void;
  onRemove: () => void;
  showValidation: boolean;
  errorCount: number;
}

function MercanciaCard({
  mercancia,
  index,
  isExpanded,
  isInternacional,
  onToggleExpand,
  onUpdate,
  onRemove,
  showValidation,
  errorCount,
}: MercanciaCardProps) {
  const [activeTab, setActiveTab] = useState<MercanciaTab>("basicos");

  // Resumen para header colapsado
  const headerSummary = [
    mercancia.descripcion || "Sin descripción",
    mercancia.cantidad > 0 && `${mercancia.cantidad} ${mercancia.clave_unidad}`,
    mercancia.peso_en_kg > 0 && `${mercancia.peso_en_kg.toLocaleString("es-MX")} kg`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={`bg-slate-800/30 border rounded-xl overflow-hidden transition ${
        isExpanded
          ? "border-amber-500/50"
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
        <div className="w-8 h-8 rounded-lg bg-amber-600/20 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-amber-400 tabular-nums">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white">
              Mercancía {index + 1}
            </span>
            {mercancia.bienes_transp && (
              <span className="text-[10px] text-amber-300 font-mono bg-amber-950/40 px-1.5 py-0.5 rounded">
                {mercancia.bienes_transp}
              </span>
            )}
            {mercancia.material_peligroso && (
              <span className="text-[10px] text-red-300 bg-red-950/40 px-1.5 py-0.5 rounded">
                ⚠ Peligroso
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

      {/* Body */}
      {isExpanded && (
        <div className="border-t border-slate-700/50">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-2 py-2 bg-slate-900/50 border-b border-slate-700/50 overflow-x-auto">
            <TabButton
              active={activeTab === "basicos"}
              onClick={() => setActiveTab("basicos")}
              label="Datos básicos"
              required
            />
            <TabButton
              active={activeTab === "peligroso"}
              onClick={() => setActiveTab("peligroso")}
              label="Material peligroso"
              showDot={mercancia.material_peligroso}
            />
            <TabButton
              active={activeTab === "cofepris"}
              onClick={() => setActiveTab("cofepris")}
              label="COFEPRIS"
              showDot={!!mercancia.sector_cofepris}
            />
            {isInternacional && (
              <TabButton
                active={activeTab === "comex"}
                onClick={() => setActiveTab("comex")}
                label="Comercio Exterior"
                showDot={!!mercancia.fraccion_arancelaria}
              />
            )}
          </div>

          {/* Tab content */}
          <div className="p-4">
            {activeTab === "basicos" && (
              <DatosBasicosTab mercancia={mercancia} onUpdate={onUpdate} />
            )}
            {activeTab === "peligroso" && (
              <MaterialPeligrosoTab mercancia={mercancia} onUpdate={onUpdate} />
            )}
            {activeTab === "cofepris" && (
              <CofeprisTab mercancia={mercancia} onUpdate={onUpdate} />
            )}
            {activeTab === "comex" && isInternacional && (
              <ComexTab mercancia={mercancia} onUpdate={onUpdate} />
            )}
          </div>

          {/* Acciones */}
          <div className="px-4 pb-4 flex justify-end">
            <button
              type="button"
              onClick={onRemove}
              className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar mercancía
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 1: Datos básicos (obligatorio)
// ─────────────────────────────────────────────────────────────
function DatosBasicosTab({
  mercancia,
  onUpdate,
}: {
  mercancia: CartaPorteMercancia;
  onUpdate: (patch: Partial<CartaPorteMercancia>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Clave SAT producto */}
        <div className="md:col-span-2">
          <Label required>Clave SAT del producto (BienesTransp)</Label>
          <input
            type="text"
            value={mercancia.bienes_transp}
            onChange={e => onUpdate({ bienes_transp: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="Ej: 78101800"
            maxLength={15}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Catálogo c_ClaveProdServCP del SAT. Para autotransporte de carga general usa{" "}
            <code className="text-amber-300 bg-amber-950/40 px-1 rounded">78101800</code> o
            consulta el catálogo SAT.
          </p>
        </div>

        {/* Descripción */}
        <div className="md:col-span-2">
          <Label required>Descripción</Label>
          <input
            type="text"
            value={mercancia.descripcion}
            onChange={e => onUpdate({ descripcion: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="Ej: Refacciones automotrices ensambladas"
            maxLength={1000}
          />
        </div>

        {/* Cantidad + Clave Unidad */}
        <div>
          <Label required>Cantidad</Label>
          <input
            type="number"
            min="0"
            step="0.001"
            value={mercancia.cantidad || ""}
            onChange={e => onUpdate({ cantidad: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="0"
          />
        </div>
        <div>
          <Label required>Clave de unidad SAT</Label>
          <input
            type="text"
            value={mercancia.clave_unidad}
            onChange={e => onUpdate({ clave_unidad: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="KGM, H87, XBX..."
            maxLength={3}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Catálogo c_ClaveUnidad. Comunes:{" "}
            <code className="text-amber-300 bg-amber-950/40 px-1 rounded">KGM</code> kilo,{" "}
            <code className="text-amber-300 bg-amber-950/40 px-1 rounded">H87</code> pieza,{" "}
            <code className="text-amber-300 bg-amber-950/40 px-1 rounded">XBX</code> caja
          </p>
        </div>

        {/* Unidad propia */}
        <div>
          <Label>Unidad personalizada (opcional)</Label>
          <input
            type="text"
            value={mercancia.unidad ?? ""}
            onChange={e => onUpdate({ unidad: e.target.value || undefined })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="Texto descriptivo"
          />
        </div>

        {/* Dimensiones */}
        <div>
          <Label>Dimensiones (formato SAT)</Label>
          <input
            type="text"
            value={mercancia.dimensiones ?? ""}
            onChange={e => onUpdate({ dimensiones: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="30/40/30plg"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Formato: largo/ancho/alto + unidad (plg, cm, m)
          </p>
        </div>

        {/* Peso */}
        <div>
          <Label required>Peso en kilogramos</Label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.001"
              value={mercancia.peso_en_kg || ""}
              onChange={e => onUpdate({ peso_en_kg: parseFloat(e.target.value) || 0 })}
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              placeholder="0.000"
            />
            <span className="text-xs text-slate-400 px-2">kg</span>
          </div>
        </div>

        {/* Valor mercancía */}
        <div>
          <Label>Valor de la mercancía (opcional)</Label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={mercancia.valor_mercancia ?? ""}
              onChange={e => onUpdate({ valor_mercancia: e.target.value ? parseFloat(e.target.value) : undefined })}
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              placeholder="0.00"
            />
            <input
              type="text"
              value={mercancia.moneda ?? "MXN"}
              onChange={e => onUpdate({ moneda: e.target.value.toUpperCase() })}
              maxLength={3}
              className="w-20 px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white text-center font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              placeholder="MXN"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 2: Material peligroso
// ─────────────────────────────────────────────────────────────
function MaterialPeligrosoTab({
  mercancia,
  onUpdate,
}: {
  mercancia: CartaPorteMercancia;
  onUpdate: (patch: Partial<CartaPorteMercancia>) => void;
}) {
  const { items: embalajes } = useSATCatalog("tipo_embalaje_comun");

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
        <div>
          <div className="text-sm font-medium text-white">¿Es material peligroso?</div>
          <p className="text-xs text-slate-400 mt-0.5">
            Sustancias químicas, explosivos, inflamables, radioactivos, etc.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onUpdate({
              material_peligroso: !mercancia.material_peligroso,
              cve_material_peligroso: mercancia.material_peligroso ? undefined : mercancia.cve_material_peligroso,
            })
          }
          className={`relative w-11 h-6 rounded-full transition ${
            mercancia.material_peligroso ? "bg-red-600" : "bg-slate-600"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              mercancia.material_peligroso ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {mercancia.material_peligroso ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label required>Clave SAT del material peligroso</Label>
            <input
              type="text"
              value={mercancia.cve_material_peligroso ?? ""}
              onChange={e => onUpdate({ cve_material_peligroso: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="Ej: 0001"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Catálogo c_MaterialPeligroso del SAT
            </p>
          </div>
          <div>
            <Label>Tipo de embalaje</Label>
            <select
              value={mercancia.embalaje ?? ""}
              onChange={e => onUpdate({ embalaje: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <option value="">Selecciona embalaje...</option>
              {embalajes.map(e => (
                <option key={e.code} value={e.code}>
                  {e.code} — {e.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label>Descripción del embalaje</Label>
            <input
              type="text"
              value={mercancia.desc_embalaje ?? ""}
              onChange={e => onUpdate({ desc_embalaje: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="Detalle adicional del embalaje"
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-slate-500">
          Activa el toggle si la mercancía es material peligroso
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 3: COFEPRIS (medicamentos / sustancias controladas)
// ─────────────────────────────────────────────────────────────
function CofeprisTab({
  mercancia,
  onUpdate,
}: {
  mercancia: CartaPorteMercancia;
  onUpdate: (patch: Partial<CartaPorteMercancia>) => void;
}) {
  const hasCofepris = !!mercancia.sector_cofepris;

  return (
    <div className="space-y-4">
      <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-3 text-xs text-blue-200/80">
        Solo aplica para <strong>medicamentos, sustancias químicas reguladas, productos
        biológicos o alimentos perecederos</strong> que requieren registro COFEPRIS.
      </div>

      <div>
        <Label>Sector COFEPRIS</Label>
        <input
          type="text"
          value={mercancia.sector_cofepris ?? ""}
          onChange={e => onUpdate({ sector_cofepris: e.target.value || undefined })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          placeholder="Catálogo c_SectorCOFEPRIS"
        />
      </div>

      {hasCofepris && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-700/50">
          <div>
            <Label>Nombre del ingrediente activo</Label>
            <input
              type="text"
              value={mercancia.nombre_ingrediente_activo ?? ""}
              onChange={e => onUpdate({ nombre_ingrediente_activo: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <Label>Nombre químico</Label>
            <input
              type="text"
              value={mercancia.nom_quimico ?? ""}
              onChange={e => onUpdate({ nom_quimico: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <Label>Denominación genérica</Label>
            <input
              type="text"
              value={mercancia.denominacion_generica_prod ?? ""}
              onChange={e => onUpdate({ denominacion_generica_prod: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <Label>Denominación distintiva</Label>
            <input
              type="text"
              value={mercancia.denominacion_distintiva_prod ?? ""}
              onChange={e => onUpdate({ denominacion_distintiva_prod: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <Label>Fabricante</Label>
            <input
              type="text"
              value={mercancia.fabricante ?? ""}
              onChange={e => onUpdate({ fabricante: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <Label>Fecha de caducidad</Label>
            <input
              type="date"
              value={mercancia.fecha_caducidad ?? ""}
              onChange={e => onUpdate({ fecha_caducidad: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <Label>Lote del medicamento</Label>
            <input
              type="text"
              value={mercancia.lote_medicamento ?? ""}
              onChange={e => onUpdate({ lote_medicamento: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <Label>Registro sanitario / Folio autorización</Label>
            <input
              type="text"
              value={mercancia.registro_sanitario_folio_autorizacion ?? ""}
              onChange={e => onUpdate({ registro_sanitario_folio_autorizacion: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 4: Comercio Exterior (solo si transp_internac=Sí)
// ─────────────────────────────────────────────────────────────
function ComexTab({
  mercancia,
  onUpdate,
}: {
  mercancia: CartaPorteMercancia;
  onUpdate: (patch: Partial<CartaPorteMercancia>) => void;
}) {
  const { items: tiposMateria } = useSATCatalog("tipo_materia");

  return (
    <div className="space-y-4">
      <div className="bg-orange-950/20 border border-orange-800/30 rounded-lg p-3 text-xs text-orange-200/80">
        Datos requeridos por el SAT para mercancía que cruza fronteras.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Fracción arancelaria</Label>
          <input
            type="text"
            value={mercancia.fraccion_arancelaria ?? ""}
            onChange={e => onUpdate({ fraccion_arancelaria: e.target.value || undefined })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            placeholder="0123456789"
            maxLength={10}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            10 dígitos del catálogo c_FraccionArancelaria
          </p>
        </div>

        <div>
          <Label>UUID de Comercio Exterior</Label>
          <input
            type="text"
            value={mercancia.uuid_comercio_ext ?? ""}
            onChange={e => onUpdate({ uuid_comercio_ext: e.target.value || undefined })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            placeholder="UUID si ya hay CFDI CCE"
          />
        </div>

        <div>
          <Label>Tipo de materia</Label>
          <select
            value={mercancia.tipo_materia ?? ""}
            onChange={e => onUpdate({ tipo_materia: e.target.value || undefined })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            <option value="">Selecciona tipo...</option>
            {tiposMateria.map(t => (
              <option key={t.code} value={t.code}>
                {t.code} — {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Descripción de la materia</Label>
          <input
            type="text"
            value={mercancia.descripcion_materia ?? ""}
            onChange={e => onUpdate({ descripcion_materia: e.target.value || undefined })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            placeholder="Detalle del tipo de materia"
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers de UI compartidos
// ─────────────────────────────────────────────────────────────
function UnidadPesoSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { items, loading } = useSATCatalog("unidad_peso");
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={loading}
      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    >
      {loading ? (
        <option value={value}>Cargando...</option>
      ) : (
        items.map(u => (
          <option key={u.code} value={u.code}>
            {u.code} — {u.label}
          </option>
        ))
      )}
    </select>
  );
}

function TabButton({
  active,
  onClick,
  label,
  required,
  showDot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  required?: boolean;
  showDot?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-3 py-1.5 text-xs rounded-md transition whitespace-nowrap ${
        active
          ? "bg-amber-600 text-white"
          : "text-slate-400 hover:text-white hover:bg-slate-800"
      }`}
    >
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
      {showDot && !active && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full" />
      )}
    </button>
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
