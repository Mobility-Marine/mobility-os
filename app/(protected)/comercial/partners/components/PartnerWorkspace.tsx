// ════════════════════════════════════════════════════════════════════════
// PartnerWorkspace — Panel central de detalle del partner seleccionado
// ════════════════════════════════════════════════════════════════════════
// Vista detalle ERP-grade del partner activo:
//   - Header con identidad: nombre, razón social, RFC, status, rating
//   - Badges de roles + indicador 69-B
//   - Acciones primarias: Editar (→ PartnerDrawer en 5D), Activar/Desactivar
//   - Tabs internos:
//     * Resumen     → Customer 360 (KPIs financieros + operaciones recientes)
//     * Contactos   → lista de client_contacts del partner
//     * Direcciones → lista de client_addresses del partner
//     * Actividad   → timeline de eventos (PartnerActivityPanel)
//     * Documentos  → lista de partner_documents
//
// Cada tab carga sus propios datos de manera defensiva (si una tabla
// falla, las demás siguen funcionando).
// ════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { PartnerListItem } from "../types/partners.types";
import { rolesText } from "../types/partners.types";
import PartnerActivityPanel from "./PartnerActivityPanel";

export type PartnerWorkspaceProps = {
  partner:           PartnerListItem;
  companyId:         string | undefined;
  onEditPartner:     (partnerId: string) => void;
  onToggleActive:    (partnerId: string, newActive: boolean) => Promise<void>;
};

type WorkspaceTab = "summary" | "contacts" | "addresses" | "activity" | "documents";

type PartnerContact = {
  id:         string;
  name:       string;
  role:       string | null;
  title:      string | null;
  email:      string | null;
  phone:      string | null;
  is_primary: boolean;
  notes:      string | null;
};

type PartnerAddress = {
  id:           string;
  type:         string | null;
  alias:        string | null;
  street:       string | null;
  ext_number:   string | null;
  int_number:   string | null;
  neighborhood: string | null;
  city:         string | null;
  state:        string | null;
  zip_code:     string | null;
  country:      string | null;
  is_default:   boolean;
};

type PartnerDocument = {
  id:                    string;
  document_type:         string | null;
  file_name:             string;
  file_url:              string | null;
  expiration_date:       string | null;
  uploaded_at:           string | null;
};

const WORKSPACE: CSSProperties = {
  height:         "100%",
  display:        "flex",
  flexDirection:  "column",
  borderRadius:   "var(--radius-lg, 12px)",
  border:         "1px solid var(--color-border)",
  background:     "var(--color-bg-elevated)",
  overflow:       "hidden",
};

const HEADER: CSSProperties = {
  display:        "flex",
  flexDirection:  "column",
  gap:            "10px",
  padding:        "20px 24px",
  borderBottom:   "1px solid var(--color-border)",
  background:     "linear-gradient(180deg, var(--color-bg-elevated), var(--color-bg-subtle))",
};

const HEADER_TOP: CSSProperties = {
  display:        "flex",
  alignItems:     "flex-start",
  justifyContent: "space-between",
  gap:            "16px",
  flexWrap:       "wrap",
};

const TITLE_BLOCK: CSSProperties = {
  flex:           1,
  minWidth:       0,
};

const TITLE: CSSProperties = {
  fontSize:       "20px",
  fontWeight:     700,
  color:          "var(--color-text-primary)",
  lineHeight:     1.2,
  margin:         0,
};

const SUBTITLE: CSSProperties = {
  fontSize:       "12px",
  color:          "var(--color-text-muted)",
  marginTop:      "2px",
};

const META_ROW: CSSProperties = {
  display:        "flex",
  gap:            "10px",
  alignItems:     "center",
  marginTop:      "8px",
  flexWrap:       "wrap",
};

const BADGE_BASE: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  gap:            "4px",
  padding:        "3px 10px",
  borderRadius:   "var(--radius-md)",
  fontSize:       "11px",
  fontWeight:     600,
  letterSpacing:  "0.2px",
};

const BADGE_ROLE: CSSProperties = {
  ...BADGE_BASE,
  background:     "rgba(59, 130, 246, 0.1)",
  color:          "var(--color-brand-blue, #3b82f6)",
};

const BADGE_ACTIVE: CSSProperties = {
  ...BADGE_BASE,
  background:     "rgba(34, 197, 94, 0.15)",
  color:          "var(--color-success-text, #22c55e)",
};

const BADGE_INACTIVE: CSSProperties = {
  ...BADGE_BASE,
  background:     "rgba(148, 163, 184, 0.15)",
  color:          "var(--color-text-muted)",
};

const RFC_TAG: CSSProperties = {
  fontFamily:     "monospace",
  fontSize:       "11px",
  color:          "var(--color-text-muted)",
  padding:        "3px 8px",
  background:     "var(--color-bg-subtle)",
  borderRadius:   "var(--radius-sm, 4px)",
};

const ACTIONS: CSSProperties = {
  display:        "flex",
  gap:            "8px",
  flexShrink:     0,
};

const BTN_PRIMARY: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  gap:            "6px",
  padding:        "8px 16px",
  borderRadius:   "var(--radius-md)",
  background:     "var(--color-brand-blue, #3b82f6)",
  color:          "#fff",
  fontSize:       "13px",
  fontWeight:     600,
  border:         "none",
  cursor:         "pointer",
  outline:        "none",
};

const BTN_SECONDARY: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  gap:            "6px",
  padding:        "8px 14px",
  borderRadius:   "var(--radius-md)",
  background:     "var(--color-bg-elevated)",
  color:          "var(--color-text-primary)",
  fontSize:       "13px",
  fontWeight:     600,
  border:         "1px solid var(--color-border)",
  cursor:         "pointer",
  outline:        "none",
};

const TABS: CSSProperties = {
  display:        "flex",
  gap:            "2px",
  padding:        "0 16px",
  borderBottom:   "1px solid var(--color-border)",
  background:     "var(--color-bg-subtle)",
};

const TAB: CSSProperties = {
  padding:        "10px 14px",
  fontSize:       "13px",
  fontWeight:     600,
  color:          "var(--color-text-muted)",
  background:     "transparent",
  border:         "none",
  borderBottom:   "2px solid transparent",
  cursor:         "pointer",
  outline:        "none",
  transition:     "color 0.15s, border-color 0.15s",
};

const TAB_ACTIVE: CSSProperties = {
  ...TAB,
  color:          "var(--color-brand-blue, #3b82f6)",
  borderBottom:   "2px solid var(--color-brand-blue, #3b82f6)",
};

const CONTENT: CSSProperties = {
  flex:           1,
  overflowY:      "auto",
  padding:        "20px 24px",
};

const SECTION_TITLE: CSSProperties = {
  fontSize:       "11px",
  fontWeight:     700,
  letterSpacing:  "0.5px",
  textTransform:  "uppercase",
  color:          "var(--color-text-muted)",
  marginBottom:   "10px",
};

const KPI_GRID: CSSProperties = {
  display:             "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap:                 "10px",
  marginBottom:        "20px",
};

const KPI_CARD: CSSProperties = {
  padding:        "12px 14px",
  borderRadius:   "var(--radius-md)",
  border:         "1px solid var(--color-border)",
  background:     "var(--color-bg-subtle)",
};

const KPI_LABEL: CSSProperties = {
  fontSize:       "10px",
  fontWeight:     600,
  letterSpacing:  "0.3px",
  textTransform:  "uppercase",
  color:          "var(--color-text-muted)",
};

const KPI_VALUE: CSSProperties = {
  fontSize:       "16px",
  fontWeight:     700,
  color:          "var(--color-text-primary)",
  marginTop:      "4px",
};

const ITEM_CARD: CSSProperties = {
  display:        "flex",
  flexDirection:  "column",
  gap:            "4px",
  padding:        "12px 14px",
  borderRadius:   "var(--radius-md)",
  border:         "1px solid var(--color-border)",
  background:     "var(--color-bg-subtle)",
  marginBottom:   "8px",
};

const ITEM_NAME: CSSProperties = {
  fontSize:       "13px",
  fontWeight:     600,
  color:          "var(--color-text-primary)",
};

const ITEM_META: CSSProperties = {
  fontSize:       "12px",
  color:          "var(--color-text-muted)",
  display:        "flex",
  gap:            "10px",
  flexWrap:       "wrap",
};

const EMPTY: CSSProperties = {
  padding:        "30px 20px",
  textAlign:      "center",
  fontSize:       "12px",
  color:          "var(--color-text-muted)",
  border:         "1px dashed var(--color-border)",
  borderRadius:   "var(--radius-md)",
};

const PRIMARY_PILL: CSSProperties = {
  ...BADGE_BASE,
  background:     "rgba(34, 197, 94, 0.15)",
  color:          "var(--color-success-text, #22c55e)",
  fontSize:       "9px",
  padding:        "2px 7px",
};

const TAB_LABELS: Record<WorkspaceTab, { label: string; emoji: string }> = {
  summary:    { label: "Resumen",     emoji: "📊" },
  contacts:   { label: "Contactos",   emoji: "👥" },
  addresses:  { label: "Direcciones", emoji: "📍" },
  activity:   { label: "Actividad",   emoji: "⏱" },
  documents:  { label: "Documentos",  emoji: "📄" },
};

export default function PartnerWorkspace({
  partner,
  companyId,
  onEditPartner,
  onToggleActive,
}: PartnerWorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>("summary");
  const [contacts,  setContacts]  = useState<PartnerContact[]>([]);
  const [addresses, setAddresses] = useState<PartnerAddress[]>([]);
  const [documents, setDocuments] = useState<PartnerDocument[]>([]);
  const [loadingContacts,  setLoadingContacts]  = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [errorByTab, setErrorByTab] = useState<Partial<Record<WorkspaceTab, string>>>({});
  const [toggling, setToggling] = useState(false);

  // Cuando cambia el partner, reset todo
  useEffect(() => {
    setContacts([]);
    setAddresses([]);
    setDocuments([]);
    setErrorByTab({});
    setTab("summary");
  }, [partner.id]);

  // Lazy load por tab
  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;

    if (tab === "contacts" && contacts.length === 0 && !loadingContacts) {
      setLoadingContacts(true);
      supabase
        .from("client_contacts")
        .select("id, name, role, title, email, phone, is_primary, notes")
        .eq("company_id", companyId)
        .eq("client_id", partner.id)
        .order("is_primary", { ascending: false })
        .order("name")
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) {
            setErrorByTab((e) => ({ ...e, contacts: error.message }));
          } else {
            setContacts((data ?? []) as PartnerContact[]);
          }
          setLoadingContacts(false);
        });
    }

    if (tab === "addresses" && addresses.length === 0 && !loadingAddresses) {
      setLoadingAddresses(true);
      supabase
        .from("client_addresses")
        .select("id, type, alias, street, ext_number, int_number, neighborhood, city, state, zip_code, country, is_default")
        .eq("company_id", companyId)
        .eq("client_id", partner.id)
        .order("is_default", { ascending: false })
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) {
            setErrorByTab((e) => ({ ...e, addresses: error.message }));
          } else {
            setAddresses((data ?? []) as PartnerAddress[]);
          }
          setLoadingAddresses(false);
        });
    }

    if (tab === "documents" && documents.length === 0 && !loadingDocuments) {
      setLoadingDocuments(true);
      supabase
        .from("partner_documents")
        .select("id, document_type, file_name, file_url, expiration_date, uploaded_at")
        .eq("company_id", companyId)
        .eq("partner_id", partner.id)
        .order("uploaded_at", { ascending: false })
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) {
            setErrorByTab((e) => ({ ...e, documents: error.message }));
          } else {
            setDocuments((data ?? []) as PartnerDocument[]);
          }
          setLoadingDocuments(false);
        });
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, partner.id, companyId]);

  const summaryStats = useMemo(
    () => [
      { label: "Contactos",  value: contacts.length },
      { label: "Direcciones", value: addresses.length },
      { label: "Documentos", value: documents.length },
      { label: "Roles",      value: partner.role_count },
    ],
    [contacts.length, addresses.length, documents.length, partner.role_count],
  );

  const handleToggleActive = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      await onToggleActive(partner.id, !partner.is_active);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div style={WORKSPACE}>
      <div style={HEADER}>
        <div style={HEADER_TOP}>
          <div style={TITLE_BLOCK}>
            <h2 style={TITLE}>{partner.name}</h2>
            {partner.legal_name && partner.legal_name !== partner.name && (
              <div style={SUBTITLE}>{partner.legal_name}</div>
            )}
            <div style={META_ROW}>
              <span style={BADGE_ROLE}>{rolesText(partner)}</span>
              {partner.is_active ? (
                <span style={BADGE_ACTIVE}>● Activo</span>
              ) : (
                <span style={BADGE_INACTIVE}>○ Inactivo</span>
              )}
              {partner.rfc && <span style={RFC_TAG}>RFC: {partner.rfc}</span>}
              {typeof partner.rating === "number" && partner.rating > 0 && (
                <span
                  style={{
                    ...BADGE_BASE,
                    background: "rgba(245, 158, 11, 0.1)",
                    color: "var(--color-warning-text, #f59e0b)",
                  }}
                >
                  ⭐ {partner.rating.toFixed(1)}
                </span>
              )}
              {partner.validation_69b_status === "alleged" && (
                <span
                  style={{
                    ...BADGE_BASE,
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "var(--color-danger-text)",
                  }}
                  title="Aparece en lista 69-B (presunto)"
                >
                  ⚠ 69-B presunto
                </span>
              )}
              {partner.validation_69b_status === "clean" && (
                <span
                  style={{
                    ...BADGE_BASE,
                    background: "rgba(34, 197, 94, 0.1)",
                    color: "var(--color-success-text)",
                  }}
                >
                  ✓ 69-B limpio
                </span>
              )}
            </div>
          </div>

          <div style={ACTIONS}>
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={toggling}
              style={{
                ...BTN_SECONDARY,
                opacity: toggling ? 0.5 : 1,
                cursor: toggling ? "wait" : "pointer",
              }}
            >
              {toggling ? "..." : partner.is_active ? "🔻 Desactivar" : "🔺 Activar"}
            </button>
            <button type="button" onClick={() => onEditPartner(partner.id)} style={BTN_PRIMARY}>
              ✎ Editar
            </button>
          </div>
        </div>
      </div>

      <div style={TABS}>
        {(Object.keys(TAB_LABELS) as WorkspaceTab[]).map((t) => {
          const cfg = TAB_LABELS[t];
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={active ? TAB_ACTIVE : TAB}
            >
              <span style={{ marginRight: "5px" }}>{cfg.emoji}</span>
              {cfg.label}
            </button>
          );
        })}
      </div>

      <div style={CONTENT}>
        {tab === "summary" && (
          <>
            <div style={SECTION_TITLE}>Resumen del partner</div>
            <div style={KPI_GRID}>
              {summaryStats.map((s) => (
                <div key={s.label} style={KPI_CARD}>
                  <div style={KPI_LABEL}>{s.label}</div>
                  <div style={KPI_VALUE}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={SECTION_TITLE}>Información de contacto</div>
            <div style={KPI_GRID}>
              <div style={KPI_CARD}>
                <div style={KPI_LABEL}>Email</div>
                <div style={{ ...KPI_VALUE, fontSize: "13px" }}>
                  {partner.email ?? "—"}
                </div>
              </div>
              <div style={KPI_CARD}>
                <div style={KPI_LABEL}>Teléfono</div>
                <div style={{ ...KPI_VALUE, fontSize: "13px" }}>
                  {partner.phone ?? "—"}
                </div>
              </div>
              <div style={KPI_CARD}>
                <div style={KPI_LABEL}>Industria</div>
                <div style={{ ...KPI_VALUE, fontSize: "13px" }}>
                  {partner.industry ?? "—"}
                </div>
              </div>
              <div style={KPI_CARD}>
                <div style={KPI_LABEL}>País</div>
                <div style={{ ...KPI_VALUE, fontSize: "13px" }}>
                  {partner.country ?? "—"}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop:    "20px",
                padding:      "16px",
                background:   "rgba(59, 130, 246, 0.05)",
                border:       "1px dashed rgba(59, 130, 246, 0.3)",
                borderRadius: "var(--radius-md)",
                fontSize:     "12px",
                color:        "var(--color-text-muted)",
                lineHeight:   1.6,
              }}
            >
              💡 <strong>Customer 360 completo</strong> con KPIs financieros
              (saldos, facturación YTD, ticket promedio), operaciones recientes
              (cotizaciones, pedidos, embarques, CFDIs) y vencidos disponible
              dentro del PartnerDrawer al hacer click en <strong>✎ Editar</strong> →
              tab <strong>📊 Resumen</strong>.
            </div>
          </>
        )}

        {tab === "contacts" && (
          <>
            <div style={SECTION_TITLE}>Contactos del partner</div>
            {loadingContacts ? (
              <div style={EMPTY}>⏳ Cargando contactos...</div>
            ) : errorByTab.contacts ? (
              <div style={{ ...EMPTY, color: "var(--color-danger-text)" }}>
                ⚠️ {errorByTab.contacts}
              </div>
            ) : contacts.length === 0 ? (
              <div style={EMPTY}>
                Sin contactos registrados.
                <br />
                <span style={{ fontSize: "11px", opacity: 0.7 }}>
                  Edita el partner para agregar contactos.
                </span>
              </div>
            ) : (
              contacts.map((c) => (
                <div key={c.id} style={ITEM_CARD}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={ITEM_NAME}>
                      {c.name}
                      {c.title && (
                        <span style={{ fontWeight: 400, color: "var(--color-text-muted)", marginLeft: "8px", fontSize: "12px" }}>
                          — {c.title}
                        </span>
                      )}
                    </div>
                    {c.is_primary && <span style={PRIMARY_PILL}>★ Principal</span>}
                  </div>
                  <div style={ITEM_META}>
                    {c.role && <span>👤 {c.role}</span>}
                    {c.email && <span>✉ {c.email}</span>}
                    {c.phone && <span>☎ {c.phone}</span>}
                  </div>
                  {c.notes && (
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontStyle: "italic", marginTop: "4px" }}>
                      {c.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {tab === "addresses" && (
          <>
            <div style={SECTION_TITLE}>Direcciones del partner</div>
            {loadingAddresses ? (
              <div style={EMPTY}>⏳ Cargando direcciones...</div>
            ) : errorByTab.addresses ? (
              <div style={{ ...EMPTY, color: "var(--color-danger-text)" }}>
                ⚠️ {errorByTab.addresses}
              </div>
            ) : addresses.length === 0 ? (
              <div style={EMPTY}>
                Sin direcciones registradas.
                <br />
                <span style={{ fontSize: "11px", opacity: 0.7 }}>
                  Edita el partner para agregar direcciones.
                </span>
              </div>
            ) : (
              addresses.map((a) => (
                <div key={a.id} style={ITEM_CARD}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={ITEM_NAME}>
                      {a.alias || a.type || "Dirección"}
                      {a.type && a.alias && (
                        <span style={{ fontWeight: 400, color: "var(--color-text-muted)", marginLeft: "8px", fontSize: "12px" }}>
                          — {a.type}
                        </span>
                      )}
                    </div>
                    {a.is_default && <span style={PRIMARY_PILL}>★ Predeterminada</span>}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-primary)", lineHeight: 1.5 }}>
                    {[
                      [a.street, a.ext_number].filter(Boolean).join(" "),
                      a.int_number ? `Int. ${a.int_number}` : null,
                      a.neighborhood,
                      [a.zip_code, a.city].filter(Boolean).join(" "),
                      [a.state, a.country].filter(Boolean).join(", "),
                    ]
                      .filter(Boolean)
                      .join(" · ") || <span style={{ color: "var(--color-text-muted)" }}>Sin detalles</span>}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {tab === "activity" && companyId && (
          <>
            <div style={SECTION_TITLE}>Timeline de actividad (50 más recientes)</div>
            <PartnerActivityPanel partnerId={partner.id} companyId={companyId} />
          </>
        )}

        {tab === "documents" && (
          <>
            <div style={SECTION_TITLE}>Documentos del partner</div>
            {loadingDocuments ? (
              <div style={EMPTY}>⏳ Cargando documentos...</div>
            ) : errorByTab.documents ? (
              <div style={{ ...EMPTY, color: "var(--color-danger-text)" }}>
                ⚠️ {errorByTab.documents}
              </div>
            ) : documents.length === 0 ? (
              <div style={EMPTY}>
                Sin documentos registrados.
                <br />
                <span style={{ fontSize: "11px", opacity: 0.7 }}>
                  Edita el partner para subir documentos legales y comerciales.
                </span>
              </div>
            ) : (
              documents.map((d) => {
                const expired =
                  d.expiration_date &&
                  new Date(d.expiration_date).getTime() < Date.now();
                return (
                  <div key={d.id} style={ITEM_CARD}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={ITEM_NAME}>
                        📄 {d.file_name}
                      </div>
                      {expired && (
                        <span
                          style={{
                            ...BADGE_BASE,
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "var(--color-danger-text)",
                            fontSize: "9px",
                          }}
                        >
                          ⚠ Vencido
                        </span>
                      )}
                    </div>
                    <div style={ITEM_META}>
                      {d.document_type && <span>🏷 {d.document_type}</span>}
                      {d.uploaded_at && (
                        <span>
                          ⬆ Subido: {new Date(d.uploaded_at).toLocaleDateString("es-MX")}
                        </span>
                      )}
                      {d.expiration_date && (
                        <span style={expired ? { color: "var(--color-danger-text)" } : undefined}>
                          ⏳ Vence: {new Date(d.expiration_date).toLocaleDateString("es-MX")}
                        </span>
                      )}
                    </div>
                    {d.file_url && (
                      <a
                        href={d.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize:       "11px",
                          color:          "var(--color-brand-blue, #3b82f6)",
                          textDecoration: "none",
                          marginTop:      "4px",
                        }}
                      >
                        Abrir documento →
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}