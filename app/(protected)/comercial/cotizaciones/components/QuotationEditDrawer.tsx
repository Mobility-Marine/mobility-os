"use client";

import { useState, useEffect } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import type {
  Quotation,
  CreateQuotationPayload,
  CreateItemPayload,
  CreateServicePayload,
} from "../types/quotations.types";
import {
  isQuotationEditable,
  getQuotationEditBlockReason,
} from "../types/quotations.types";

import { EMPTY_CLIENT, EMPTY_CONFIG } from "./drawer/drawerState";
import type {
  BillingConceptDraft,
  ConfigState,
  ClientState,
} from "./drawer/drawerState";

// Steps reutilizables del CreateDrawer
import StepClient from "./drawer/steps/StepClient";
import StepConfig from "./drawer/steps/StepConfig";
import StepItems from "./drawer/steps/StepItems";

// Content por subtipo (los 11)
import ContentTerrestre_LTL, {
  EMPTY_TERRESTRE_LTL_INFO,
} from "./drawer/byType/ContentTerrestre_LTL";
import ContentTerrestre_FTL, {
  EMPTY_TERRESTRE_FTL_INFO,
} from "./drawer/byType/ContentTerrestre_FTL";
import ContentMaritimo_FCL, {
  EMPTY_MARITIMO_FCL_INFO,
} from "./drawer/byType/ContentMaritimo_FCL";
import ContentMaritimo_LCL, {
  EMPTY_MARITIMO_LCL_INFO,
} from "./drawer/byType/ContentMaritimo_LCL";
import ContentAereo_Carga, {
  EMPTY_AEREO_CARGA_INFO,
} from "./drawer/byType/ContentAereo_Carga";
import ContentAereo_Courier, {
  EMPTY_AEREO_COURIER_INFO,
} from "./drawer/byType/ContentAereo_Courier";
import ContentImpo, { EMPTY_IMPO_INFO } from "./drawer/byType/ContentImpo";
import ContentExpo, { EMPTY_EXPO_INFO } from "./drawer/byType/ContentExpo";
import ContentOpCompleta, {
  EMPTY_OP_COMPLETA_INFO,
} from "./drawer/byType/ContentOpCompleta";
import ContentComercializadora, {
  EMPTY_COMERCIALIZADORA_INFO,
} from "./drawer/byType/ContentComercializadora";
import ContentConsultoria, {
  EMPTY_CONSULTORIA_INFO,
} from "./drawer/byType/ContentConsultoria";

// Iconos
import {
  IconX,
  IconCheck,
  IconLock,
  IconUser,
  IconBoxes,
  IconFileText,
  IconClock,
  IconAlertTriangle,
} from "./Icons";

// ═══════════════════════════════════════════════════════════════════
// QUOTATION EDIT DRAWER — Drawer modal de edición ERP-grade
//
// Patrón Partners/SAP: tabs en lugar de wizard. Todo visible a la vez.
// Reutiliza los 11 Content del CreateDrawer (DRY) — el patrón
// arquitectónico es: cada Content es un componente compuesto que
// gestiona BOTH la información específica del subtipo (general_info)
// AND los billing_concepts/lines.
//
// REGLA: Cotización aceptada/cancelada NO es editable (audit trail SAP).
// En esos casos se muestra una vista de solo-lectura con audit trail.
// ═══════════════════════════════════════════════════════════════════

type Tab = "client" | "service" | "config" | "audit";

type Props = {
  open: boolean;
  quotation: Quotation | null;
  onClose: () => void;
  onSave: (
    id: string,
    payload: CreateQuotationPayload,
    items?: Omit<CreateItemPayload, "quotation_id">[],
    billingConcepts?: BillingConceptDraft[],
  ) => Promise<void>;
  saving?: boolean;
};

export default function QuotationEditDrawer({
  open,
  quotation,
  onClose,
  onSave,
  saving = false,
}: Props) {
  const { companyId } = useTenant();

  const [activeTab, setActiveTab] = useState<Tab>("client");
  const [error, setError] = useState<string | null>(null);
  const [svcCatalog, setSvcCatalog] = useState<any[]>([]);

  // ── Estado general ─────────────────────────────────────────
  const [clientState, setClientState] = useState<ClientState>(EMPTY_CLIENT());
  const [config, setConfig] = useState<ConfigState>(EMPTY_CONFIG());
  const [items, setItems] = useState<Omit<CreateItemPayload, "quotation_id">[]>([]);
  const [billingConcepts, setBillingConcepts] = useState<BillingConceptDraft[]>([]);

  // ── Estado por subtipo (11 estados, igual que CreateDrawer) ─
  const [ltlInfo, setLtlInfo] = useState(EMPTY_TERRESTRE_LTL_INFO());
  const [ftlInfo, setFtlInfo] = useState(EMPTY_TERRESTRE_FTL_INFO());
  const [fclInfo, setFclInfo] = useState(EMPTY_MARITIMO_FCL_INFO());
  const [lclInfo, setLclInfo] = useState(EMPTY_MARITIMO_LCL_INFO());
  const [acInfo, setAcInfo] = useState(EMPTY_AEREO_CARGA_INFO());
  const [courInfo, setCourInfo] = useState(EMPTY_AEREO_COURIER_INFO());
  const [impoInfo, setImpoInfo] = useState(EMPTY_IMPO_INFO());
  const [expoInfo, setExpoInfo] = useState(EMPTY_EXPO_INFO());
  const [opInfo, setOpInfo] = useState(EMPTY_OP_COMPLETA_INFO());
  const [comInfo, setComInfo] = useState(EMPTY_COMERCIALIZADORA_INFO());
  const [consInfo, setConsInfo] = useState(EMPTY_CONSULTORIA_INFO());

  // ── Cargar catálogo de productos/servicios ────────────────
  useEffect(() => {
    if (!open || !companyId) return;
    supabase
      .from("products")
      .select("id, name, sku, unit, unit_price, sat_product_code, sat_unit_code")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .eq("product_type", "service")
      .order("name")
      .then(({ data }) => setSvcCatalog(data ?? []));
  }, [open, companyId]);

  // ── Hidratar estado desde la cotización al abrir ──────────
  useEffect(() => {
    if (!open || !quotation) return;

    setActiveTab("client");
    setError(null);

    // Cliente — hidratar AMBOS estados (selectedClient para modo sistema,
    // manualClient para modo manual). El editor decide cuál usar según
    // useManual, pero los datos siempre deben estar disponibles.
    const isManual = !quotation.client_id;
    setClientState({
      selectedClient: (quotation as any).client ?? null,
      manualClient: {
        name:  isManual ? (quotation.client_name ?? "") : "",
        email: isManual ? ((quotation as any).client_email ?? "") : "",
        rfc:   isManual ? ((quotation as any).client_rfc ?? "") : "",
      },
      useManual: isManual,
      contactId: "",
      contactName: quotation.contact_name ?? "",
      contactEmail: quotation.contact_email ?? "",
      contactTitle: quotation.contact_title ?? "",
    });

    // Config
    setConfig({
      currency: quotation.currency ?? "MXN",
      discount_amount: String(quotation.discount_amount ?? 0),
      tax_rate: String(quotation.tax_rate ?? 16),
      valid_until: quotation.valid_until ?? "",
      language: (quotation.language as any) ?? "es",
      notes: quotation.notes ?? "",
      terms: quotation.terms ?? "",
    });

    // Items (productos)
    if (quotation.type === "products") {
      setItems(
        (quotation.items ?? []).map((i: any) => ({
          product_id: i.product_id ?? undefined,
          sku: i.sku ?? undefined,
          description: i.description,
          details: i.details ?? undefined,
          quantity: i.quantity,
          unit: i.unit,
          unit_price: i.unit_price,
          discount_pct: i.discount_pct ?? 0,
        })),
      );
    } else {
      setItems([]);
    }

    // Billing concepts (servicios)
    if (quotation.type === "services") {
      setBillingConcepts(
        ((quotation as any).billing_concepts ?? []).map((c: any) => ({
          tempId: c.id,
          product_id: c.product_id ?? undefined,
          description: c.description,
          currency: c.currency,
          lines: (c.lines ?? []).map((l: any) => ({
            service_type: l.service_type,
            description: l.description,
            origin: l.origin ?? undefined,
            destination: l.destination ?? undefined,
            incoterm: l.incoterm ?? undefined,
            transit_time: l.transit_time ?? undefined,
            currency: l.currency,
            price: l.price,
            notes: l.notes ?? undefined,
            product_id: l.product_id ?? undefined,
            tax_rate: l.tax_rate ?? 16,
            unit_label: l.unit_label ?? undefined,
            quantity: l.quantity ?? undefined,
            unit_price: l.unit_price ?? undefined,
          })),
        })),
      );
    } else {
      setBillingConcepts([]);
    }

    // General info — cargar al state correcto del subtipo
    const gi = quotation.general_info as any;
    // Reset todos primero
    setLtlInfo(EMPTY_TERRESTRE_LTL_INFO());
    setFtlInfo(EMPTY_TERRESTRE_FTL_INFO());
    setFclInfo(EMPTY_MARITIMO_FCL_INFO());
    setLclInfo(EMPTY_MARITIMO_LCL_INFO());
    setAcInfo(EMPTY_AEREO_CARGA_INFO());
    setCourInfo(EMPTY_AEREO_COURIER_INFO());
    setImpoInfo(EMPTY_IMPO_INFO());
    setExpoInfo(EMPTY_EXPO_INFO());
    setOpInfo(EMPTY_OP_COMPLETA_INFO());
    setComInfo(EMPTY_COMERCIALIZADORA_INFO());
    setConsInfo(EMPTY_CONSULTORIA_INFO());

    if (gi && quotation.service_subtype) {
      switch (quotation.service_subtype) {
        case "terrestre_ltl":
          setLtlInfo({ ...EMPTY_TERRESTRE_LTL_INFO(), ...gi });
          break;
        case "terrestre_ftl":
          setFtlInfo({ ...EMPTY_TERRESTRE_FTL_INFO(), ...gi });
          break;
        case "maritimo_fcl":
          setFclInfo({ ...EMPTY_MARITIMO_FCL_INFO(), ...gi });
          break;
        case "maritimo_lcl":
          setLclInfo({ ...EMPTY_MARITIMO_LCL_INFO(), ...gi });
          break;
        case "aereo_carga":
          setAcInfo({ ...EMPTY_AEREO_CARGA_INFO(), ...gi });
          break;
        case "aereo_courier":
          setCourInfo({ ...EMPTY_AEREO_COURIER_INFO(), ...gi });
          break;
        case "impo_integral":
          setImpoInfo({ ...EMPTY_IMPO_INFO(), ...gi });
          break;
        case "expo_integral":
          setExpoInfo({ ...EMPTY_EXPO_INFO(), ...gi });
          break;
        case "op_completa":
          setOpInfo({ ...EMPTY_OP_COMPLETA_INFO(), ...gi });
          break;
        case "comercializadora":
          setComInfo({ ...EMPTY_COMERCIALIZADORA_INFO(), ...gi });
          break;
        case "consultoria":
          setConsInfo({ ...EMPTY_CONSULTORIA_INFO(), ...gi });
          break;
      }
    }
  }, [open, quotation?.id]);

  // ── Helper: obtener general_info del subtipo activo ───────
  function getGeneralInfo(): any {
    if (!quotation?.service_subtype) return undefined;
    switch (quotation.service_subtype) {
      case "terrestre_ltl":
        return ltlInfo;
      case "terrestre_ftl":
        return ftlInfo;
      case "maritimo_fcl":
        return fclInfo;
      case "maritimo_lcl":
        return lclInfo;
      case "aereo_carga":
        return acInfo;
      case "aereo_courier":
        return courInfo;
      case "impo_integral":
        return impoInfo;
      case "expo_integral":
        return expoInfo;
      case "op_completa":
        return opInfo;
      case "comercializadora":
        return comInfo;
      case "consultoria":
        return consInfo;
      default:
        return undefined;
    }
  }

  // ── Render Content del subtipo activo ─────────────────────
  function renderContentBySubtype() {
    if (!quotation || quotation.type !== "services" || !quotation.service_subtype) {
      return (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
            color: "var(--color-text-muted)",
            fontSize: "13px",
          }}
        >
          Sin subtipo de servicio asignado
        </div>
      );
    }

    const contentProps = { billingConcepts, setBillingConcepts, svcCatalog };

    switch (quotation.service_subtype) {
      case "terrestre_ltl":
        return (
          <ContentTerrestre_LTL info={ltlInfo} setInfo={setLtlInfo} {...contentProps} />
        );
      case "terrestre_ftl":
        return (
          <ContentTerrestre_FTL info={ftlInfo} setInfo={setFtlInfo} {...contentProps} />
        );
      case "maritimo_fcl":
        return (
          <ContentMaritimo_FCL info={fclInfo} setInfo={setFclInfo} {...contentProps} />
        );
      case "maritimo_lcl":
        return (
          <ContentMaritimo_LCL info={lclInfo} setInfo={setLclInfo} {...contentProps} />
        );
      case "aereo_carga":
        return <ContentAereo_Carga info={acInfo} setInfo={setAcInfo} {...contentProps} />;
      case "aereo_courier":
        return (
          <ContentAereo_Courier info={courInfo} setInfo={setCourInfo} {...contentProps} />
        );
      case "impo_integral":
        return <ContentImpo info={impoInfo} setInfo={setImpoInfo} {...contentProps} />;
      case "expo_integral":
        return <ContentExpo info={expoInfo} setInfo={setExpoInfo} {...contentProps} />;
      case "op_completa":
        return <ContentOpCompleta info={opInfo} setInfo={setOpInfo} {...contentProps} />;
      case "comercializadora":
        return (
          <ContentComercializadora info={comInfo} setInfo={setComInfo} {...contentProps} />
        );
      case "consultoria":
        return (
          <ContentConsultoria info={consInfo} setInfo={setConsInfo} {...contentProps} />
        );
      default:
        return (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontSize: "13px",
            }}
          >
            Subtipo no soportado
          </div>
        );
    }
  }

  // ── Validación + guardado ─────────────────────────────────
  async function handleSave() {
    if (!quotation) return;
    setError(null);

    if (!isQuotationEditable(quotation)) {
      setError(getQuotationEditBlockReason(quotation) ?? "No editable");
      return;
    }

    // Validaciones
    if (quotation.type === "services") {
      if (billingConcepts.length === 0) {
        setError("Debes tener al menos un concepto de facturación");
        setActiveTab("service");
        return;
      }
      const empty = billingConcepts.find((c) => c.lines.length === 0);
      if (empty) {
        setError(
          `El concepto "${empty.description}" no tiene líneas de detalle`,
        );
        setActiveTab("service");
        return;
      }
    } else {
      if (items.length === 0) {
        setError("Debes tener al menos un producto");
        setActiveTab("service");
        return;
      }
    }

    // Cliente
    const clientName = clientState.useManual
      ? clientState.manualClient.name
      : clientState.selectedClient?.name;
    if (!clientName?.trim()) {
      setError("Falta nombre del cliente");
      setActiveTab("client");
      return;
    }
    const clientEmail = clientState.useManual
      ? clientState.manualClient.email
      : clientState.selectedClient?.email;
    const clientRfc = clientState.useManual
      ? clientState.manualClient.rfc
      : clientState.selectedClient?.rfc;

    const discount = Number(config.discount_amount) || 0;

    // Auto-detectar moneda (igual que CreateDrawer)
    let currency = config.currency;
    if (billingConcepts.length > 0) {
      const currencies = billingConcepts.flatMap((c) =>
        c.lines.map((l) => (l as any).currency ?? c.currency),
      );
      const usd = currencies.filter((cur) => cur === "USD").length;
      const mxn = currencies.filter((cur) => cur === "MXN").length;
      currency = usd >= mxn ? "USD" : "MXN";
    }

    const payload: CreateQuotationPayload = {
      type: quotation.type,
      service_subtype: quotation.service_subtype ?? undefined,
      language: config.language,
      general_info: getGeneralInfo(),
      client_id: !clientState.useManual ? clientState.selectedClient?.id : undefined,
      client_name: clientName,
      client_email: clientEmail || undefined,
      client_rfc: clientRfc || undefined,
      contact_name: clientState.contactName || undefined,
      contact_email: clientState.contactEmail || undefined,
      contact_title: clientState.contactTitle || undefined,
      template: quotation.template,
      currency,
      discount_amount: discount || undefined,
      tax_rate: Number(config.tax_rate) || 16,
      valid_until: config.valid_until || undefined,
      notes: config.notes || undefined,
      terms: config.terms || undefined,
    };

    try {
      await onSave(
        quotation.id,
        payload,
        quotation.type === "products" ? items : undefined,
        quotation.type === "services" ? billingConcepts : undefined,
      );
    } catch (e: any) {
      setError(e?.message ?? "Error al guardar cambios");
    }
  }

  if (!open || !quotation) return null;

  const editable = isQuotationEditable(quotation);
  const blockReason = getQuotationEditBlockReason(quotation);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "client", label: "Cliente", icon: <IconUser size={13} /> },
    {
      id: "service",
      label: quotation.type === "services" ? "Servicio" : "Productos",
      icon: <IconBoxes size={13} />,
    },
    { id: "config", label: "Configuración", icon: <IconFileText size={13} /> },
    { id: "audit", label: "Audit trail", icon: <IconClock size={13} /> },
  ];

  return (
    <>
      {/* BACKDROP */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 400,
        }}
      />

      {/* DRAWER */}
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: "min(720px, 96vw)",
          background: "var(--color-bg-base)",
          borderLeft: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-xl)",
          zIndex: 401,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--color-border-faint)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: editable ? "12px" : "10px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "var(--color-text-primary)",
                }}
              >
                {editable ? "Editar cotización" : "Cotización (solo lectura)"}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-muted)",
                  marginTop: "2px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {quotation.quote_number} ·{" "}
                {(quotation as any).client?.name ?? quotation.client_name ?? "Sin cliente"}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-subtle)",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconX size={14} />
            </button>
          </div>

          {/* TABS o BANNER de bloqueo */}
          {editable ? (
            <div
              style={{
                display: "flex",
                gap: "4px",
                borderBottom: "1px solid var(--color-border-faint)",
                paddingTop: "2px",
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "8px 14px",
                    background: "transparent",
                    border: "none",
                    borderBottom: `2px solid ${
                      activeTab === tab.id ? "var(--color-brand-blue)" : "transparent"
                    }`,
                    color:
                      activeTab === tab.id
                        ? "var(--color-brand-blue)"
                        : "var(--color-text-muted)",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "-1px",
                    transition: "var(--transition-fast)",
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-warning-bg)",
                border: "1px solid var(--color-warning-border)",
                color: "var(--color-warning-text)",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                lineHeight: 1.5,
              }}
            >
              <IconLock size={14} />
              <span>{blockReason}</span>
            </div>
          )}
        </div>

        {/* ERROR */}
        {error && (
          <div
            style={{
              margin: "12px 24px 0",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-danger-bg)",
              border: "1px solid var(--color-danger-border)",
              color: "var(--color-danger-text)",
              fontSize: "12px",
              flexShrink: 0,
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <IconAlertTriangle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* CONTENT */}
        <div
          style={{
            flex: 1,
            overflowY: "scroll",
            overflowX: "hidden",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {!editable ? (
            <NonEditableView quotation={quotation} />
          ) : activeTab === "client" ? (
            <StepClient
              state={clientState}
              onChange={(u) => setClientState((p) => ({ ...p, ...u }))}
            />
          ) : activeTab === "service" ? (
            quotation.type === "products" ? (
              <StepItems items={items} setItems={setItems} companyId={companyId ?? ""} />
            ) : (
              renderContentBySubtype()
            )
          ) : activeTab === "config" ? (
            <StepConfig
              state={config}
              onChange={(u) => setConfig((p) => ({ ...p, ...u }))}
            />
          ) : activeTab === "audit" ? (
            <AuditView quotation={quotation} />
          ) : null}
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid var(--color-border-faint)",
            display: "flex",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              height: "40px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-subtle)",
              color: "var(--color-text-second)",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {editable ? "Cancelar" : "Cerrar"}
          </button>
          {editable && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 2,
                height: "40px",
                borderRadius: "var(--radius-md)",
                background: saving ? "var(--color-bg-subtle)" : "var(--color-brand-blue)",
                color: saving ? "var(--color-text-muted)" : "#fff",
                border: "none",
                fontSize: "13px",
                fontWeight: 800,
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <IconCheck size={15} strokeWidth={2.5} />
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AUDIT TRAIL VIEW — quién creó · modificó · envió · aceptó · rechazó
// ═══════════════════════════════════════════════════════════════════
function AuditView({ quotation }: { quotation: Quotation }) {
  const [names, setNames] = useState<{
    created_by_name: string | null;
    updated_by_name: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("../services/quotations.service")
      .then(({ fetchQuotationAuditNames }) => fetchQuotationAuditNames(quotation))
      .then((result) => {
        if (!cancelled) setNames(result);
      })
      .catch(() => {
        if (!cancelled) setNames({ created_by_name: null, updated_by_name: null });
      });
    return () => {
      cancelled = true;
    };
  }, [quotation.id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        Audit trail
      </div>

      <AuditRow
        label="Creada"
        timestamp={quotation.created_at}
        userName={names?.created_by_name ?? null}
      />

      {quotation.updated_at &&
        quotation.updated_at !== quotation.created_at && (
          <AuditRow
            label="Última modificación"
            timestamp={quotation.updated_at}
            userName={names?.updated_by_name ?? null}
          />
        )}

      {quotation.sent_at && (
        <AuditRow
          label="Enviada"
          timestamp={quotation.sent_at}
          userName={null}
          accent="var(--color-info-text)"
        />
      )}

      {quotation.accepted_at && (
        <AuditRow
          label="Aceptada"
          timestamp={quotation.accepted_at}
          userName={null}
          accent="var(--color-success-text)"
        />
      )}

      {quotation.rejected_at && (
        <AuditRow
          label="Rechazada"
          timestamp={quotation.rejected_at}
          userName={null}
          accent="var(--color-danger-text)"
        />
      )}
    </div>
  );
}

function AuditRow({
  label,
  timestamp,
  userName,
  accent,
}: {
  label: string;
  timestamp: string;
  userName: string | null;
  accent?: string;
}) {
  const date = new Date(timestamp);
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-bg-subtle)",
        border: "1px solid var(--color-border-faint)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: accent ?? "var(--color-text-primary)",
            textTransform: "uppercase",
            letterSpacing: "0.4px",
            marginBottom: "2px",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--color-text-second)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {userName ?? "—"}
        </div>
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "var(--color-text-muted)",
          fontVariantNumeric: "tabular-nums",
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {date.toLocaleDateString("es-MX", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
        <br />
        {date.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NON-EDITABLE VIEW — cuando aceptada/cancelada
// ═══════════════════════════════════════════════════════════════════
function NonEditableView({ quotation }: { quotation: Quotation }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          padding: "16px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-info-bg)",
          border: "1px solid var(--color-info-border)",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            color: "var(--color-info-text)",
            marginTop: "1px",
          }}
        >
          <IconLock size={18} />
        </div>
        <div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 800,
              color: "var(--color-info-text)",
              marginBottom: "4px",
            }}
          >
            Audit trail SAP-style
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--color-text-second)",
              lineHeight: 1.6,
            }}
          >
            Esta cotización está{" "}
            <strong>
              {quotation.status === "accepted" ? "aceptada" : "cancelada"}
            </strong>{" "}
            y no se puede modificar. Para crear una nueva versión con los mismos datos,
            usa el botón <strong>Duplicar</strong> en la barra de acciones — generará
            una cotización nueva con folio nuevo, conservando ésta intacta como evidencia.
          </div>
        </div>
      </div>

      <AuditView quotation={quotation} />
    </div>
  );
}