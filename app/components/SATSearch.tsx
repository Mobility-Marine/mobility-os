"use client";

// ═══════════════════════════════════════════════════════════════════════
// SATSearch — Componente reutilizable para búsqueda de claves SAT
// Estilos: inline + CSS variables (consistente con todo el proyecto)
//
// Conecta con /api/sat?type={products|units}&q={query} que a su vez
// consulta el catálogo oficial del SAT vía Facturapi (~52,000 productos
// y ~2,400 unidades de medida).
//
// Uso típico:
//   <SATSearch
//     type="products"
//     value={form.product_key}
//     onChange={(code) => setForm({...form, product_key: code})}
//     placeholder="Buscar producto SAT..."
//     required
//   />
//
// En tablas compactas (ej: filas de conceptos del CFDI), usar inputStyle
// para reducir el alto:
//   <SATSearch
//     type="products"
//     value={c.product_key}
//     onChange={code => setC({...c, product_key: code})}
//     inputStyle={{ height: "32px", fontSize: "12px" }}
//   />
//
// Si el padre quiere evitar el fetch del nombre al cargar (porque ya lo
// tiene guardado), puede pasar initialLabel:
//   <SATSearch
//     value={form.product_key}
//     initialLabel={form.product_label}  // ← evita el fetch inicial
//     onChange={(code, label) => setForm({...form, product_key: code, product_label: label})}
//   />
//
// CARACTERÍSTICAS:
// - Cache global de búsquedas y lookups (no repite requests)
// - Debounce automático de 350ms al escribir
// - Navegación con teclado: flechas, Enter, Escape
// - Botón limpiar (X) cuando hay valor seleccionado
// - Display "código — descripción" cuando hay valor
// - Auto-fetch del nombre cuando recibe un código sin label
// - Estados: loading, error, vacío, sin resultados
// - Accesibilidad básica (aria-*)
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Tipos públicos ───
export type SATCatalogType = "products" | "units";

export type SATItem = {
  key: string;
  name: string;
};

export type SATSearchProps = {
  /** Código SAT actualmente seleccionado (solo el código, ej: "78101800") */
  value: string;
  /** Callback al seleccionar o limpiar. Devuelve código + nombre opcional. */
  onChange: (code: string, label?: string) => void;
  /** Tipo de catálogo: products = c_ClaveProdServ, units = c_ClaveUnidad */
  type: SATCatalogType;
  /** Placeholder del input cuando está vacío */
  placeholder?: string;
  /** Si el campo es obligatorio (asterisco visual + aria-required) */
  required?: boolean;
  /** Deshabilita el input y el botón limpiar */
  disabled?: boolean;
  /** Estado visual de error (border rojo) */
  error?: boolean;
  /** Etiqueta del valor pre-conocida por el padre (evita fetch inicial) */
  initialLabel?: string;
  /** Tamaño del input. md (36px) por default, sm (32px) para listas compactas */
  size?: "sm" | "md";
  /** Estilos extra para el input (height, fontSize, etc.). Se mergea con el style base. */
  inputStyle?: React.CSSProperties;
  /** ID para accesibilidad y testing */
  id?: string;
};

// ─── Cache global compartido entre instancias ───
// Usamos Map para mantener orden y evitar memory leaks de objetos.
const searchCache = new Map<string, SATItem[]>();
const lookupCache = new Map<string, SATItem | null>();
const inFlightSearch = new Map<string, Promise<SATItem[]>>();
const inFlightLookup = new Map<string, Promise<SATItem | null>>();

const cacheKey = (type: SATCatalogType, q: string) => `${type}:${q.toLowerCase().trim()}`;

// ─── Función de búsqueda con cache y deduplicación ───
async function searchSAT(type: SATCatalogType, q: string): Promise<SATItem[]> {
  if (!q || q.length < 2) return [];
  const key = cacheKey(type, q);
  if (searchCache.has(key)) return searchCache.get(key)!;
  if (inFlightSearch.has(key)) return inFlightSearch.get(key)!;

  const promise = (async () => {
    try {
      const res = await fetch(`/api/sat?type=${type}&q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: SATItem[] = (data.data ?? []).slice(0, 20);
      searchCache.set(key, items);
      return items;
    } catch (err) {
      // No cachear errores: permitir reintentar
      throw err;
    }
  })();

  inFlightSearch.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlightSearch.delete(key);
  }
}

// ─── Lookup exacto de un código (para mostrar nombre al cargar) ───
async function lookupSAT(type: SATCatalogType, code: string): Promise<SATItem | null> {
  if (!code) return null;
  const key = cacheKey(type, code);
  if (lookupCache.has(key)) return lookupCache.get(key)!;
  if (inFlightLookup.has(key)) return inFlightLookup.get(key)!;

  const promise = (async () => {
    try {
      const items = await searchSAT(type, code);
      // Buscar match exacto del código (Facturapi puede devolver varios)
      const exact = items.find(i => i.key === code) ?? null;
      lookupCache.set(key, exact);
      return exact;
    } catch {
      return null;
    }
  })();

  inFlightLookup.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlightLookup.delete(key);
  }
}

// ─── Componente ───
export function SATSearch({
  value,
  onChange,
  type,
  placeholder,
  required,
  disabled,
  error,
  initialLabel,
  size = "md",
  inputStyle,
  id,
}: SATSearchProps) {
  // ─── Estados internos ───
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SATItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [resolvedLabel, setResolvedLabel] = useState<string>(initialLabel ?? "");

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSearchRef = useRef<string>("");

  // ─── Estado visual derivado ───
  const hasValue = !!value;
  const showSelected = hasValue && !open;
  const displayValue = showSelected
    ? (resolvedLabel ? `${value} — ${resolvedLabel}` : value)
    : searchTerm;

  // ─── Resolver label del value cuando cambia (al cargar) ───
  useEffect(() => {
    if (initialLabel) {
      setResolvedLabel(initialLabel);
      return;
    }
    if (!value) {
      setResolvedLabel("");
      return;
    }
    let cancelled = false;
    lookupSAT(type, value).then(item => {
      if (cancelled) return;
      setResolvedLabel(item?.name ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [value, type, initialLabel]);

  // ─── Debounced search ───
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults([]);
      setHighlightIdx(-1);
      return;
    }
    if (searchTerm === lastSearchRef.current) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      lastSearchRef.current = searchTerm;
      try {
        const items = await searchSAT(type, searchTerm);
        setResults(items);
        setHighlightIdx(items.length > 0 ? 0 : -1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, type]);

  // ─── Cerrar al hacer click fuera ───
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearchTerm("");
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ─── Handlers ───
  const handleSelect = useCallback(
    (item: SATItem) => {
      lookupCache.set(cacheKey(type, item.key), item);
      setResolvedLabel(item.name);
      setSearchTerm("");
      setResults([]);
      setOpen(false);
      onChange(item.key, item.name);
    },
    [type, onChange]
  );

  const handleClear = useCallback(() => {
    if (disabled) return;
    setSearchTerm("");
    setResults([]);
    setResolvedLabel("");
    setOpen(false);
    onChange("", undefined);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled, onChange]);

  const handleFocus = useCallback(() => {
    setOpen(true);
    if (hasValue) {
      // Al hacer focus en un valor seleccionado, limpiar para permitir nueva búsqueda
      setSearchTerm("");
    }
  }, [hasValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          setOpen(true);
          e.preventDefault();
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx(idx => Math.min(idx + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx(idx => Math.max(idx - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightIdx >= 0 && results[highlightIdx]) {
          handleSelect(results[highlightIdx]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        setSearchTerm("");
      } else if (e.key === "Tab") {
        setOpen(false);
      }
    },
    [open, results, highlightIdx, handleSelect]
  );

  // ─── Estilos ───
  const inputHeight = size === "sm" ? 32 : 36;
  const fontSize = size === "sm" ? 12 : 13;

  const baseInputStyle: React.CSSProperties = {
    width: "100%",
    height: `${inputHeight}px`,
    padding: hasValue && !open ? "0 64px 0 34px" : "0 34px 0 34px",
    borderRadius: "var(--radius-md)",
    border: error
      ? "1px solid var(--color-danger-text)"
      : "1px solid var(--color-border)",
    background: disabled ? "var(--color-bg-subtle)" : "var(--color-bg-base)",
    color: "var(--color-text-primary)",
    fontSize: `${fontSize}px`,
    outline: "none",
    boxSizing: "border-box",
    cursor: disabled ? "not-allowed" : "text",
    fontFamily: showSelected && resolvedLabel ? "inherit" : "monospace",
    ...inputStyle,
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {/* ── Input con icono y botón limpiar ── */}
      <div style={{ position: "relative" }}>
        {/* Icono de búsqueda */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth="2"
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        {/* Input */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={displayValue}
          onChange={e => {
            setSearchTerm(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? (type === "products" ? "Buscar producto SAT..." : "Buscar unidad SAT...")}
          disabled={disabled}
          required={required}
          aria-required={required}
          aria-invalid={error}
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          style={baseInputStyle}
        />

        {/* Indicador loading */}
        {loading && (
          <div style={{
            position: "absolute",
            right: hasValue && !open ? "38px" : "12px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            border: "2px solid var(--color-border)",
            borderTopColor: "var(--color-brand-blue)",
            animation: "satspin 0.7s linear infinite",
            pointerEvents: "none",
          }} />
        )}

        {/* Botón limpiar */}
        {hasValue && !open && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            title="Limpiar selección"
            aria-label="Limpiar selección"
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "22px",
              height: "22px",
              padding: 0,
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: "transparent",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "var(--transition-fast)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "var(--color-bg-hover)";
              e.currentTarget.style.color = "var(--color-text-primary)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--color-text-muted)";
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Animación spinner (CSS via style global inline) ── */}
      <style>{`@keyframes satspin{to{transform:translateY(-50%) rotate(360deg)}}`}</style>

      {/* ── Dropdown con resultados ── */}
      {open && (results.length > 0 || (searchTerm.length >= 2 && !loading)) && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 999,
            background: "var(--color-bg-base)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-xl)",
            maxHeight: "260px",
            overflowY: "auto",
          }}
        >
          {results.length > 0 ? (
            results.map((item, idx) => {
              const isHighlighted = idx === highlightIdx;
              return (
                <div
                  key={item.key}
                  role="option"
                  aria-selected={isHighlighted}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  style={{
                    padding: "9px 12px",
                    cursor: "pointer",
                    fontSize: "12px",
                    borderBottom: idx < results.length - 1 ? "1px solid var(--color-border-faint)" : "none",
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                    background: isHighlighted ? "var(--color-brand-blue-light)" : "transparent",
                    transition: "var(--transition-fast)",
                  }}
                >
                  <span style={{
                    fontWeight: 700,
                    color: "var(--color-brand-blue)",
                    fontFamily: "monospace",
                    flexShrink: 0,
                    fontSize: "12px",
                    minWidth: "70px",
                  }}>
                    {item.key}
                  </span>
                  <span style={{
                    color: "var(--color-text-second)",
                    fontSize: "12px",
                    lineHeight: 1.4,
                  }}>
                    {item.name}
                  </span>
                </div>
              );
            })
          ) : (
            <div style={{
              padding: "16px 12px",
              textAlign: "center",
              fontSize: "12px",
              color: "var(--color-text-muted)",
              lineHeight: 1.5,
            }}>
              <div style={{ marginBottom: "4px" }}>
                Sin resultados para <strong>"{searchTerm}"</strong>
              </div>
              <div style={{ fontSize: "11px", opacity: 0.8 }}>
                Intenta con otra palabra clave o el código SAT directo
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Hint mientras escribe pocos caracteres ── */}
      {open && searchTerm.length > 0 && searchTerm.length < 2 && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          zIndex: 999,
          padding: "10px 12px",
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-md)",
          fontSize: "11px",
          color: "var(--color-text-muted)",
          textAlign: "center",
        }}>
          Escribe al menos 2 caracteres para buscar
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helper: invalidar cache (útil después de cambios en BD/Facturapi)
// ─────────────────────────────────────────────────────────────
export function invalidateSATSearchCache() {
  searchCache.clear();
  lookupCache.clear();
}
