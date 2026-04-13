export type NavItem = {
  nameKey: string;
  path: string;
};

export type NavSection = {
  key: string;
  titleKey: string;
  subtitleKey: string;
  roles: string[];
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    key:         "general",
    titleKey:    "general",
    subtitleKey: "baseOps",
    roles:       ["*"],
    items: [
      { nameKey: "dashboard", path: "/dashboard" },
      { nameKey: "agenda",    path: "/agenda" },
    ],
  },
  {
    key:         "comercial",
    titleKey:    "commercial",
    subtitleKey: "salesRel",
    roles:       ["admin", "owner", "comercial"],
    items: [
      { nameKey: "prospects",     path: "/comercial/prospects" },
      { nameKey: "opportunities", path: "/comercial/opportunities" },
      { nameKey: "clients",       path: "/comercial/clientes" },
      { nameKey: "crm",           path: "/comercial/crm" },
      { nameKey: "quotations",    path: "/comercial/cotizaciones" },
      { nameKey: "products",      path: "/comercial/productos" },
      { nameKey: "orders",        path: "/comercial/pedidos" },
    ],
  },
  {
    key:         "logistica",
    titleKey:    "logistics",
    subtitleKey: "serviceOps",
    roles:       ["admin", "owner", "logistica"],
    items: [
      { nameKey: "shipments",          path: "/logistica/embarques" },
      { nameKey: "transport",          path: "/logistica/transporte" },
      { nameKey: "foreignTrade",       path: "/logistica/comercio-exterior" },
      { nameKey: "tracking",           path: "/logistica/tracking" },
      { nameKey: "documentation",      path: "/logistica/documentacion" },
      { nameKey: "logisticsProviders", path: "/logistica/proveedores-logisticos" },
      { nameKey: "serviceOrders",      path: "/logistica/ordenes-servicio" },
    ],
  },
  {
    key:         "abastecimiento",
    titleKey:    "procurement",
    subtitleKey: "inventory",
    roles:       ["admin", "owner", "compras"],
    items: [
      { nameKey: "suppliers",      path: "/abastecimiento/proveedores" },
      { nameKey: "purchases",      path: "/abastecimiento/compras" },
      { nameKey: "purchaseOrders", path: "/abastecimiento/ordenes-compra" },
      { nameKey: "inventory",      path: "/abastecimiento/inventarios" },
      { nameKey: "receptions",     path: "/abastecimiento/recepciones" },
      { nameKey: "costs",          path: "/abastecimiento/costos" },
    ],
  },
  {
    key:         "finanzas",
    titleKey:    "finance",
    subtitleKey: "economic",
    roles:       ["admin", "owner", "finanzas"],
    items: [
      { nameKey: "billing",            path: "/finanzas/facturacion" },
      { nameKey: "accountsReceivable", path: "/finanzas/cxc" },
      { nameKey: "accountsPayable",    path: "/finanzas/cxp" },
      { nameKey: "banks",              path: "/finanzas/bancos" },
      { nameKey: "accounting",         path: "/finanzas/contabilidad" },
      { nameKey: "taxes",              path: "/finanzas/impuestos" },
    ],
  },
  {
    key:         "administracion",
    titleKey:    "admin",
    subtitleKey: "platformSupport",
    roles:       ["*"],
    items: [
      { nameKey: "reports",  path: "/reports" },
      { nameKey: "company",  path: "/company" },
      { nameKey: "settings", path: "/settings" },
      { nameKey: "help",     path: "/help" },
    ],
  },
];

export function getNavForRole(role: string | null): NavSection[] {
  return navSections.filter((section) =>
    section.roles.includes("*") || section.roles.includes(role ?? "")
  );
}
