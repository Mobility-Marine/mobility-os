// ================================================================
// NAVEGACIÓN POR ROL
// Fuente única de verdad para el sidebar.
// Agregar módulos aquí — el sidebar los refleja automáticamente.
// ================================================================

export type NavItem = {
  name: string;
  path: string;
};

export type NavSection = {
  key: string;
  title: string;
  subtitle: string;
  roles: string[]; // qué roles ven esta sección ("*" = todos)
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    key: "general",
    title: "General",
    subtitle: "Base operativa",
    roles: ["*"],
    items: [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Agenda",    path: "/agenda" },
    ],
  },
  {
    key: "comercial",
    title: "Comercial",
    subtitle: "Ventas y relación",
    roles: ["admin", "owner", "comercial"],
    items: [
      { name: "Prospectos",    path: "/comercial/prospects" },
      { name: "Oportunidades", path: "/comercial/opportunities" },
      { name: "CRM",           path: "/comercial/crm" },
      { name: "Clientes",      path: "/comercial/clientes" },
      { name: "Cotizaciones",  path: "/comercial/cotizaciones" },
      { name: "Productos",     path: "/comercial/productos" },
      { name: "Pedidos",       path: "/comercial/pedidos" },
    ],
  },
  {
    key: "logistica",
    title: "Logística",
    subtitle: "Operación del servicio",
    roles: ["admin", "owner", "logistica"],
    items: [
      { name: "Embarques",            path: "/logistica/embarques" },
      { name: "Transporte",           path: "/logistica/transporte" },
      { name: "Comercio Exterior",    path: "/logistica/comercio-exterior" },
      { name: "Tracking",             path: "/logistica/tracking" },
      { name: "Documentación",        path: "/logistica/documentacion" },
      { name: "Proveedores logísticos", path: "/logistica/proveedores-logisticos" },
      { name: "Órdenes de servicio",  path: "/logistica/ordenes-servicio" },
    ],
  },
  {
    key: "abastecimiento",
    title: "Compras & Abastecimiento",
    subtitle: "Inventario y suministro",
    roles: ["admin", "owner", "compras"],
    items: [
      { name: "Proveedores",      path: "/abastecimiento/proveedores" },
      { name: "Compras",          path: "/abastecimiento/compras" },
      { name: "Órdenes de compra", path: "/abastecimiento/ordenes-compra" },
      { name: "Inventarios",      path: "/abastecimiento/inventarios" },
      { name: "Recepciones",      path: "/abastecimiento/recepciones" },
      { name: "Costos",           path: "/abastecimiento/costos" },
    ],
  },
  {
    key: "finanzas",
    title: "Finanzas",
    subtitle: "Control económico",
    roles: ["admin", "owner", "finanzas"],
    items: [
      { name: "Facturación",       path: "/finanzas/facturacion" },
      { name: "Cuentas por cobrar", path: "/finanzas/cxc" },
      { name: "Cuentas por pagar", path: "/finanzas/cxp" },
      { name: "Bancos",            path: "/finanzas/bancos" },
      { name: "Contabilidad",      path: "/finanzas/contabilidad" },
      { name: "Impuestos",         path: "/finanzas/impuestos" },
    ],
  },
  {
    key: "administracion",
    title: "Administración",
    subtitle: "Plataforma y soporte",
    roles: ["*"],
    items: [
      { name: "Reportes",      path: "/reports" },
      { name: "Empresa",       path: "/company" },
      { name: "Configuración", path: "/settings" },
      { name: "Ayuda",         path: "/help" },
    ],
  },
];

// Filtra secciones según el rol del usuario
export function getNavForRole(role: string | null): NavSection[] {
  return navSections.filter((section) =>
    section.roles.includes("*") || section.roles.includes(role ?? "")
  );
}
