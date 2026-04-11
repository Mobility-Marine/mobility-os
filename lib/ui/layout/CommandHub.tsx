"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { navSections } from "./navConfig";

interface CommandHubProps {
  open: boolean;
  onClose: () => void;
  companyId: string | null;
  userId: string | null;
}

export default function CommandHub({
  open,
  onClose,
  companyId,
  userId,
}: CommandHubProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResult(null);
    }
  }, [open]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const allItems = navSections.flatMap((s) =>
    s.items.map((item) => ({ ...item, section: s.title }))
  );

  const filtered = query.trim()
    ? allItems.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.path.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  async function handleAI() {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query, companyId, userId }),
      });
      const data = await res.json();
      setResult(data.result ?? "Sin respuesta.");
    } catch {
      setResult("Error al conectar con la IA.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "10vh",
        zIndex: 300,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(600px, 92vw)",
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-xl)",
          overflow: "hidden",
        }}
      >
        {/* INPUT */}
        <div style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--color-border-faint)",
          display: "flex",
          gap: "8px",
        }}>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAI()}
            placeholder="Escribe un módulo, comando o pregunta para la IA…"
            style={{
              flex: 1,
              height: "40px",
              border: "none",
              background: "transparent",
              color: "var(--color-text-primary)",
              fontSize: "15px",
              outline: "none",
            }}
          />
          <button
            onClick={handleAI}
            style={{
              height: "40px",
              padding: "0 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-brand-orange)",
              color: "#ffffff",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Ejecutar
          </button>
        </div>

        {/* RESULTADO IA */}
        {(loading || result) && (
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--color-border-faint)",
            background: "var(--color-bg-subtle)",
            fontSize: "13px",
            color: loading ? "var(--color-text-muted)" : "var(--color-text-primary)",
            whiteSpace: "pre-wrap",
            maxHeight: "180px",
            overflowY: "auto",
          }}>
            {loading ? "Consultando IA…" : result}
          </div>
        )}

        {/* NAVEGACIÓN */}
        <div style={{ maxHeight: "340px", overflowY: "auto", padding: "8px" }}>
          {filtered.map((item) => (
            <button
              key={item.path}
              onClick={() => { router.push(item.path); onClose(); }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <span style={{ fontSize: "14px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                {item.name}
              </span>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                {item.section}
              </span>
            </button>
          ))}
        </div>

        {/* FOOTER */}
        <div style={{
          padding: "8px 16px",
          borderTop: "1px solid var(--color-border-faint)",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "var(--color-text-muted)",
        }}>
          <span>↵ para ejecutar IA</span>
          <span>ESC para cerrar</span>
        </div>
      </div>
    </div>
  );
}
