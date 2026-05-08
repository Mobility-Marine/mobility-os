"use client";

import React from "react";
import { IconFileText } from "../../Icons";

// ═══════════════════════════════════════════════════════════════════
// WORKSPACE EMPTY STATE — Cuando no hay cotización seleccionada
//
// Se muestra al lado derecho cuando el usuario aún no ha seleccionado
// nada del sidebar. Patrón Linear/Notion: guía visual amable.
// ═══════════════════════════════════════════════════════════════════

type Props = {
  loading?: boolean;
};

export default function WorkspaceEmptyState({ loading = false }: Props) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "40px",
        background: "var(--color-bg-base)",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-full)",
          background: "var(--color-bg-subtle)",
          border: "1px solid var(--color-border-faint)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-muted)",
          opacity: 0.6,
        }}
      >
        <IconFileText size={26} />
      </div>

      <div
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: "var(--color-text-primary)",
        }}
      >
        {loading ? "Cargando cotización…" : "Selecciona una cotización"}
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "var(--color-text-muted)",
          textAlign: "center",
          maxWidth: "300px",
          lineHeight: 1.5,
        }}
      >
        {loading
          ? "Estamos preparando los detalles, conceptos y totales."
          : "Elige una cotización del sidebar izquierdo para ver sus detalles, conceptos, totales y opciones de envío."}
      </div>
    </div>
  );
}