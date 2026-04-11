"use client";

import { useRef, useState } from "react";
import { WidgetSize } from "../hooks/useLayout";

const colSpan: Record<WidgetSize, string> = {
  small:  "span 1",
  medium: "span 2",
  large:  "span 3",
  full:   "span 4",
};

const sizeLabels: { key: WidgetSize; label: string }[] = [
  { key: "small",  label: "Pequeño" },
  { key: "medium", label: "Mediano" },
  { key: "large",  label: "Grande"  },
  { key: "full",   label: "Completo"},
];

interface WidgetShellProps {
  id: string;
  size: WidgetSize;
  editMode: boolean;
  isDraggingOver: boolean;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDrop: (id: string) => void;
  onResize: (id: string, size: WidgetSize) => void;
  onHide: (id: string) => void;
  children: React.ReactNode;
}

export default function WidgetShell({
  id, size, editMode, isDraggingOver,
  onDragStart, onDragOver, onDrop,
  onResize, onHide, children,
}: WidgetShellProps) {
  const [showMenu, setShowMenu] = useState(false);
  const dragCounter = useRef(0);

  return (
    <div
      draggable={editMode}
      onDragStart={() => onDragStart(id)}
      onDragEnter={() => { dragCounter.current++; onDragOver(id); }}
      onDragLeave={() => { dragCounter.current--; if (dragCounter.current === 0) onDragOver(""); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); dragCounter.current = 0; onDrop(id); }}
      style={{
        gridColumn: colSpan[size],
        position: "relative",
        borderRadius: "var(--radius-lg)",
        transition: "var(--transition-normal)",
        outline: isDraggingOver
          ? "2px dashed var(--color-brand-blue)"
          : editMode
          ? "2px dashed var(--color-border)"
          : "2px solid transparent",
        outlineOffset: "2px",
        opacity: isDraggingOver ? 0.7 : 1,
        cursor: editMode ? "grab" : "default",
        userSelect: "none",
      }}
    >
      {editMode && (
        <div style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          zIndex: 10,
          display: "flex",
          gap: "4px",
        }}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-bg-base)",
              border: "1px solid var(--color-border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </button>

          {showMenu && (
            <div style={{
              position: "absolute",
              top: "32px",
              right: 0,
              background: "var(--color-bg-base)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-lg)",
              padding: "6px",
              display: "grid",
              gap: "2px",
              minWidth: "140px",
              zIndex: 20,
            }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", padding: "4px 8px", letterSpacing: "0.8px", textTransform: "uppercase" }}>
                Tamaño
              </div>
              {sizeLabels.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { onResize(id, key); setShowMenu(false); }}
                  style={{
                    textAlign: "left",
                    padding: "7px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: size === key ? "var(--color-bg-active)" : "transparent",
                    color: size === key ? "var(--color-brand-blue)" : "var(--color-text-second)",
                    fontSize: "13px",
                    fontWeight: size === key ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
              <div style={{ borderTop: "1px solid var(--color-border-faint)", margin: "4px 0" }} />
              <button
                onClick={() => { onHide(id); setShowMenu(false); }}
                style={{
                  textAlign: "left",
                  padding: "7px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: "transparent",
                  color: "var(--color-danger-text)",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Ocultar
              </button>
            </div>
          )}
        </div>
      )}

      {editMode && (
        <div style={{
          position: "absolute",
          top: "8px",
          left: "8px",
          zIndex: 10,
          width: "28px",
          height: "28px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--shadow-md)",
          cursor: "grab",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </div>
      )}

      {children}
    </div>
  );
}
