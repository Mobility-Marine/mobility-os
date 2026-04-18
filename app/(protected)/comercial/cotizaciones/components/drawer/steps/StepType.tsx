"use client";
import { SectionTitle, InfoBox } from "../drawerShared";
import type { QuotationType } from "../../../types/quotations.types";

type Props = {
  quotType:    QuotationType;
  setQuotType: (t: QuotationType) => void;
};

export default function StepType({ quotType, setQuotType }: Props) {
  const OPTIONS = [
    {
      value: "services" as const,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="3" width="15" height="13"/>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      ),
      title: "Servicios logísticos",
      desc:  "Terrestre, marítimo, aéreo, aduanal, consultoría…",
    },
    {
      value: "products" as const,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      ),
      title: "Productos",
      desc:  "Materiales, mercancías, equipos, insumos…",
    },
  ] as const;

  return (
    <>
      <SectionTitle>¿Qué tipo de cotización es?</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setQuotType(opt.value)}
            style={{
              padding: "20px", borderRadius: "var(--radius-lg)",
              cursor: "pointer", textAlign: "left",
              background: quotType === opt.value ? "var(--color-info-bg)" : "var(--color-bg-subtle)",
              border: `2px solid ${quotType === opt.value ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
              display: "flex", flexDirection: "column", gap: "8px",
            }}
          >
            <div style={{ color: quotType === opt.value ? "var(--color-brand-blue)" : "var(--color-text-muted)" }}>
              {opt.icon}
            </div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-text-primary)" }}>{opt.title}</div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>{opt.desc}</div>
            {quotType === opt.value && (
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-brand-blue)", display: "flex", alignItems: "center", gap: "4px" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Seleccionado
              </div>
            )}
          </button>
        ))}
      </div>
      <InfoBox type={quotType === "services" ? "info" : "success"}>
        {quotType === "services"
          ? "Al aceptarse → genera Embarque en módulo Logística"
          : "Al aceptarse → genera Pedido en módulo Comercial"}
      </InfoBox>
    </>
  );
}
