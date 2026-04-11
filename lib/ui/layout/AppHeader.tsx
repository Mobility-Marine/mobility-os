"use client";
import { useState, useEffect } from "react";
interface AppHeaderProps {
  section: string;
  title: string;
  onOpenHub: () => void;
  onSearch: (query: string) => void;
}
export default function AppHeader({ section, title, onOpenHub, onSearch }: AppHeaderProps) {
  const [query, setQuery] = useState("");
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem("mos-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark((saved ?? (prefersDark ? "dark" : "light")) === "dark");
  }, []);
  function toggleTheme() {
    const next = isDark ? "light" : "dark";
    setIsDark(!isDark);
    localStorage.setItem("mos-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  }
  return (
    <header style={{ height: "var(--header-height)", background: "var(--color-bg-base)", borderBottom: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", gap: "16px", flexShrink: 0 }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
          {section}
        </div>
        <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1.2 }}>
          {title}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, justifyContent: "flex-end" }}>
        <form onSubmit={handleSearch} style={{ flex: "1 1 0", maxWidth: "280px" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar o ejecutar…"
            style={{ width: "100%", height: "34px", padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "13px", outline: "none" }}
          />
        </form>
        <button
          onClick={toggleTheme}
          title={isDark ? "Modo claro" : "Modo oscuro"}
          style={{ width: "34px", height: "34px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}
        >
          {isDark ? "☀️" : "🌙"}
        </button>
        <button
          onClick={onOpenHub}
          style={{ height: "34px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#ffffff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
        >
          IA
        </button>
      </div>
    </header>
  );
}
