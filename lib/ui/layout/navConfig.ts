export type NavItem = {
  nameKey: string;
  path:    string;
};

export type NavSection = {
  key:        string;
  titleKey:   string;
  subtitleKey:string;
  roles:      string[];
  items:      NavItem[];
};

export const navSections: NavSection[] = [
  // ── GENERAL ────────────────────────────────────────────────
  {
    key:         "general",
    titleKey:    "general",
    subtitleKey: "baseOps",
    roles:       ["*"],
    items: [
      { nameKey: "dashboard", path: "/dashboard" },
      { nameKey: "agenda",    path: "/agenda"    },
    ],
  },

  // ── COMERCIAL — flujo: Prospecto → Oportunidad → CRM → Cliente → Producto → Cotización → Pedido
  {
    key:         "comercial",
    titleKey:    "commercial",
    subtitleKey: "salesRel",
    roles:       ["admin", "owner", "manager", "comercial"],
    items: [
      { nameKey: "prospects",     path: "/comercial/prospects"     },
      { nameKey: "opportunities", path: "/comercial/opportunities" },
      { nameKey: "crm",           path: "/comercial/crm"           },
      { nameKey: "clients",       path: "/comercial/partners?role=customer"      },
      { nameKey: "products",      path: "/comercial/productos"     },
      { nameKey: "quotations",    path: "/comercial/cotizaciones"  },
      { nameKey: "orders",        path: "/comercial/pedidos"       },
    ],
  },

  // ── LOGÍSTICA — flujo: Embarque → Documentación → Tracking → Transporte → Comercio Ext → Proveedores → Órdenes
  {
    key:         "logistica",
    titleKey:    "logistics",
    subtitleKey: "serviceOps",
    roles:       ["admin", "owner", "manager", "logistica"],
    items: [
      { nameKey: "shipments",          path: "/logistica/embarques"             },
      { nameKey: "documentation",      path: "/logistica/documentacion"         },
      { nameKey: "tracking",           path: "/logistica/tracking"              },
      { nameKey: "transport",          path: "/logistica/transporte"            },
      { nameKey: "foreignTrade",       path: "/logistica/comercio-exterior"     },
      { nameKey: "logisticsProviders", path: "/comercial/partners?role=logistics"},
      { nameKey: "serviceOrders",      path: "/logistica/ordenes-servicio"      },
    ],
  },

  // ── COMPRAS & ABASTECIMIENTO — flujo: Compras (dashboard) → Proveedores → Requisición → RFQ → OC → Recepción → Inventario → Costos
  {
    key:         "abastecimiento",
    titleKey:    "procurement",
    subtitleKey: "inventory",
    roles:       ["admin", "owner", "manager", "compras"],
    items: [
      { nameKey: "purchases",      path: "/abastecimiento/compras"        },
      { nameKey: "suppliers",      path: "/comercial/partners?role=supplier"    },
      { nameKey: "requisitions",   path: "/abastecimiento/requisiciones"  },
      { nameKey: "rfq",            path: "/abastecimiento/cotizaciones"   },
      { nameKey: "purchaseOrders", path: "/abastecimiento/ordenes-compra" },
      { nameKey: "receptions",     path: "/abastecimiento/recepciones"    },
      { nameKey: "inventory",      path: "/abastecimiento/inventarios"    },
      { nameKey: "costs",          path: "/abastecimiento/costos"         },
    ],
  },

  // ── FINANZAS — flujo: Facturación → CXC → CXP → Bancos → Flujo → Activos → Empleados → Contabilidad → Impuestos
  {
    key:         "finanzas",
    titleKey:    "finance",
    subtitleKey: "economic",
    roles:       ["admin", "owner", "manager", "finanzas"],
    items: [
      { nameKey: "billing",            path: "/finanzas/facturacion"   },
      { nameKey: "accountsReceivable", path: "/finanzas/cxc"           },
      { nameKey: "accountsPayable",    path: "/finanzas/cxp"           },
      { nameKey: "banks",              path: "/finanzas/bancos"         },
      { nameKey: "cashFlow",           path: "/finanzas/flujo-efectivo" },
      { nameKey: "fixedAssets",        path: "/finanzas/activos"        },
      { nameKey: "employees",          path: "/finanzas/empleados"      },
      { nameKey: "accounting",         path: "/finanzas/contabilidad"   },
      { nameKey: "taxes",              path: "/finanzas/impuestos"      },
    ],
  },

  // ── ADMINISTRACIÓN — visible para todos pero con control interno por permisos
  {
    key:         "administracion",
    titleKey:    "admin",
    subtitleKey: "platformSupport",
    roles:       ["*"],
    items: [
      { nameKey: "reports",  path: "/reports"  },
      { nameKey: "settings", path: "/settings" },
      { nameKey: "help",     path: "/help"     },
    ],
  },
];

export function getNavForRole(role: string | null): NavSection[] {
  return navSections.filter((section) =>
    section.roles.includes("*") || section.roles.includes(role ?? "")
  );
}
