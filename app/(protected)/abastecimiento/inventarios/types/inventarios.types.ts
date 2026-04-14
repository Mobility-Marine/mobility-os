// ============================================================
// INVENTARIOS — Types v1
// Almacenes · Stock · Movimientos · Conteos físicos
// ============================================================

export type WarehouseType = "own" | "external" | "transit" | "consignment";

export type MovementType =
  | "entry"       // entrada de compra
  | "exit"        // salida por pedido
  | "transfer"    // transferencia entre almacenes
  | "adjustment"  // ajuste manual
  | "loss"        // merma/baja
  | "return";     // devolución

export type CountStatus = "draft" | "in_progress" | "completed" | "cancelled";
export type CostMethod  = "average" | "fifo" | "lifo" | "standard";

// ── Configs visuales ──────────────────────────────────────────

export const MOVEMENT_CONFIG: Record<MovementType, {
  labelEs: string; labelEn: string; color: string; sign: "+" | "-" | "±";
}> = {
  entry:      { labelEs: "Entrada",       labelEn: "Entry",       color: "var(--color-success-text)", sign: "+" },
  exit:       { labelEs: "Salida",        labelEn: "Exit",        color: "var(--color-danger-text)",  sign: "-" },
  transfer:   { labelEs: "Transferencia", labelEn: "Transfer",    color: "var(--color-brand-blue)",   sign: "±" },
  adjustment: { labelEs: "Ajuste",        labelEn: "Adjustment",  color: "var(--color-warning-text)", sign: "±" },
  loss:       { labelEs: "Merma",         labelEn: "Loss",        color: "var(--color-danger-text)",  sign: "-" },
  return:     { labelEs: "Devolución",    labelEn: "Return",      color: "#a78bfa",                  sign: "+" },
};

export const COUNT_STATUS_CONFIG: Record<CountStatus, {
  labelEs: string; labelEn: string; color: string; bg: string; border: string;
}> = {
  draft:       { labelEs: "Borrador",    labelEn: "Draft",       color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"  },
  in_progress: { labelEs: "En proceso",  labelEn: "In Progress", color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    border: "var(--color-info-border)"   },
  completed:   { labelEs: "Completado",  labelEn: "Completed",   color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
  cancelled:   { labelEs: "Cancelado",   labelEn: "Cancelled",   color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"  },
};

export const WAREHOUSE_TYPE_CONFIG: Record<WarehouseType, {
  labelEs: string; labelEn: string;
}> = {
  own:         { labelEs: "Propio",       labelEn: "Own"         },
  external:    { labelEs: "Externo",      labelEn: "External"    },
  transit:     { labelEs: "Tránsito",     labelEn: "Transit"     },
  consignment: { labelEs: "Consignación", labelEn: "Consignment" },
};

// ── Entidades ─────────────────────────────────────────────────

export type Warehouse = {
  id:          string;
  company_id:  string;
  name:        string;
  code?:       string | null;
  address?:    string | null;
  city?:       string | null;
  type?:       WarehouseType;
  capacity?:   number | null;
  manager?:    string | null;
  phone?:      string | null;
  email?:      string | null;
  is_default:  boolean;
  is_active:   boolean;
  notes?:      string | null;
  created_at:  string;
  updated_at?: string;
};

export type InventoryItem = {
  id:             string;
  company_id:     string;
  product_id?:    string | null;
  sku?:           string | null;
  name:           string;
  description?:   string | null;
  category?:      string | null;
  unit:           string;
  stock_min:      number;
  stock_max:      number;
  reorder_point:  number;
  reorder_qty:    number;
  unit_cost:      number;
  cost_method:    CostMethod;
  is_active:      boolean;
  track_serial:   boolean;
  track_lot:      boolean;
  track_expiry:   boolean;
  notes?:         string | null;
  created_at:     string;
  updated_at?:    string;
  // Joined
  stock?:         InventoryStock[];
  total_stock?:   number;
  total_value?:   number;
};

export type InventoryStock = {
  id:               string;
  company_id:       string;
  item_id:          string;
  warehouse_id:     string;
  qty_available:    number;
  qty_reserved:     number;
  qty_in_transit:   number;
  qty_total:        number;
  avg_cost:         number;
  total_value:      number;
  last_movement_at?: string | null;
  updated_at?:      string;
  // Joined
  warehouse?:       { name: string; code?: string | null } | null;
  item?:            { name: string; sku?: string | null; unit: string } | null;
};

export type InventoryMovement = {
  id:             string;
  company_id:     string;
  item_id?:       string | null;
  product_id?:    string | null;
  warehouse_id?:  string | null;
  movement_type:  MovementType;
  quantity:       number;
  unit_cost:      number;
  total_cost:     number;
  stock_before:   number;
  stock_after:    number;
  source_type?:   string | null;
  source_id?:     string | null;
  source_number?: string | null;
  lot_number?:    string | null;
  serial_number?: string | null;
  reference?:     string | null;
  description?:   string | null;
  notes?:         string | null;
  created_by?:    string | null;
  created_at:     string;
  // Joined
  item?:          { name: string; sku?: string | null } | null;
  warehouse?:     { name: string } | null;
};

export type InventoryCount = {
  id:            string;
  company_id:    string;
  warehouse_id?: string | null;
  count_number:  string;
  status:        CountStatus;
  type?:         string | null;
  count_date?:   string | null;
  notes?:        string | null;
  created_by?:   string | null;
  created_at:    string;
  completed_at?: string | null;
  updated_at?:   string;
  // Joined
  warehouse?:    { name: string } | null;
  items?:        InventoryCountItem[];
};

export type InventoryCountItem = {
  id:               string;
  company_id:       string;
  count_id:         string;
  item_id?:         string | null;
  product_id?:      string | null;
  system_quantity:  number;
  counted_quantity: number;
  difference:       number;
  unit_cost:        number;
  adjusted:         boolean;
  notes?:           string | null;
  created_at:       string;
  // Joined
  item?:            { name: string; sku?: string | null; unit: string } | null;
};

// ── Stats ─────────────────────────────────────────────────────

export type InventoryStats = {
  total_items:      number;
  total_value:      number;
  below_min:        number;
  at_reorder:       number;
  zero_stock:       number;
  warehouses_count: number;
};

// ── Payloads ──────────────────────────────────────────────────

export type CreateWarehousePayload = {
  name:       string;
  code?:      string;
  address?:   string;
  city?:      string;
  type?:      WarehouseType;
  capacity?:  number;
  manager?:   string;
  phone?:     string;
  email?:     string;
  is_default?: boolean;
  notes?:     string;
};

export type CreateItemPayload = {
  sku?:          string;
  name:          string;
  description?:  string;
  category?:     string;
  unit:          string;
  stock_min?:    number;
  stock_max?:    number;
  reorder_point?: number;
  reorder_qty?:  number;
  unit_cost?:    number;
  cost_method?:  CostMethod;
  track_serial?: boolean;
  track_lot?:    boolean;
  track_expiry?: boolean;
  notes?:        string;
};

export type CreateMovementPayload = {
  item_id:       string;
  warehouse_id:  string;
  movement_type: MovementType;
  quantity:      number;
  unit_cost?:    number;
  source_type?:  string;
  source_number?: string;
  lot_number?:   string;
  notes?:        string;
};

// ── Filtros ───────────────────────────────────────────────────

export type InventoryFilters = {
  search:       string;
  warehouse_id: string;
  category:     string;
  alert:        "all" | "below_min" | "at_reorder" | "zero_stock";
};

export type MovementFilters = {
  search:        string;
  movement_type: MovementType | "all";
  warehouse_id:  string;
  date_from:     string;
  date_to:       string;
};

export const DEFAULT_INVENTORY_FILTERS: InventoryFilters = {
  search: "", warehouse_id: "", category: "", alert: "all",
};

export const DEFAULT_MOVEMENT_FILTERS: MovementFilters = {
  search: "", movement_type: "all", warehouse_id: "", date_from: "", date_to: "",
};

// ── Catálogos ─────────────────────────────────────────────────

export const UNITS = [
  "pza", "kg", "ton", "lt", "ml", "m", "m²", "m³",
  "caja", "bolsa", "pallet", "rollo", "par", "juego", "hora",
];

export const CATEGORIES = [
  "Materia Prima", "Producto Terminado", "Insumo", "Embalaje",
  "Refacciones", "Herramienta", "Consumible", "Otro",
];
