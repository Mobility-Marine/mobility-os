export type UnitType =
  | "tractocamion" | "camion_3_5t" | "camion_10t" | "camion_rabón"
  | "torton" | "trailer" | "caja_seca" | "caja_refrigerada"
  | "plataforma" | "volteo" | "pipa" | "van" | "pickup" | "otro";

export type UnitStatus = "active" | "maintenance" | "inactive";

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  tractocamion:      "logistics.unitTypeTractocamion",
  camion_3_5t:       "logistics.unitTypeCamion35",
  camion_10t:        "logistics.unitTypeCamion10",
  "camion_rabón":    "logistics.unitTypeRabon",
  torton:            "logistics.unitTypeTorton",
  trailer:           "logistics.unitTypeTrailer",
  caja_seca:         "logistics.unitTypeCajaSeca",
  caja_refrigerada:  "logistics.unitTypeCajaRef",
  plataforma:        "logistics.unitTypePlataforma",
  volteo:            "logistics.unitTypeVolteo",
  pipa:              "logistics.unitTypePipa",
  van:               "logistics.unitTypeVan",
  pickup:            "logistics.unitTypePickup",
  otro:              "logistics.unitTypeOtro",
};

export const UNIT_STATUS_CONFIG: Record<UnitStatus, { labelKey: string; color: string; bg: string; border: string }> = {
  active:      { labelKey: "logistics.unitActive",      color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
  maintenance: { labelKey: "logistics.unitMaintenance", color: "#d97706",                   bg: "#fef3c7",                 border: "#fcd34d"                      },
  inactive:    { labelKey: "logistics.unitInactive",    color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"    },
};

export type TransportUnit = {
  id:                      string;
  company_id:              string;
  name:                    string;
  unit_type:               UnitType;
  status:                  UnitStatus;
  brand?:                  string | null;
  model?:                  string | null;
  year?:                   number | null;
  plates?:                 string | null;
  vin?:                    string | null;
  color?:                  string | null;
  capacity_kg?:            number | null;
  capacity_m3?:            number | null;
  insurance_policy?:       string | null;
  insurance_expiry?:       string | null;
  verification_expiry?:    string | null;
  tenencia_year?:          number | null;
  assigned_driver?:        string | null;
  driver_license?:         string | null;
  driver_license_expiry?:  string | null;
  gps_unit?:               string | null;
  notes?:                  string | null;
  created_by?:             string | null;
  created_at:              string;
  updated_at?:             string | null;
};

export type UnitFilters = {
  search: string;
  status: UnitStatus | "all";
  type:   UnitType  | "all";
};

export const DEFAULT_UNIT_FILTERS: UnitFilters = {
  search: "", status: "all", type: "all",
};

// Alertas de documentación
export type DocAlert = {
  field:     string;
  labelKey:  string;
  severity:  "expired" | "expiring";
};

export function getUnitAlerts(unit: TransportUnit): DocAlert[] {
  const alerts: DocAlert[] = [];
  const today   = new Date();
  const in30    = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const check = (date: string | null | undefined, field: string, expiredKey: string, soonKey: string) => {
    if (!date) return;
    const d = new Date(date);
    if (d < today)  alerts.push({ field, labelKey: expiredKey,  severity: "expired"  });
    else if (d < in30) alerts.push({ field, labelKey: soonKey,  severity: "expiring" });
  };

  check(unit.insurance_expiry,       "insurance_expiry",       "logistics.insuranceExpired",         "logistics.insuranceExpiringSoon");
  check(unit.verification_expiry,    "verification_expiry",    "logistics.verificationExpired",      "logistics.verificationExpiringSoon");
  check(unit.driver_license_expiry,  "driver_license_expiry",  "logistics.licenseExpired",           "logistics.licenseExpiringSoon");

  return alerts;
}
