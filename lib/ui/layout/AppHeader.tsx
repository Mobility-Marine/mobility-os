"use client";

import React, { useState, useEffect } from "react";

interface AppHeaderProps {
  section: string;
  title: string;
  onOpenHub: () => void;
  onSearch: (query: string) => void;
}

export default function AppHeader({
  section,
  title,
  onOpenHub,
  onSearch,
}: AppHeaderProps) {
  const [query, setQuery] = useState("");
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("mos-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved ?? (prefersDark ? "dark" : "light");
    setIsDark(theme === "dark");
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
    <header
      style={{
        height: "var(--header-height)",
        background: "var(--color-bg-base)",
        borderBottom: "1px solid var(--color-border-faint)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        gap: "16px",
        flexShrink: 0,
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
          }}
        >
          {section}
        </div>
        <div
          style={{
            fontSize: "20px",
            fontWeight:
