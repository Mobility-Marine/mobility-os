"use client";
import React, { useState, useMemo } from "react";
import type { XYZ } from "../types/xyz.types";
import VirtualSidebar from "@/app/components/shared/VirtualSidebar";
import { IconInbox } from "@/app/components/shared/Icons";
import XYZSidebarItem from "./XYZSidebarItem";
import { applyFilters, countByStatus, hasActiveFilters, DEFAULT_FILTERS, type XYZFilters } from "./XYZFilters";

type Props = {
  items: XYZ[];
  selected: XYZ | null;
  setSelected: (item: XYZ) => void;
  onCreateNew?: () => void;
};

const ITEM_HEIGHT = 90; // ajustar según diseño del item

export default function XYZSidebar({ items, selected, setSelected, onCreateNew }: Props) {
  const [filters, setFilters] = useState<XYZFilters>(DEFAULT_FILTERS);
  const filtered = useMemo(() => applyFilters(items, filters), [items, filters]);
  const statusCounts = useMemo(() => countByStatus(items), [items]);
  const filtersActive = hasActiveFilters(filters);

  return (
    <VirtualSidebar<XYZ>
      title="<NombreEnEspañol>"
      count={filtered.length}
      totalCount={items.length}
      search={{
        value: filters.search,
        onChange: (v) => setFilters(p => ({ ...p, search: v })),
        placeholder: "Buscar...",
        hint: "Campos buscables del módulo",
      }}
      pillRows={[
        // Adaptar pills a los status/tipos del dominio
      ]}
      advancedSearch={{
        // Configurar según necesidad
      }}
      items={filtered}
      selectedId={selected?.id ?? null}
      onSelect={setSelected}
      getItemId={(i) => i.id}
      itemHeight={ITEM_HEIGHT}
      renderItem={(i, _, isSelected) => <XYZSidebarItem item={i} isSelected={isSelected} />}
      emptyState={{
        icon: <IconInbox size={32} />,
        title: filtersActive ? "Sin resultados" : "Sin <items>",
        description: filtersActive ? "Prueba ajustando filtros" : "Crea el primero",
        action: !filtersActive && onCreateNew ? { label: "Nuevo <item>", onClick: onCreateNew } : undefined,
      }}
    />
  );
}