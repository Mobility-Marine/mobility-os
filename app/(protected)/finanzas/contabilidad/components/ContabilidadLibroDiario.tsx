"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { AsientoContable } from "../services/contabilidad.service";

type Props = { asientos: AsientoContable[]; loading: boolean };

const fmt = (n: number) => n > 0 ? Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 }) : "—";

const TIPO_CONFIG = {
  ingreso: { label: "Ingreso",  color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
  cobro:   { label: "Cobro",    color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)"    },
  pago:    { label: "Pago",     color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)"  },
  ajuste:  { label: "Ajuste",   color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)"  },
  egreso:  { label: "Egreso",   color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)"  },
};

export default function ContabilidadLibroDiario({ asientos, loading }: Props) {
  const { lang, t } = useTranslation();
  const es = lang !== "en";
  const co = (t as any).contabilidad ?? {};
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("all");

  const filtered = asientos.filter(a =>
    (tipoFilter === "all" || a.tipo === tipoFilter) &&
    (a.concepto.toLowerCase().includes(search.toLowerCase()) || (a.referencia ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const totalCargos = filtered.reduce((s, a) => s + a.cargo, 0);
  const totalAbonos = filtered.reduce((s, a) => s + a.abono, 0);

  if (loading) return (
    <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
      {es ? "Cargando libro diario…" : "Loading journal…"}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Filtros */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={es ? "Buscar concepto, referencia…" : "Search concept, reference…"}
          style={{ height: "32px", padding: "0 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", width: "220px" }} />
        <select value={tipoFilter} onChange={e => setTipoFilter(e.target.value)}
          style={{ height: "32px", padding: "0 8px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", cursor: "pointer" }}>
          <option value="all">{es ? "Todos los tipos" : "All types"}</option>
          {Object.entries(TIPO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div style={{ marginLeft: "auto", fontSize: "12px", color: "var(--color-text-muted)" }}>
          {filtered.length} {es ? "asientos" : "entries"}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 90px 110px 110px 60px", padding: "8px 16px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          <span>{co.fecha    ?? "Fecha"}</span>
          <span>{co.concepto ?? "Concepto"}</span>
          <span style={{ textAlign: "center" }}>{co.tipo    ?? "Tipo"}</span>
          <span style={{ textAlign: "right"  }}>{co.cargo   ?? "Cargo"}</span>
          <span style={{ textAlign: "right"  }}>{co.abono   ?? "Abono"}</span>
          <span style={{ textAlign: "center" }}>Mon.</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
            {co.sinMovimientos ?? "Sin movimientos en el período"}
          </div>
        ) : filtered.map((a, i) => {
          const tc = TIPO_CONFIG[a.tipo] ?? TIPO_CONFIG.ajuste;
          return (
            <div key={a.id} style={{ display: "grid", gridTemplateColumns: "90px 1fr 90px 110px 110px 60px", padding: "9px 16px", borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                {new Date(a.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{a.concepto}</div>
                {a.referencia && <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{a.referencia}</div>}
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: tc.bg, color: tc.color }}>
                  {tc.label}
                </span>
              </div>
              <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: a.cargo > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
                {fmt(a.cargo)}
              </div>
              <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: a.abono > 0 ? "var(--color-success-text)" : "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
                {fmt(a.abono)}
              </div>
              <div style={{ textAlign: "center", fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)" }}>{a.moneda}</div>
            </div>
          );
        })}

        {/* Totales */}
        {filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 90px 110px 110px 60px", padding: "10px 16px", background: "var(--color-bg-subtle)", borderTop: "2px solid var(--color-border-faint)" }}>
            <span />
            <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-text-primary)" }}>TOTALES</span>
            <span />
            <span style={{ textAlign: "right", fontSize: "13px", fontWeight: 900, color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
              ${Number(totalCargos).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </span>
            <span style={{ textAlign: "right", fontSize: "13px", fontWeight: 900, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
              ${Number(totalAbonos).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </span>
            <span />
          </div>
        )}
      </div>
    </div>
  );
}
