"use client";
import { useState, useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CFDIDocument } from "../types/facturacion.types";

type Props = { cfdis: CFDIDocument[]; loading: boolean };

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function FacturacionCalendario({ cfdis, loading }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS_ES   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const DAYS_EN   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  function prevMonth() { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); }
  function nextMonth() { if (month === 11) { setMonth(0);  setYear((y) => y + 1); } else setMonth((m) => m + 1); }

  // Calcular días del mes
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth= new Date(year, month + 1, 0).getDate();

  // Agrupar CFDIs por fecha (solo Ingresos válidos = facturas emitidas)
  const byDay = useMemo(() => {
    const map: Record<string, { total: number; count: number; overdue: boolean }> = {};
    const today = new Date(); today.setHours(0, 0, 0, 0);

    for (const cfdi of cfdis) {
      if (cfdi.type !== "I" || cfdi.status === "cancelled") continue;
      const d = cfdi.cfdi_date?.split("T")[0];
      if (!d) continue;
      const [cy, cm, cd] = d.split("-").map(Number);
      if (cy !== year || cm - 1 !== month) continue;
      if (!map[d]) map[d] = { total: 0, count: 0, overdue: false };
      map[d].total += cfdi.total;
      map[d].count++;
      const cfdiDate = new Date(cy, cm - 1, cd);
      if (cfdiDate < today && cfdi.payment_method === "PPD") map[d].overdue = true;
    }
    return map;
  }, [cfdis, year, month]);

  // Totales del mes
  const monthTotal   = Object.values(byDay).reduce((s, v) => s + v.total, 0);
  const monthCount   = Object.values(byDay).reduce((s, v) => s + v.count, 0);
  const overdueTotal = cfdis.filter((c) => c.type === "I" && c.status === "valid" && c.payment_method === "PPD").reduce((s, c) => s + c.total, 0);

  const cells = Array.from({ length: firstDay }, (_, i) => ({ day: 0, key: `empty-${i}` }))
    .concat(Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, key: `day-${i + 1}` })));

  const todayDay = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : -1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Resumen del mes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
        {[
          { l: es ? "Facturado en el mes" : "Billed this month", v: "$" + fmt(monthTotal), sub: `${monthCount} ${es ? "facturas" : "invoices"}`, color: "var(--color-brand-blue)", bg: "var(--color-info-bg)" },
          { l: es ? "Por cobrar (PPD)"   : "Receivable (PPD)",  v: "$" + fmt(overdueTotal), sub: es ? "complementos pendientes" : "pending complements", color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
          { l: es ? "Período"            : "Period",            v: (es ? MONTHS_ES[month] : MONTHS_EN[month]) + " " + year, sub: es ? "mes actual seleccionado" : "selected month", color: "var(--color-text-primary)", bg: "var(--color-bg-base)" },
        ].map((s) => (
          <div key={s.l} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{s.l}</div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: s.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Calendario */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        {/* Nav */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={prevMonth} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-text-primary)" }}>
            {(es ? MONTHS_ES[month] : MONTHS_EN[month])} {year}
          </div>
          <button onClick={nextMonth} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Días de la semana */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--color-border-faint)" }}>
          {(es ? DAYS_ES : DAYS_EN).map((d) => (
            <div key={d} style={{ padding: "8px 4px", textAlign: "center", fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{d}</div>
          ))}
        </div>

        {/* Celdas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {cells.map((cell, i) => {
            if (cell.day === 0) return <div key={cell.key} style={{ minHeight: "80px", borderRight: (i + 1) % 7 !== 0 ? "1px solid var(--color-border-faint)" : "none", borderBottom: "1px solid var(--color-border-faint)", background: "var(--color-bg-subtle)", opacity: 0.4 }} />;

            const dateKey  = `${year}-${String(month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
            const dayData  = byDay[dateKey];
            const isToday  = cell.day === todayDay;

            return (
              <div key={cell.key}
                style={{ minHeight: "80px", padding: "8px", borderRight: (i + 1) % 7 !== 0 ? "1px solid var(--color-border-faint)" : "none", borderBottom: "1px solid var(--color-border-faint)", display: "flex", flexDirection: "column", gap: "4px", background: isToday ? "var(--color-info-bg)" : "transparent", transition: "background 0.1s" }}>
                {/* Número del día */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "11px", fontWeight: isToday ? 800 : 400, color: isToday ? "var(--color-brand-blue)" : "var(--color-text-muted)", width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: isToday ? "var(--color-brand-blue)" : "transparent", color: isToday ? "#fff" : "var(--color-text-muted)" }}>
                    {cell.day}
                  </span>
                </div>

                {/* Datos de facturas */}
                {dayData && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: dayData.overdue ? "var(--color-danger-text)" : "var(--color-success-text)", lineHeight: 1.2 }}>
                      ${fmt(dayData.total)}
                    </div>
                    <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>
                      {dayData.count} {es ? (dayData.count === 1 ? "fact." : "facts.") : (dayData.count === 1 ? "inv." : "invs.")}
                    </div>
                    {dayData.overdue && (
                      <div style={{ marginTop: "2px", width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-danger-text)" }} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "var(--color-text-muted)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)" }} />
          {es ? "Facturación del día" : "Daily billing"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-danger-text)" }} />
          {es ? "PPD pendiente de cobro" : "PPD pending collection"}
        </div>
      </div>
    </div>
  );
}
