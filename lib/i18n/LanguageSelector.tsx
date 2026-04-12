"use client";

import React from "react";
import { useTranslation, Language } from "./useTranslation";

const FLAGS: Record<Language, string> = {
  es: "ES",
  en: "EN",
};

export default function LanguageSelector() {
  const { lang, changeLanguage } = useTranslation();

  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {(["es", "en"] as Language[]).map((l) => (
        <button
          key={l}
          onClick={() => changeLanguage(l)}
          style={{
            height: "28px",
            padding: "0 10px",
            borderRadius: "var(--radius-md)",
            border: `1px solid ${lang === l ? "var(--color-brand-blue)" : "var(--color-border)"}`,
            background: lang === l ? "var(--color-brand-blue-light)" : "transparent",
            color: lang === l ? "var(--color-brand-blue)" : "var(--color-text-muted)",
            fontSize: "11px",
            fontWeight: lang === l ? 700 : 400,
            cursor: lang === l ? "default" : "pointer",
            letterSpacing: "0.5px",
            transition: "var(--transition-fast)",
          }}
        >
          {FLAGS[l]}
        </button>
      ))}
    </div>
  );
}
