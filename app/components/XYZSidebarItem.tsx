"use client";
import React, { memo } from "react";
import type { XYZ } from "../types/xyz.types";

type Props = {
  item: XYZ;
  isSelected: boolean;
};

function XYZSidebarItem({ item, isSelected }: Props) {
  return (
    <div style={{
      padding: "9px 11px",
      borderRadius: "var(--radius-md)",
      background: isSelected ? "var(--color-bg-active)" : "var(--color-bg-subtle)",
      border: isSelected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border-faint)",
      display: "grid",
      gap: "4px",
      height: "calc(100% - 5px)",
      boxSizing: "border-box",
    }}>
      {/* Layout adaptado al dominio */}
      {/* Row 1: identificador principal + status badge */}
      {/* Row 2: descripción / cliente / etc. */}
      {/* Row 3: métricas relevantes (precio, fecha, etc.) */}
    </div>
  );
}

export default memo(XYZSidebarItem, (prev, next) => 
  prev.item.id === next.item.id && 
  prev.item.updated_at === next.item.updated_at && 
  prev.isSelected === next.isSelected
);