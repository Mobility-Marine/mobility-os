"use client";

import type { Prospect } from "../types/prospects.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getProspectStage, isOverdue, hasContact, isHighValue } from "../services/prospects.normalization";

type Props = {
  prospects: Prospect[];
  onSelect: (p: Prospect) => void;
};

export default function ProspectDailyActionPanel({ prospects, onSelect }: Props) {
  const { t } = useTranslation();

  const overdue = prospects.filter((p) => isOverdue(p) && (p.is_active ?? true));
  const noContact = prospects.filter((p) => !hasContact(p) && (p.is_active ?? true));
  const highValue = prospects.filter((p) => {
    const stage = getProspectStage(p);
    return isHighValue(p, 100_000) && (stage === "new" || stage === "contacted");
  });
  const readyToConvert = prospects.filter((p) => getProspectStage(p) === "negotiation");

  const sections = [
    {
      key:      "overdue",
      label:    t.prospects.alertOverdue ?? "Seguimientos vencidos",
      color:    "var(--color-danger-text)",
      bg:       "var(--color-danger-bg)",
      border:   "var(--color-danger-border)",
      items:    overdue,
    },
    {
      key:      "noContact",
      label:    t.prospects.alertMissingContact ?? "Sin datos de contacto",
      color:    "var(--color-warning-text)",
      bg:       "var(--color-warning-bg)",
      border:   "var(--color-warning-border)",
      items:    noContact,
    },
    {
      key:      "highValue",
      label:    t.prospects.alertHighValueStalled ?? "Alto valor sin avance",
      color:    "var(--color-info-text)",
      bg:       "var(--color-info-bg)",
      border:   "var(--color-info-border)",
      items:    highValue,
    },
    {
      key:      "convert",
      label:    t.prospects.alertReadyToConvert ?? "Listos para convertir",
      color:    "var(--color-success-text)",
      bg:       "var(--color-success-bg)",
      border:   "var(--color-success-border)",
      items:    readyToConvert,
    },
  ];

  const totalActions = sections.reduce((s, sec) => s + sec.items.length, 0);

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "18px",
      display: "grid", gap: "14px",
      height: "100%", overflowY: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          {t.prospects.dailyActions ?? "Acciones prioritarias hoy"}
        </div>
        {totalActions > 0 && (
          <span style={{
            padding: "2px 8px", borderRadius: "var(--radius-full)",
            background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
            fontSize: "11px", fontWeight: 600, color: "var(--color-danger-text)",
          }}>
            {totalActions}
          </span>
        )}
      </div>

      {totalActions === 0 ? (
        <div style={{
          padding: "20px", borderRadius: "var(--radius-md)",
          background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)",
          textAlign: "center", fontSize: "13px",
          fontWeight: 500, color: "var(--color-success-text)",
        }}>
          {t.dashboard.allNormal}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {sections.map((sec) => {
            if (!sec.items.length) return null;
            return (
              <div key={sec.key} style={{
                background: sec.bg,
                border: `1px solid ${sec.border}`,
                borderRadius: "var(--radius-md)",
                padding: "12px",
                display: "grid", gap: "8px",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: sec.color }}>
                    {sec.label}
                  </span>
                  <span style={{
                    fontSize: "10px", fontWeight: 700,
                    padding: "1px 6px", borderRadius: "var(--radius-full)",
                    background: sec.color + "20", color: sec.color,
                  }}>
                    {sec.items.length}
                  </span>
                </div>
                <div style={{ display: "grid", gap: "4px" }}>
                  {sec.items.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onSelect(p)}
                      style={{
                        padding: "7px 10px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--color-bg-base)",
                        border: `1px solid ${sec.border}`,
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        fontSize: "12px", fontWeight: 600,
                        color: "var(--color-text-primary)",
                        transition: "var(--transition-fast)",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "0.8"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {p.company_name ?? p.name ?? t.prospects.noName}
                      </span>
                      {p.estimated_value && (
                        <span style={{ fontSize: "11px", color: sec.color, marginLeft: "8px", flexShrink: 0 }}>
                          ${Number(p.estimated_value).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
