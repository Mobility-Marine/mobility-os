"use client";
import { SectionTitle } from "../drawerShared";
import { SERVICE_SUBTYPE_CONFIG } from "../../../types/quotations.types";
import type { ServiceSubtype } from "../../../types/quotations.types";

type Props = {
  serviceSubtype:    ServiceSubtype | null;
  setServiceSubtype: (s: ServiceSubtype) => void;
};

const GROUPS = [
  { key: "Terrestre",    subtypes: ["terrestre_ltl", "terrestre_ftl"] as ServiceSubtype[] },
  { key: "Marítimo",     subtypes: ["maritimo_fcl",  "maritimo_lcl"]  as ServiceSubtype[] },
  { key: "Aéreo",        subtypes: ["aereo_carga",   "aereo_courier"] as ServiceSubtype[] },
  { key: "Aduanal",      subtypes: ["impo_integral", "expo_integral"] as ServiceSubtype[] },
  { key: "Integral",     subtypes: ["op_completa"]                    as ServiceSubtype[] },
  { key: "Comercial",    subtypes: ["comercializadora"]               as ServiceSubtype[] },
  { key: "Consultoría",  subtypes: ["consultoria"]                    as ServiceSubtype[] },
];

export default function StepSubtype({ serviceSubtype, setServiceSubtype }: Props) {
  return (
    <>
      <SectionTitle>Tipo de servicio a cotizar</SectionTitle>
      {GROUPS.map((group) => (
        <div key={group.key} style={{ display: "grid", gap: "6px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {group.key}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: group.subtypes.length === 1 ? "1fr" : "1fr 1fr", gap: "8px" }}>
            {group.subtypes.map((sub) => {
              const cfg      = SERVICE_SUBTYPE_CONFIG[sub];
              const selected = serviceSubtype === sub;
              return (
                <button
                  key={sub}
                  onClick={() => setServiceSubtype(sub)}
                  style={{
                    padding: "14px 16px", borderRadius: "var(--radius-md)",
                    cursor: "pointer", textAlign: "left",
                    background: selected ? "var(--color-info-bg)" : "var(--color-bg-subtle)",
                    border: `2px solid ${selected ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
                    display: "flex", alignItems: "flex-start", gap: "10px",
                  }}
                >
                  <span style={{ fontSize: "22px", flexShrink: 0 }}>{cfg.icon}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: selected ? "var(--color-brand-blue)" : "var(--color-text-primary)" }}>
                      {cfg.label}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px", lineHeight: 1.4 }}>
                      {cfg.description}
                    </div>
                  </div>
                  {selected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-blue)" strokeWidth="3" style={{ marginLeft: "auto", flexShrink: 0, marginTop: "2px" }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
