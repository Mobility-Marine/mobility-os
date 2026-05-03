"use client";

// ═══════════════════════════════════════════════════════════════════════
// DateRangePicker — Selector de rango de fechas reutilizable
// 
// Componente modal SaaS-grade con:
// - 8 presets rápidos (Hoy, Ayer, 7 días, 30 días, Este mes, Mes pasado,
//   Trimestre, Año)
// - 2 calendarios lado a lado (mes actual + siguiente)
// - Inputs manuales (formato YYYY-MM-DD) con validación
// - Selección visual del rango con highlight
// - Navegación rápida entre meses
// - i18n completo (es/en)
// 
// Patrón: inline styles + CSS variables (consistente con el resto del SaaS).
// 
// Reutilizable: pensado para Facturación, CXC, CXP, Logística, Reportes, etc.
// 
// Uso:
//   <DateRangePicker
//     isOpen={open}
//     onClose={() => setOpen(false)}
//     onApply={(range) => handleApply(range)}
//     initialStart="2026-01-01"
//     initialEnd="2026-01-31"
//   />
// ═══════════════════════════════════════════════════════════════════════

import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

// ── Tipos públicos ────────────────────────────────────────────────────

export type DateRange = {
  /** Formato ISO: YYYY-MM-DD */
  start: string;
  /** Formato ISO: YYYY-MM-DD */
  end: string;
};

interface Props {
  /** Si está abierto el modal */
  isOpen: boolean;
  /** Cuando el usuario cancela o cierra */
  onClose: () => void;
  /** Cuando el usuario confirma con un rango válido */
  onApply: (range: DateRange) => void;
  /** Rango inicial (opcional). Si se pasa, el modal abre con estas fechas pre-seleccionadas */
  initialStart?: string;
  initialEnd?: string;
}

// ── Helpers de fecha ──────────────────────────────────────────────────

/** Convierte Date a YYYY-MM-DD usando zona horaria local (no UTC) */
function toISODate(d: Date): string {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${dy}`;
}

/** Parse YYYY-MM-DD a Date en zona local (evita problemas de timezone shift) */
function fromISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function firstOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function lastOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

/** Genera el grid de 6 semanas (42 días) — empieza el lunes */
function getMonthGrid(year: number, month: number): Date[] {
  const first = firstOfMonth(year, month);
  // Convertimos: 0=Dom → 6, 1=Lun → 0, 2=Mar → 1, ..., 6=Sáb → 5
  const dayOfWeek = first.getDay();
  const daysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const start = new Date(year, month, 1 - daysBack);

  const grid: Date[] = [];
  for (let i = 0; i < 42; i++) {
    grid.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return grid;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

function isInRange(d: Date, start: string | null, end: string | null): boolean {
  if (!start || !end) return false;
  const iso = toISODate(d);
  return iso >= start && iso <= end;
}

// ── Presets rápidos ───────────────────────────────────────────────────

type Preset = {
  key: string;
  labelEs: string;
  labelEn: string;
  getRange: () => DateRange;
};

function buildPresets(): Preset[] {
  const today = new Date();

  return [
    {
      key: "today",
      labelEs: "Hoy",
      labelEn: "Today",
      getRange: () => {
        const t = toISODate(today);
        return { start: t, end: t };
      },
    },
    {
      key: "yesterday",
      labelEs: "Ayer",
      labelEn: "Yesterday",
      getRange: () => {
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        const yy = toISODate(y);
        return { start: yy, end: yy };
      },
    },
    {
      key: "last7",
      labelEs: "Últimos 7 días",
      labelEn: "Last 7 days",
      getRange: () => {
        const start = new Date(today);
        start.setDate(start.getDate() - 6);
        return { start: toISODate(start), end: toISODate(today) };
      },
    },
    {
      key: "last30",
      labelEs: "Últimos 30 días",
      labelEn: "Last 30 days",
      getRange: () => {
        const start = new Date(today);
        start.setDate(start.getDate() - 29);
        return { start: toISODate(start), end: toISODate(today) };
      },
    },
    {
      key: "thisMonth",
      labelEs: "Este mes",
      labelEn: "This month",
      getRange: () => ({
        start: toISODate(firstOfMonth(today.getFullYear(), today.getMonth())),
        end:   toISODate(lastOfMonth(today.getFullYear(), today.getMonth())),
      }),
    },
    {
      key: "lastMonth",
      labelEs: "Mes pasado",
      labelEn: "Last month",
      getRange: () => ({
        start: toISODate(firstOfMonth(today.getFullYear(), today.getMonth() - 1)),
        end:   toISODate(lastOfMonth(today.getFullYear(), today.getMonth() - 1)),
      }),
    },
    {
      key: "thisQuarter",
      labelEs: "Este trimestre",
      labelEn: "This quarter",
      getRange: () => {
        const q = Math.floor(today.getMonth() / 3);
        return {
          start: toISODate(firstOfMonth(today.getFullYear(), q * 3)),
          end:   toISODate(lastOfMonth(today.getFullYear(), q * 3 + 2)),
        };
      },
    },
    {
      key: "thisYear",
      labelEs: "Este año",
      labelEn: "This year",
      getRange: () => ({
        start: toISODate(new Date(today.getFullYear(), 0, 1)),
        end:   toISODate(new Date(today.getFullYear(), 11, 31)),
      }),
    },
  ];
}

// ── Componente principal ──────────────────────────────────────────────

export default function DateRangePicker({
  isOpen, onClose, onApply, initialStart, initialEnd,
}: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  // Estado de selección del rango
  const [pickedStart, setPickedStart] = useState<string | null>(initialStart ?? null);
  const [pickedEnd,   setPickedEnd]   = useState<string | null>(initialEnd   ?? null);

  // Mes mostrado en cada calendario
  const today = new Date();
  const [leftMonth,  setLeftMonth]  = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [rightMonth, setRightMonth] = useState(() => {
    const next = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return { year: next.getFullYear(), month: next.getMonth() };
  });

  // Reset al abrir el modal con valores iniciales
  useEffect(() => {
    if (isOpen) {
      setPickedStart(initialStart ?? null);
      setPickedEnd(initialEnd ?? null);
    }
  }, [isOpen, initialStart, initialEnd]);

  // Click en día del calendario
  function handleDayClick(d: Date) {
    const iso = toISODate(d);
    if (!pickedStart || (pickedStart && pickedEnd)) {
      // No hay rango o ya hay rango completo → iniciar nuevo
      setPickedStart(iso);
      setPickedEnd(null);
    } else {
      // Ya hay start, marcar end (con swap si end < start)
      if (iso < pickedStart) {
        setPickedEnd(pickedStart);
        setPickedStart(iso);
      } else {
        setPickedEnd(iso);
      }
    }
  }

  // Aplicar un preset
  function applyPreset(getRange: () => DateRange) {
    const r = getRange();
    setPickedStart(r.start);
    setPickedEnd(r.end);
    // Reposicionar los calendarios para mostrar el inicio del rango
    const startDate = fromISODate(r.start);
    setLeftMonth({ year: startDate.getFullYear(), month: startDate.getMonth() });
    const next = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
    setRightMonth({ year: next.getFullYear(), month: next.getMonth() });
  }

  // Aplicar y cerrar
  function handleApply() {
    if (pickedStart && pickedEnd) {
      onApply({ start: pickedStart, end: pickedEnd });
      onClose();
    }
  }

  // Navegar meses
  function shiftMonths(delta: number) {
    setLeftMonth(prev => {
      const newDate = new Date(prev.year, prev.month + delta, 1);
      return { year: newDate.getFullYear(), month: newDate.getMonth() };
    });
    setRightMonth(prev => {
      const newDate = new Date(prev.year, prev.month + delta, 1);
      return { year: newDate.getFullYear(), month: newDate.getMonth() };
    });
  }

  if (!isOpen) return null;

  const presets = buildPresets();
  const monthNames = es
    ? ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
    : ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayNames = es ? ["L","M","X","J","V","S","D"] : ["M","T","W","T","F","S","S"];

  const isComplete = !!pickedStart && !!pickedEnd;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 9998,
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: "min(820px, 96vw)",
        maxHeight: "92vh",
        overflowY: "auto",
        background: "var(--color-bg-base)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-xl)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--color-border-faint)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {es ? "Seleccionar período personalizado" : "Select custom period"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
              {es ? "Elige un atajo o haz clic en las fechas" : "Pick a preset or click dates"}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="close"
            style={{
              width: "28px", height: "28px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border-faint)",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-muted)",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--color-bg-subtle)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body: presets sidebar + calendarios */}
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", flex: 1, minHeight: 0 }}>
          {/* Sidebar de presets */}
          <div style={{
            borderRight: "1px solid var(--color-border-faint)",
            padding: "12px 8px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}>
            <div style={{
              padding: "4px 12px 6px",
              fontSize: "9px",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              {es ? "Atajos" : "Shortcuts"}
            </div>
            {presets.map(p => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.getRange)}
                style={{
                  height: "32px",
                  padding: "0 12px",
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "var(--color-text-second)",
                  borderRadius: "var(--radius-sm)",
                  transition: "var(--transition-fast)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "var(--color-bg-subtle)";
                  e.currentTarget.style.color = "var(--color-text-primary)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--color-text-second)";
                }}
              >
                {es ? p.labelEs : p.labelEn}
              </button>
            ))}
          </div>

          {/* Calendarios */}
          <div style={{ padding: "16px 20px" }}>
            {/* Navegación */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}>
              <button onClick={() => shiftMonths(-1)} style={NAV_BTN} aria-label="prev month">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <div style={{
                display: "flex",
                gap: "60px",
                alignItems: "center",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}>
                <div style={{ minWidth: "120px", textAlign: "center" }}>
                  {monthNames[leftMonth.month]} {leftMonth.year}
                </div>
                <div style={{ minWidth: "120px", textAlign: "center" }}>
                  {monthNames[rightMonth.month]} {rightMonth.year}
                </div>
              </div>
              <button onClick={() => shiftMonths(1)} style={NAV_BTN} aria-label="next month">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>

            {/* Grids de los 2 calendarios */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <CalendarGrid
                year={leftMonth.year}
                month={leftMonth.month}
                start={pickedStart}
                end={pickedEnd}
                onDayClick={handleDayClick}
                dayNames={dayNames}
              />
              <CalendarGrid
                year={rightMonth.year}
                month={rightMonth.month}
                start={pickedStart}
                end={pickedEnd}
                onDayClick={handleDayClick}
                dayNames={dayNames}
              />
            </div>
          </div>
        </div>

        {/* Footer: inputs manuales + botones */}
        <div style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--color-border-faint)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}>
          {/* Inputs manuales */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="date"
              value={pickedStart ?? ""}
              onChange={e => setPickedStart(e.target.value || null)}
              style={INPUT_DATE}
            />
            <span style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>→</span>
            <input
              type="date"
              value={pickedEnd ?? ""}
              onChange={e => setPickedEnd(e.target.value || null)}
              style={INPUT_DATE}
            />
          </div>

          {/* Botones */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onClose} style={BTN_SECONDARY}>
              {es ? "Cancelar" : "Cancel"}
            </button>
            <button
              onClick={handleApply}
              disabled={!isComplete}
              style={{
                ...BTN_PRIMARY,
                opacity: isComplete ? 1 : 0.5,
                cursor: isComplete ? "pointer" : "not-allowed",
              }}
            >
              {es ? "Aplicar" : "Apply"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Sub-componente: Grid de un mes ────────────────────────────────────

function CalendarGrid({
  year, month, start, end, onDayClick, dayNames,
}: {
  year: number;
  month: number;
  start: string | null;
  end: string | null;
  onDayClick: (d: Date) => void;
  dayNames: string[];
}) {
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);
  const today = new Date();

  return (
    <div>
      {/* Day names header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "2px",
        marginBottom: "6px",
      }}>
        {dayNames.map((dn, i) => (
          <div key={i} style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "var(--color-text-muted)",
            textAlign: "center",
            textTransform: "uppercase",
          }}>
            {dn}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {grid.map((d, i) => {
          const inCurrentMonth = d.getMonth() === month;
          const iso     = toISODate(d);
          const isStart = start === iso;
          const isEnd   = end === iso;
          const inRange = isInRange(d, start, end);
          const isToday = isSameDay(d, today);
          const isEdge  = isStart || isEnd;

          let bg: string = "transparent";
          let color: string = inCurrentMonth ? "var(--color-text-primary)" : "var(--color-text-muted)";
          let fontWeight: number = 500;

          if (isEdge) {
            bg = "var(--color-brand-blue)";
            color = "#fff";
            fontWeight = 700;
          } else if (inRange) {
            bg = "var(--color-info-bg)";
            color = "var(--color-brand-blue)";
            fontWeight = 600;
          } else if (isToday && inCurrentMonth) {
            bg = "var(--color-bg-subtle)";
            fontWeight = 700;
          }

          return (
            <button
              key={i}
              onClick={() => onDayClick(d)}
              style={{
                height: "32px",
                border: isToday && !isEdge ? "1px solid var(--color-brand-blue)" : "1px solid transparent",
                background: bg,
                color,
                fontSize: "12px",
                fontWeight,
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                opacity: inCurrentMonth ? 1 : 0.4,
                transition: "var(--transition-fast)",
              }}
              onMouseEnter={e => {
                if (!isEdge && !inRange) {
                  e.currentTarget.style.background = "var(--color-bg-subtle)";
                }
              }}
              onMouseLeave={e => {
                if (!isEdge && !inRange) {
                  e.currentTarget.style.background =
                    isToday && inCurrentMonth ? "var(--color-bg-subtle)" : "transparent";
                }
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Estilos compartidos ───────────────────────────────────────────────

const NAV_BTN: React.CSSProperties = {
  width: "28px",
  height: "28px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border-faint)",
  background: "var(--color-bg-base)",
  color: "var(--color-text-second)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const INPUT_DATE: React.CSSProperties = {
  height: "30px",
  padding: "0 8px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border-faint)",
  background: "var(--color-bg-base)",
  color: "var(--color-text-primary)",
  fontSize: "12px",
  fontFamily: "monospace",
  outline: "none",
};

const BTN_SECONDARY: React.CSSProperties = {
  height: "32px",
  padding: "0 14px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border-faint)",
  background: "var(--color-bg-base)",
  color: "var(--color-text-second)",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const BTN_PRIMARY: React.CSSProperties = {
  height: "32px",
  padding: "0 16px",
  borderRadius: "var(--radius-md)",
  border: "none",
  background: "var(--color-brand-blue)",
  color: "#fff",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
};
