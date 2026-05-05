"use client";

// ════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE — Layout ERP-grade con sidebar de categorías + cards
// ════════════════════════════════════════════════════════════════════════
// Patrón inspirado en SAP S/4HANA, Oracle NetSuite y Odoo:
//   - Sidebar izquierdo con 6 categorías
//   - Panel derecho que renderiza la categoría activa
//   - Cada categoría muestra un grid de cards
//   - Click en card abre drawer lateral con la configuración detallada
//
// Permisos:
//   - "Mi cuenta": accesible para todos los usuarios
//   - "Empresa", "Operación", "Fiscal", "Integraciones", "Plataforma":
//     requieren canManageCompany (admin / owner)
//
// La categoría activa se persiste en la URL (?cat=operacion) para permitir
// deep-linking y refresh sin perder estado.
// ════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { usePermissions } from "@/lib/auth/usePermissions";

import MiCuentaCategory       from "./categories/MiCuentaCategory";
import EmpresaCategory        from "./categories/EmpresaCategory";
import OperacionCategory      from "./categories/OperacionCategory";
import FiscalCategory         from "./categories/FiscalCategory";
import IntegracionesCategory  from "./categories/IntegracionesCategory";
import PlataformaCategory     from "./categories/PlataformaCategory";

// ── Tipos y constantes ────────────────────────────────────────────────

type CategoryKey =
  | "mi_cuenta"
  | "empresa"
  | "operacion"
  | "fiscal"
  | "integraciones"
  | "plataforma";

type CategoryDef = {
  key:        CategoryKey;
  label:      string;
  icon:       string;        // emoji
  description: string;
  adminOnly:  boolean;
};

const CATEGORIES: CategoryDef[] = [
  {
    key:         "mi_cuenta",
    label:       "Mi cuenta",
    icon:        "👤",
    description: "Tu perfil personal y preferencias.",
    adminOnly:   false,
  },
  {
    key:         "empresa",
    label:       "Empresa",
    icon:        "🏢",
    description: "Identidad fiscal, marca, contacto y plantillas.",
    adminOnly:   true,
  },
  {
    key:         "operacion",
    label:       "Operación",
    icon:        "⚙️",
    description: "Numeración de documentos, márgenes y objetivos.",
    adminOnly:   true,
  },
  {
    key:         "fiscal",
    label:       "Fiscal y CFDI",
    icon:        "💼",
    description: "Series CFDI, sellos digitales y configuración del PAC.",
    adminOnly:   true,
  },
  {
    key:         "integraciones",
    label:       "Datos e integraciones",
    icon:        "🔌",
    description: "Importación, exportación y conectores externos.",
    adminOnly:   true,
  },
  {
    key:         "plataforma",
    label:       "Plataforma",
    icon:        "🚀",
    description: "Usuarios, suscripción y soporte.",
    adminOnly:   true,
  },
];

// ════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════

export default function SettingsPage() {
  const { canManageCompany, loading: permLoading } = usePermissions();
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  // ── Categoría activa (sincronizada con URL) ─────────────────────────
  const urlCategory = (searchParams?.get("cat") ?? "mi_cuenta") as CategoryKey;
  const isValidCategory = CATEGORIES.some((c) => c.key === urlCategory);
  const initialCategory: CategoryKey = isValidCategory ? urlCategory : "mi_cuenta";
  const [activeCategory, setActiveCategory] = useState<CategoryKey>(initialCategory);

  // Sincronizar URL ↔ estado al montar y cuando cambia ?cat
  useEffect(() => {
    if (isValidCategory && urlCategory !== activeCategory) {
      setActiveCategory(urlCategory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCategory]);

  const handleSelectCategory = (key: CategoryKey) => {
    setActiveCategory(key);
    // Actualizar URL sin recargar
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("cat", key);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // ── Filtrar categorías según permisos ───────────────────────────────
  const visibleCategories = CATEGORIES.filter(
    (c) => !c.adminOnly || canManageCompany,
  );

  // Si la categoría activa no es visible para el usuario, redirigir a Mi cuenta
  useEffect(() => {
    if (!visibleCategories.some((c) => c.key === activeCategory)) {
      setActiveCategory("mi_cuenta");
    }
  }, [activeCategory, visibleCategories]);

  // ── Loading ─────────────────────────────────────────────────────────
  if (permLoading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <div style={{ fontSize: "14px", color: "var(--fg-muted, #64748b)" }}>
          Cargando…
        </div>
      </div>
    );
  }

  const activeDef = CATEGORIES.find((c) => c.key === activeCategory) ?? CATEGORIES[0];

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header de la página */}
      <header>
        <h1
          style={{
            margin:     "0 0 6px",
            fontSize:   "26px",
            fontWeight: 700,
            color:      "var(--fg, #0f172a)",
            lineHeight: 1.2,
          }}
        >
          Configuración
        </h1>
        <p
          style={{
            margin:     0,
            fontSize:   "14px",
            color:      "var(--fg-muted, #64748b)",
          }}
        >
          Personaliza tu cuenta, tu empresa y la operación de Mobility OS.
        </p>
      </header>

      {/* Layout: sidebar + contenido */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "240px 1fr",
          gap:                 "24px",
          alignItems:          "start",
        }}
      >
        {/* Sidebar de categorías */}
        <aside
          style={{
            position:     "sticky",
            top:          "24px",
            display:      "flex",
            flexDirection: "column",
            gap:          "4px",
            padding:      "10px",
            borderRadius: "14px",
            background:   "var(--surface, var(--bg-elevated, #ffffff))",
            border:       "1px solid var(--border-subtle, rgba(148,163,184,0.15))",
            boxShadow:    "0 1px 3px rgba(15,23,42,0.04)",
          }}
        >
          {visibleCategories.map((cat) => {
            const isActive = cat.key === activeCategory;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleSelectCategory(cat.key)}
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  gap:            "10px",
                  padding:        "10px 12px",
                  border:         "none",
                  borderRadius:   "10px",
                  cursor:         "pointer",
                  textAlign:      "left",
                  fontSize:       "14px",
                  fontWeight:     isActive ? 600 : 500,
                  color:          isActive
                    ? "var(--accent, #2563eb)"
                    : "var(--fg, #0f172a)",
                  background:     isActive
                    ? "var(--surface-active, rgba(37,99,235,0.08))"
                    : "transparent",
                  transition:     "all 120ms ease",
                  width:          "100%",
                }}
                onMouseEnter={(e) => {
                  if (isActive) return;
                  e.currentTarget.style.background = "var(--surface-hover, rgba(148,163,184,0.06))";
                }}
                onMouseLeave={(e) => {
                  if (isActive) return;
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: "16px", flexShrink: 0 }}>{cat.icon}</span>
                <span style={{ flex: 1 }}>{cat.label}</span>
                {isActive && (
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                )}
              </button>
            );
          })}
        </aside>

        {/* Panel de contenido */}
        <section style={{ minWidth: 0 }}>
          {/* Encabezado de la categoría */}
          <div
            style={{
              display:        "flex",
              alignItems:     "center",
              gap:            "14px",
              marginBottom:   "20px",
              paddingBottom:  "16px",
              borderBottom:   "1px solid var(--border-subtle, rgba(148,163,184,0.15))",
            }}
          >
            <div
              style={{
                width:          "44px",
                height:         "44px",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                borderRadius:   "12px",
                background:     "var(--surface-soft, rgba(148,163,184,0.10))",
                fontSize:       "22px",
              }}
            >
              {activeDef.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  margin:     0,
                  fontSize:   "18px",
                  fontWeight: 600,
                  color:      "var(--fg, #0f172a)",
                  lineHeight: 1.3,
                }}
              >
                {activeDef.label}
              </h2>
              <p
                style={{
                  margin:     "2px 0 0",
                  fontSize:   "13px",
                  color:      "var(--fg-muted, #64748b)",
                }}
              >
                {activeDef.description}
              </p>
            </div>
          </div>

          {/* Render de la categoría activa */}
          <div>
            {activeCategory === "mi_cuenta"     && <MiCuentaCategory />}
            {activeCategory === "empresa"       && <EmpresaCategory />}
            {activeCategory === "operacion"     && <OperacionCategory />}
            {activeCategory === "fiscal"        && <FiscalCategory />}
            {activeCategory === "integraciones" && <IntegracionesCategory />}
            {activeCategory === "plataforma"    && <PlataformaCategory />}
          </div>
        </section>
      </div>
    </div>
  );
}