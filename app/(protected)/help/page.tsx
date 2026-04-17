"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useRouter } from "next/navigation";

type Section = "guia" | "atajos" | "soporte" | "changelog";

// ── CATÁLOGO COMPLETO DE MÓDULOS ──────────────────────────────
const MODULE_AREAS = [
  {
    area: "General",
    icon: "🌐",
    color: "var(--color-brand-blue)",
    modules: [
      {
        name: "Dashboard",
        icon: "📊",
        desc: "Centro de mando ejecutivo. Vista consolidada de toda la operación en tiempo real: alertas activas, KPIs críticos, estado del pipeline, servicios del día y Mobility AI para consultas instantáneas.",
        tips: ["Usa el Command Hub (Ctrl+K) para ejecutar acciones sin navegar", "Las alertas rojas requieren atención inmediata — haz clic para ir directo al módulo", "El widget de IA sugiere acciones proactivas basadas en el estado actual"],
      },
      {
        name: "Agenda",
        icon: "📅",
        desc: "Calendario de actividades comerciales y operativas. Registra reuniones, seguimientos, llamadas y tareas. Se conectará próximamente con Google Calendar, Outlook y Apple Calendar.",
        tips: ["Vincula eventos directamente a prospectos o clientes para tener contexto", "Los recordatorios automáticos se activarán con la integración OAuth", "Filtra por tipo de actividad para enfocarte en lo más importante"],
      },
    ],
  },
  {
    area: "Comercial",
    icon: "💼",
    color: "#10b981",
    modules: [
      {
        name: "Prospectos",
        icon: "🎯",
        desc: "Pipeline visual de oportunidades comerciales. Gestiona el ciclo de vida completo de cada prospecto desde el primer contacto hasta la conversión en cliente.",
        tips: ["Arrastra tarjetas entre etapas del pipeline para actualizar el estado", "Usa el Copilot de IA para generar análisis de riesgo y recomendaciones de seguimiento", "Los prospectos sin contacto en +7 días se marcan automáticamente en riesgo"],
      },
      {
        name: "Oportunidades",
        icon: "🚀",
        desc: "Seguimiento detallado de oportunidades de negocio con valor estimado, probabilidad de cierre y fecha esperada. Alimenta el reporte de pipeline en tiempo real.",
        tips: ["Asigna un valor y probabilidad a cada oportunidad para proyecciones precisas", "Vincula oportunidades a prospectos para trazabilidad completa"],
      },
      {
        name: "Clientes / CRM",
        icon: "👥",
        desc: "Expediente completo de cada cliente: datos fiscales, historial de operaciones, documentos, contactos clave y todo el contexto comercial en un solo lugar. El corazón del Customer 360.",
        tips: ["RFC y código postal son obligatorios para facturación CFDI 4.0", "El historial muestra cotizaciones, pedidos, embarques y facturas vinculadas", "Agrega múltiples contactos por cliente con roles específicos"],
      },
      {
        name: "Cotizaciones",
        icon: "📋",
        desc: "Generador de cotizaciones profesionales en PDF con tus colores de marca. Soporte para productos y servicios, múltiples monedas (MXN/USD), descuentos por línea y términos personalizados.",
        tips: ["Los colores del PDF se configuran en Ajustes → Empresa → Colores de marca", "Convierte una cotización aprobada en pedido o factura con un clic", "Las cotizaciones con método PPD generarán automáticamente un Complemento de Pago al cobrar"],
      },
      {
        name: "Productos",
        icon: "📦",
        desc: "Catálogo de productos y servicios con claves SAT, unidades de medida, precios y costos. Se usa directamente al crear cotizaciones, pedidos y facturas.",
        tips: ["Configura la clave de producto SAT y clave de unidad para facturación correcta", "El costo vs precio de venta alimenta los márgenes en el reporte comercial"],
      },
      {
        name: "Pedidos",
        icon: "🛒",
        desc: "Gestión de órdenes de venta generadas desde cotizaciones aprobadas. Puente entre la venta y la operación logística.",
        tips: ["Un pedido confirmado puede generar automáticamente un embarque en Logística", "El estado del pedido se sincroniza con el embarque vinculado"],
      },
    ],
  },
  {
    area: "Logística",
    icon: "🚢",
    color: "#3b82f6",
    modules: [
      {
        name: "Embarques",
        icon: "🚢",
        desc: "Módulo central de operación logística. Seguimiento completo de cada embarque: estado, documentación, proveedor logístico, costos, ingresos y facturación automática al entregar.",
        tips: ["Al marcar un embarque como 'Entregado', aparece en Facturación como pendiente de facturar", "Sube facturas de proveedor (XML/PDF) directamente desde el workspace del embarque", "El costo del proveedor se actualiza automáticamente al registrar la factura"],
      },
      {
        name: "Transporte",
        icon: "🚛",
        desc: "Gestión de unidades de transporte, operadores y asignaciones a embarques. Control de la flota propia.",
        tips: [],
      },
      {
        name: "Comercio Exterior",
        icon: "🌍",
        desc: "Documentación y procesos de importación/exportación. Declaraciones, pedimentos y cumplimiento aduanero. Próximamente incluirá CFDI con Complemento de Comercio Exterior.",
        tips: ["El Complemento de Comercio Exterior en CFDIs estará disponible próximamente"],
      },
      {
        name: "Tracking",
        icon: "📍",
        desc: "Seguimiento en tiempo real de la posición y estado de embarques activos.",
        tips: [],
      },
      {
        name: "Documentación",
        icon: "📄",
        desc: "Repositorio centralizado de documentos logísticos: BL, carta porte, pedimentos, facturas de proveedor, permisos y certificados.",
        tips: ["Organiza documentos por tipo para acceso rápido durante auditorías"],
      },
      {
        name: "Proveedores Logísticos",
        icon: "🏭",
        desc: "Catálogo de navieras, agentes aduanales, transportistas y otros proveedores de servicios logísticos con historial de operaciones y evaluación.",
        tips: [],
      },
      {
        name: "Órdenes de Servicio",
        icon: "📝",
        desc: "Control de órdenes de servicio logístico para operaciones especiales o servicios complementarios.",
        tips: [],
      },
    ],
  },
  {
    area: "Compras & Abastecimiento",
    icon: "🏭",
    color: "#f59e0b",
    modules: [
      {
        name: "Proveedores",
        icon: "🤝",
        desc: "Directorio de proveedores con datos fiscales, condiciones de pago, historial de compras y evaluación de desempeño. Vinculado a CXP y órdenes de compra.",
        tips: ["El RFC del proveedor es necesario para registrar facturas en CXP correctamente"],
      },
      {
        name: "Requisiciones",
        icon: "📋",
        desc: "Solicitudes internas de compra. Las requisiciones aprobadas se convierten en RFQ u órdenes de compra directas.",
        tips: [],
      },
      {
        name: "RFQ — Solicitud de Cotización",
        icon: "💬",
        desc: "Proceso formal de solicitud de cotización a proveedores. Compara propuestas y selecciona la mejor opción antes de emitir la orden de compra.",
        tips: [],
      },
      {
        name: "Órdenes de Compra",
        icon: "🛍️",
        desc: "Emisión y seguimiento de órdenes de compra a proveedores. La próxima OC generada será OC-2026-0001. El estado avanza de borrador → enviada → parcial → recibida.",
        tips: ["Las OC canceladas no aparecen en reportes ni afectan CXP", "Al recibir la OC, genera automáticamente una recepción en el módulo de Recepciones"],
      },
      {
        name: "Recepciones",
        icon: "📥",
        desc: "Registro de mercancía recibida contra órdenes de compra. Controla cantidades, calidad y diferencias vs lo ordenado.",
        tips: [],
      },
      {
        name: "Inventario",
        icon: "📦",
        desc: "Control de existencias en almacén con valorización por costo promedio. Entradas, salidas y ajustes de inventario.",
        tips: ["El valor del inventario alimenta el Balance General en Contabilidad"],
      },
      {
        name: "Costos",
        icon: "💲",
        desc: "Análisis y control de costos operativos. Estructura de costos por producto, proyecto o embarque.",
        tips: [],
      },
      {
        name: "Compras",
        icon: "🛒",
        desc: "Vista consolidada del historial y estadísticas de compras por proveedor, categoría y período.",
        tips: [],
      },
    ],
  },
  {
    area: "Finanzas",
    icon: "💰",
    color: "#8b5cf6",
    modules: [
      {
        name: "Facturación CFDI 4.0",
        icon: "🧾",
        desc: "Emisión de comprobantes fiscales digitales directamente al SAT vía Facturapi. Soporta: Facturas (I), Notas de crédito (E), Complementos de pago REP (P), y Recibos de Nómina (N).",
        tips: ["RFC Mobility Marine: MMA210517V20 — PAC: Facturapi en producción", "Las facturas PPD requieren Complemento de Pago cuando el cliente liquida", "Los recibos de nómina se generan desde el módulo de Empleados → Nómina"],
      },
      {
        name: "CXC — Cuentas por Cobrar",
        icon: "📥",
        desc: "Cartera de clientes separada por moneda (MXN/USD). Aging por antigüedad, seguimiento de cobranza, DSO y sincronización automática con CFDIs timbrados.",
        tips: ["Sincroniza CFDIs para importar facturas emitidas automáticamente a la cartera", "El botón 'Registrar pago' crea el pago y actualiza el saldo en tiempo real", "El DSO mayor a 60 días activa alerta de riesgo"],
      },
      {
        name: "CXP — Cuentas por Pagar",
        icon: "📤",
        desc: "Obligaciones con proveedores separadas por tipo (logística, abastecimiento, operativo) y moneda. Aging, programación de pagos y vista por proveedor.",
        tips: ["Las nóminas pagadas crean automáticamente una CXP tipo operativo categoría payroll", "Las facturas de proveedores de embarques se vinculan desde el workspace del embarque"],
      },
      {
        name: "Bancos / Tesorería",
        icon: "🏦",
        desc: "Cuentas bancarias en MXN y USD con movimientos en tiempo real. Los cobros (AR) y pagos (AP) se registran automáticamente vía triggers. Conciliación manual disponible.",
        tips: ["Los triggers actualizan el saldo bancario automáticamente al registrar pagos", "Agrega movimientos manuales para ajustes que no vienen de CXC/CXP"],
      },
      {
        name: "Flujo de Efectivo",
        icon: "💧",
        desc: "Posición de efectivo actual por moneda, histórico real de 6 meses y proyección a 90 días basada en CXC y CXP pendientes.",
        tips: ["La proyección considera las fechas de vencimiento de CXC y CXP activos", "Separación automática MXN/USD para empresas que operan en ambas monedas"],
      },
      {
        name: "Activos Fijos",
        icon: "🏛️",
        desc: "Catálogo completo de activos con tasas SAT por tipo (vehículos 25%, cómputo 30%, maquinaria 10%, etc.). Depreciación automática mensual por 3 métodos: línea recta, doble saldo decreciente y suma de dígitos. Bajas con cálculo de ganancia/pérdida.",
        tips: ["Postea la depreciación del mes para que aparezca en el Estado de Resultados", "El valor en libros alimenta automáticamente el Balance General en Contabilidad", "Terrenos tienen tasa 0% — no deprecian"],
      },
      {
        name: "Empleados / Nómina",
        icon: "👥",
        desc: "Expedientes completos con CURP, RFC, NSS, prestaciones y datos bancarios. Nómina automática con cálculo de IMSS (cuotas 2025), ISR Art. 96, INFONAVIT y fondo de ahorro. Soporta periodicidades: semanal, catorcenal, quincenal y mensual.",
        tips: ["RFC, CURP y NSS son obligatorios para timbrar CFDI de nómina vía SAT", "La nómina pagada crea automáticamente una CXP operativa para control de pagos", "Descarga recibos PDF individuales o en lote ZIP desde el período de nómina"],
      },
      {
        name: "Contabilidad",
        icon: "📒",
        desc: "Estado de Resultados, Balance General, Libro Diario e Indicadores financieros calculados automáticamente. ISR dinámico según régimen fiscal configurado. La depreciación posteada y los activos fijos se integran automáticamente.",
        tips: ["El régimen fiscal (Moral/PFAE/RESICO) se configura en Ajustes → Empresa", "El Balance General incluye efectivo, CXC y activos fijos netos en tiempo real", "Filtra el Libro Diario por tipo de movimiento o período"],
      },
      {
        name: "Impuestos",
        icon: "🧾",
        desc: "Posición fiscal mensual automática. Declaración de IVA (cobrado vs acreditable), ISR provisional por régimen y registro de pagos al SAT con línea de captura.",
        tips: ["Configura tu régimen fiscal en Ajustes → Empresa para cálculos correctos de ISR", "El IVA se calcula desde CFDIs timbrados vs facturas de proveedores del período", "Registra el pago de cada impuesto para mantener el historial al día"],
      },
    ],
  },
  {
    area: "Administración",
    icon: "⚙️",
    color: "#64748b",
    modules: [
      {
        name: "Reportes",
        icon: "📊",
        desc: "Análisis ejecutivo por módulo con separación por moneda MXN/USD. Incluye: Ejecutivo (KPIs globales + tendencia 6 meses), Comercial (funnel + conversión), Logística (embarques + márgenes), Finanzas (P&L + aging + bancos), RH (headcount + nómina) y Abastecimiento. Acceso controlado por rol.",
        tips: ["El acceso a cada módulo de reporte depende de tu rol en el sistema", "Exporta cualquier reporte a CSV para análisis en Excel", "Usa el período personalizado para rangos específicos de fechas"],
      },
      {
        name: "Configuración",
        icon: "⚙️",
        desc: "Panel de administración completo: datos fiscales, logo, colores de marca, régimen fiscal, sellos SAT (CFDI), usuarios del equipo, invitaciones, objetivos, suscripción y herramientas.",
        tips: ["Solo usuarios con rol Admin u Owner pueden acceder a la configuración", "Los colores de marca se aplican automáticamente a todos los PDFs generados", "Para invitar usuarios, ve a Configuración → Usuarios y copia el link de invitación"],
      },
      {
        name: "Ayuda",
        icon: "💬",
        desc: "Centro de ayuda con documentación completa de todos los módulos, atajos de teclado, canales de soporte y changelog de versiones.",
        tips: ["Usa la búsqueda para encontrar rápidamente cualquier módulo", "El changelog documenta todas las funcionalidades disponibles por versión"],
      },
    ],
  },
];

const SHORTCUTS = [
  { keys: ["Ctrl", "K"],       desc: "Abrir Command Hub — IA operativa" },
  { keys: ["Esc"],             desc: "Cerrar drawers, modales y paneles" },
  { keys: ["Enter"],           desc: "Confirmar en formularios y diálogos" },
  { keys: ["Tab"],             desc: "Navegar entre campos en formularios" },
];

const CHANGELOG = [
  {
    version: "2.2",
    date:    "Abr 2026",
    items: [
      "Módulo de Reportes GOD Level — 6 módulos con gráficas SVG propias (barras, líneas, donut, funnel)",
      "Reportes separados por moneda MXN/USD en todos los módulos financieros",
      "Control de acceso a reportes por rol (owner/admin/manager/comercial/logística/finanzas/compras)",
      "Centro de Ayuda completo con todos los módulos documentados",
      "Módulo Empresa migrado a Configuración — sidebar simplificado",
      "Fix: Órdenes de compra canceladas excluidas de reportes de Abastecimiento",
    ],
  },
  {
    version: "2.1",
    date:    "Abr 2026",
    items: [
      "Módulo de Empleados completo — expedientes, nómina con IMSS 2025, ISR Art. 96, INFONAVIT",
      "Soporte para periodicidades: semanal, catorcenal, quincenal y mensual",
      "Prestaciones configurables: fondo de ahorro, vales de despensa, SGM, bono productividad",
      "CFDI de Nómina timbrado vía Facturapi — Complemento Nómina 1.2 — CFDI 4.0 tipo N",
      "Recibo de nómina PDF por empleado y descarga en lote ZIP",
      "Activos Fijos — depreciación automática (línea recta, doble saldo, suma de dígitos)",
      "Tasas SAT por tipo de activo, tabla completa mensual, bajas con ganancia/pérdida",
      "Activos fijos integrados al Balance General y Estado de Resultados automáticamente",
      "Impuestos multi-régimen (Moral, PFAE, RESICO PM/PF) — selector en Settings",
      "Régimen fiscal configurable desde Ajustes → Empresa",
    ],
  },
  {
    version: "2.0",
    date:    "Mar 2026",
    items: [
      "Facturación CFDI 4.0 con Facturapi en producción",
      "Soporte para facturas (I), notas de crédito (E), complementos de pago REP (P)",
      "CXC y CXP separados por moneda (MXN/USD) — KPIs independientes por divisa",
      "Bancos y Tesorería con triggers automáticos al registrar cobros y pagos",
      "Flujo de Efectivo — posición actual, histórico 6 meses y proyección 90 días",
      "Contabilidad — Estado de Resultados, Balance General, Libro Diario, Indicadores",
      "ISR dinámico según régimen fiscal configurado",
      "Activos Fijos conectados al Balance General automáticamente",
      "Módulo de Impuestos con posición fiscal, IVA y registro de pagos SAT",
    ],
  },
  {
    version: "1.5",
    date:    "Feb 2026",
    items: [
      "Pipeline visual de prospectos con drag & drop entre etapas",
      "Módulo logístico completo — embarques, workspace, documentación, proveedor logístico",
      "Facturación automática desde embarques entregados",
      "Cotizaciones PDF con colores de marca configurables",
      "Command Hub con Mobility AI integrada (Ctrl+K)",
      "Multi-tenant con cambio de empresa en tiempo real",
      "Módulo de Abastecimiento — proveedores, OC, recepciones, inventario",
    ],
  },
  {
    version: "1.0",
    date:    "Ene 2026",
    items: [
      "Infraestructura base — Next.js 14, Supabase, multi-tenant",
      "Autenticación, roles y permisos por módulo",
      "Layout SaaS profesional — dark theme, sidebar, header",
      "Dashboard ejecutivo con KPIs en tiempo real",
      "Módulo Comercial base — prospectos, clientes, CRM, cotizaciones",
      "Agenda y calendario operativo",
      "Configuración inicial — datos fiscales, logo, colores de marca, usuarios",
    ],
  },
];

export default function HelpPage() {
  const { lang }  = useTranslation();
  const router    = useRouter();
  const es        = lang !== "en";
  const [section, setSection] = useState<Section>("guia");
  const [search,  setSearch]  = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = MODULE_AREAS.map(area => ({
    ...area,
    modules: area.modules.filter(m =>
      search.length < 2 ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.desc.toLowerCase().includes(search.toLowerCase()) ||
      area.area.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(area => area.modules.length > 0);

  const SECTIONS: { key: Section; label: string; icon: string }[] = [
    { key: "guia",      label: es ? "Guía de módulos"  : "Module guide",  icon: "📖" },
    { key: "atajos",    label: es ? "Atajos"            : "Shortcuts",     icon: "⌨️" },
    { key: "soporte",   label: es ? "Soporte"           : "Support",       icon: "💬" },
    { key: "changelog", label: es ? "Novedades"         : "What's new",    icon: "🚀" },
  ];

  const totalModules = MODULE_AREAS.reduce((s, a) => s + a.modules.length, 0);

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
            💬 {es ? "Centro de ayuda" : "Help center"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {es
              ? `Documentación completa de los ${totalModules} módulos de Mobility OS.`
              : `Complete documentation of all ${totalModules} Mobility OS modules.`}
          </p>
        </div>
        {/* Búsqueda rápida */}
        {section === "guia" && (
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={es ? "Buscar módulo…" : "Search module…"}
            style={{ height: "36px", padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "13px", outline: "none", width: "240px" }} />
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--color-border-faint)" }}>
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setSection(s.key)}
            style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md) var(--radius-md) 0 0", background: section === s.key ? "var(--color-bg-base)" : "transparent", border: section === s.key ? "1px solid var(--color-border-faint)" : "none", borderBottom: section === s.key ? "1px solid var(--color-bg-base)" : "none", color: section === s.key ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: section === s.key ? 700 : 400, cursor: "pointer", marginBottom: section === s.key ? "-1px" : "0" }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ── GUÍA DE MÓDULOS ── */}
      {section === "guia" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {filtered.map(area => (
            <div key={area.area}>
              {/* Header área */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-md)", background: `${area.color}20`, border: `1px solid ${area.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                  {area.icon}
                </div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-text-primary)" }}>{area.area}</div>
                <div style={{ height: "1px", flex: 1, background: "var(--color-border-faint)" }} />
                <span style={{ fontSize: "10px", color: "var(--color-text-muted)", padding: "2px 8px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
                  {area.modules.length} {es ? "módulos" : "modules"}
                </span>
              </div>

              {/* Grid módulos */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px,1fr))", gap: "10px" }}>
                {area.modules.map(m => {
                  const isExpanded = expanded === `${area.area}-${m.name}`;
                  return (
                    <div key={m.name}
                      style={{ background: "var(--color-bg-base)", border: `1px solid ${isExpanded ? area.color + "50" : "var(--color-border-faint)"}`, borderRadius: "var(--radius-lg)", overflow: "hidden", transition: "border-color 0.15s" }}>
                      {/* Header módulo */}
                      <button onClick={() => setExpanded(isExpanded ? null : `${area.area}-${m.name}`)}
                        style={{ width: "100%", padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", display: "flex", gap: "12px", alignItems: "flex-start", textAlign: "left" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-md)", background: `${area.color}15`, border: `1px solid ${area.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                          {m.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "3px" }}>{m.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: isExpanded ? 100 : 2, WebkitBoxOrient: "vertical" } as any}>
                            {m.desc}
                          </div>
                        </div>
                        <div style={{ color: "var(--color-text-muted)", flexShrink: 0, marginTop: "2px", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "none" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                      </button>

                      {/* Tips expandidos */}
                      {isExpanded && m.tips.length > 0 && (
                        <div style={{ padding: "12px 16px", paddingTop: 0, borderTop: `1px solid ${area.color}20`, background: `${area.color}05` }}>
                          <div style={{ fontSize: "10px", fontWeight: 700, color: area.color, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                            💡 {es ? "Tips clave" : "Key tips"}
                          </div>
                          {m.tips.map((tip, i) => (
                            <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px", alignItems: "flex-start" }}>
                              <span style={{ color: area.color, flexShrink: 0, marginTop: "1px", fontSize: "10px" }}>→</span>
                              <span style={{ fontSize: "11px", color: "var(--color-text-second)", lineHeight: 1.5 }}>{tip}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>🔍</div>
              <div style={{ fontSize: "14px" }}>{es ? "Sin resultados para tu búsqueda" : "No results for your search"}</div>
            </div>
          )}
        </div>
      )}

      {/* ── ATAJOS ── */}
      {section === "atajos" && (
        <div style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--color-border-faint)", background: "var(--color-bg-subtle)", fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {es ? "Atajos de teclado globales" : "Global keyboard shortcuts"}
            </div>
            {SHORTCUTS.map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 20px", borderBottom: i < SHORTCUTS.length - 1 ? "1px solid var(--color-border-faint)" : "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <span style={{ fontSize: "13px", color: "var(--color-text-second)" }}>{s.desc}</span>
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  {s.keys.map((k, ki) => (
                    <span key={k}>
                      <kbd style={{ padding: "4px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", fontSize: "11px", fontFamily: "monospace", color: "var(--color-text-primary)", fontWeight: 700, boxShadow: "0 1px 0 var(--color-border)" }}>
                        {k}
                      </kbd>
                      {ki < s.keys.length - 1 && <span style={{ fontSize: "10px", color: "var(--color-text-muted)", margin: "0 2px" }}>+</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-brand-blue)", lineHeight: 1.6 }}>
            💡 {es
              ? "El Command Hub (Ctrl+K) es el atajo más poderoso — desde ahí puedes ejecutar cualquier acción, navegar a cualquier módulo o consultar a la IA sin mover el mouse."
              : "The Command Hub (Ctrl+K) is the most powerful shortcut — from there you can execute any action, navigate to any module or consult the AI without moving your mouse."}
          </div>
        </div>
      )}

      {/* ── SOPORTE ── */}
      {section === "soporte" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: "14px", maxWidth: "900px" }}>
          {[
            {
              icon: "🤖",
              title: es ? "Mobility AI — Command Hub" : "Mobility AI — Command Hub",
              desc:  es ? "Usa Ctrl+K para abrir el asistente IA directamente en el sistema. Puede responder preguntas, navegar módulos, generar reportes y ejecutar acciones." : "Use Ctrl+K to open the AI assistant directly in the system.",
              action: es ? "Abrir Command Hub" : "Open Command Hub",
              href:   null,
              color:  "var(--color-brand-blue)",
            },
            {
              icon: "📧",
              title: es ? "Soporte por email" : "Email support",
              desc:  es ? "¿Tienes un problema técnico, una duda o una sugerencia? Escríbenos directamente." : "Have a technical issue or suggestion? Write to us directly.",
              action: "soporte@mobility-os.com",
              href:   "mailto:soporte@mobility-os.com",
              color:  "var(--color-success-text)",
            },
            {
              icon: "🐛",
              title: es ? "Reportar un bug" : "Report a bug",
              desc:  es ? "¿Encontraste algo que no funciona bien? Abre un issue en GitHub con los detalles y lo atendemos." : "Found something that doesn't work? Open a GitHub issue.",
              action: "GitHub Issues",
              href:   "https://github.com/Mobility-Marine/mobility-os/issues",
              color:  "var(--color-danger-text)",
            },
            {
              icon: "💡",
              title: es ? "Sugerir una funcionalidad" : "Feature request",
              desc:  es ? "¿Tienes una idea que haría Mobility OS mejor para tu empresa? Nos encanta escuchar a los usuarios." : "Have an idea that would make Mobility OS better? We love hearing from users.",
              action: es ? "Enviar sugerencia" : "Send suggestion",
              href:   "mailto:ideas@mobility-os.com",
              color:  "#f59e0b",
            },
          ].map(c => (
            <div key={c.title} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ fontSize: "28px" }}>{c.icon}</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "6px" }}>{c.title}</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>{c.desc}</div>
              </div>
              {c.href ? (
                <a href={c.href} target={c.href.startsWith("mailto") ? "_self" : "_blank"} rel="noreferrer"
                  style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: `${c.color}15`, border: `1px solid ${c.color}30`, color: c.color, fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", textDecoration: "none", alignSelf: "flex-start" }}>
                  {c.action} →
                </a>
              ) : (
                <button onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))}
                  style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: c.color, color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" }}>
                  {c.action}
                </button>
              )}
            </div>
          ))}

          {/* Info sistema */}
          <div style={{ gridColumn: "1 / -1", padding: "14px 18px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "11px", color: "var(--color-text-muted)" }}>
            {[
              { l: "Stack",    v: "Next.js 14 + Supabase + Vercel"     },
              { l: "PAC",      v: "Facturapi (producción)"              },
              { l: "RFC",      v: "Mobility OS"      },
              { l: "Deploy",   v: "mobility-os.vercel.app"              },
            ].map(r => (
              <div key={r.l} style={{ display: "flex", gap: "6px" }}>
                <span style={{ fontWeight: 700, color: "var(--color-text-second)" }}>{r.l}:</span>
                <span>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CHANGELOG ── */}
      {section === "changelog" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "800px" }}>
          {CHANGELOG.map((v, vi) => (
            <div key={v.version} style={{ background: "var(--color-bg-base)", border: `1px solid ${vi === 0 ? "var(--color-brand-blue)40" : "var(--color-border-faint)"}`, borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <div style={{ padding: "12px 20px", background: vi === 0 ? "var(--color-info-bg)" : "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: vi === 0 ? "var(--color-brand-blue)" : "var(--color-bg-base)", color: vi === 0 ? "#fff" : "var(--color-text-muted)", border: vi === 0 ? "none" : "1px solid var(--color-border-faint)" }}>
                  v{v.version}
                </span>
                <span style={{ fontSize: "12px", color: vi === 0 ? "var(--color-brand-blue)" : "var(--color-text-muted)", fontWeight: vi === 0 ? 600 : 400 }}>{v.date}</span>
                {vi === 0 && <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: "var(--color-success-bg)", color: "var(--color-success-text)", border: "1px solid var(--color-success-border)" }}>LATEST</span>}
                <span style={{ marginLeft: "auto", fontSize: "10px", color: "var(--color-text-muted)" }}>{v.items.length} {es ? "cambios" : "changes"}</span>
              </div>
              <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: "7px" }}>
                {v.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "13px", color: "var(--color-text-second)", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--color-success-text)", flexShrink: 0, marginTop: "1px", fontWeight: 700 }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
