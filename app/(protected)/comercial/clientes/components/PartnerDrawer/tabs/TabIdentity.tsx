// ════════════════════════════════════════════════════════════════════════
// TabIdentity — Tab 1 del wizard PartnerDrawer
// ════════════════════════════════════════════════════════════════════════
// Captura la información básica del partner:
//   - Nombre comercial (required)
//   - Razón social (optional, recomendado)
//   - Industria/giro
//   - Sitio web
//   - Notas internas
//   - Roles del partner (al menos uno required): cliente / proveedor / logístico
//   - Estado activo/inactivo
//
// Validación inline:
//   - Resalta en rojo el nombre si falta o es muy corto
//   - Resalta los roles en rojo si ninguno está seleccionado
// ════════════════════════════════════════════════════════════════════════
"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CSSProperties } from "react";
import type { Partner, TabValidationState } from "../types";
import { INDUSTRIES } from "../types";
import {
  Field,
  FieldGrid,
  SectionTitle,
  FIELD_INPUT,
  FIELD_SELECT,
  FIELD_TEXTAREA,
} from "../components/Field";

// ── Props ─────────────────────────────────────────────────────────────
export type TabIdentityProps = {
  partner:      Partial<Partner>;
  validation:   TabValidationState;
  onPatch:      (patch: Partial<Partner>) => void;
};

// ── Estilos: tarjeta de rol ───────────────────────────────────────────
const ROLE_CARD_BASE: CSSProperties = {
  display:        "flex",
  alignItems:     "flex-start",
  gap:            "10px",
  padding:        "12px 14px",
  borderRadius:   "var(--radius-md)",
  border:         "1px solid var(--color-border)",
  background:     "var(--color-bg-subtle)",
  cursor:         "pointer",
  transition:     "border-color 0.15s, background 0.15s",
};

const ROLE_CARD_ACTIVE: CSSProperties = {
  ...ROLE_CARD_BASE,
  borderColor: "var(--color-brand-blue, #3b82f6)",
  background:  "var(--color-brand-blue-bg, rgba(59, 130, 246, 0.08))",
};

const CHECKBOX_STYLE: CSSProperties = {
  width:      "16px",
  height:     "16px",
  accentColor: "var(--color-brand-blue, #3b82f6)",
  cursor:     "pointer",
  marginTop:  "2px",
  flexShrink: 0,
};

// ── Helper: tarjeta de rol seleccionable ──────────────────────────────
function RoleCard({
  active,
  icon,
  title,
  description,
  onChange,
}: {
  active:      boolean;
  icon:        string;
  title:       string;
  description: string;
  onChange:    (next: boolean) => void;
}) {
  return (
    <label style={active ? ROLE_CARD_ACTIVE : ROLE_CARD_BASE}>
      <input
        type="checkbox"
        checked={active}
        onChange={(e) => onChange(e.target.checked)}
        style={CHECKBOX_STYLE}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display:    "flex",
            alignItems: "center",
            gap:        "8px",
            fontSize:   "13px",
            fontWeight: 700,
            color:      "var(--color-text-primary)",
            marginBottom: "3px",
          }}
        >
          <span style={{ fontSize: "16px" }}>{icon}</span>
          {title}
        </div>
        <div
          style={{
            fontSize:   "11px",
            color:      "var(--color-text-muted)",
            lineHeight: 1.45,
          }}
        >
          {description}
        </div>
      </div>
    </label>
  );
}

// ── Componente principal ──────────────────────────────────────────────
export function TabIdentity({ partner, validation, onPatch }: TabIdentityProps) {
  const { t } = useTranslation();

  const nameInvalid =
    !validation.isValid &&
    (!partner.name || partner.name.trim().length < 2);

  const noRoleSelected =
    !partner.is_customer &&
    !partner.is_supplier &&
    !partner.is_logistics_provider;

  return (
    <div
      style={{
        padding:  "20px",
        display:  "flex",
        flexDirection: "column",
        gap:      "20px",
      }}
    >
      {/* ─── SECCIÓN 1: Identidad básica ─── */}
      <div>
        <SectionTitle>{t("partner.sectionBasicInfo")}</SectionTitle>
        <div style={{ marginTop: "12px" }}>
          <FieldGrid columns={4}>
            <Field
              label={t("partner.name")}
              required
              span={2}
              error={nameInvalid ? validation.errorMessage : undefined}
            >
              <input
                type="text"
                value={partner.name ?? ""}
                onChange={(e) => onPatch({ name: e.target.value })}
                placeholder={t("partner.namePlaceholder")}
                style={{
                  ...FIELD_INPUT,
                  borderColor: nameInvalid
                    ? "var(--color-danger-text)"
                    : "var(--color-border)",
                }}
              />
            </Field>

            <Field label={t("partner.legalName")} span={2}>
              <input
                type="text"
                value={partner.legal_name ?? ""}
                onChange={(e) => onPatch({ legal_name: e.target.value })}
                placeholder={t("partner.legalNamePlaceholder")}
                style={FIELD_INPUT}
              />
            </Field>

            <Field label={t("partner.industry")}>
              <select
                value={partner.industry ?? ""}
                onChange={(e) => onPatch({ industry: e.target.value })}
                style={FIELD_SELECT}
              >
                <option value="">{t("partner.industryPlaceholder")}</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {t(`partner.industries.${ind}`)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t("partner.website")}>
              <input
                type="url"
                value={partner.website ?? ""}
                onChange={(e) => onPatch({ website: e.target.value })}
                placeholder="https://..."
                style={FIELD_INPUT}
              />
            </Field>

            <Field
              label={t("partner.activeStatus")}
              span={2}
              hint={t("partner.activeStatusHint")}
            >
              <label
                style={{
                  display:    "inline-flex",
                  alignItems: "center",
                  gap:        "8px",
                  height:     "36px",
                  cursor:     "pointer",
                  fontSize:   "13px",
                  color:      "var(--color-text-primary)",
                }}
              >
                <input
                  type="checkbox"
                  checked={partner.is_active ?? true}
                  onChange={(e) => onPatch({ is_active: e.target.checked })}
                  style={CHECKBOX_STYLE}
                />
                {partner.is_active ?? true
                  ? t("partner.statusActive")
                  : t("partner.statusInactive")}
              </label>
            </Field>

            <Field label={t("partner.notes")} span={4} hint={t("partner.notesHint")}>
              <textarea
                value={partner.notes ?? ""}
                onChange={(e) => onPatch({ notes: e.target.value })}
                placeholder={t("partner.notesPlaceholder")}
                style={FIELD_TEXTAREA}
                rows={3}
              />
            </Field>
          </FieldGrid>
        </div>
      </div>

      {/* ─── SECCIÓN 2: Roles del partner ─── */}
      <div>
        <SectionTitle>{t("partner.sectionRoles")}</SectionTitle>
        <div
          style={{
            fontSize:   "12px",
            color:      noRoleSelected
              ? "var(--color-danger-text)"
              : "var(--color-text-muted)",
            marginTop:  "8px",
            marginBottom: "12px",
            lineHeight: 1.5,
          }}
        >
          {noRoleSelected
            ? `⚠️ ${t("partner.rolesError")}`
            : t("partner.rolesHint")}
        </div>

        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap:                 "12px",
          }}
        >
          <RoleCard
            active={!!partner.is_customer}
            icon="🛒"
            title={t("partner.roleCustomerTitle")}
            description={t("partner.roleCustomerDesc")}
            onChange={(next) => onPatch({ is_customer: next })}
          />

          <RoleCard
            active={!!partner.is_supplier}
            icon="📦"
            title={t("partner.roleSupplierTitle")}
            description={t("partner.roleSupplierDesc")}
            onChange={(next) => onPatch({ is_supplier: next })}
          />

          <RoleCard
            active={!!partner.is_logistics_provider}
            icon="🚚"
            title={t("partner.roleLogisticsTitle")}
            description={t("partner.roleLogisticsDesc")}
            onChange={(next) =>
              onPatch({ is_logistics_provider: next })
            }
          />
        </div>
      </div>
    </div>
  );
}