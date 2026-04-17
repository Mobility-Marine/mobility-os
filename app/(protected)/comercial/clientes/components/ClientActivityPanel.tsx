"use client";
import { useRouter } from "next/navigation";
import type { Client, ClientContact, ClientDocument } from "../types/clients.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  client:    Client | null;
  contacts:  ClientContact[];
  documents: ClientDocument[];
  loading?:  boolean;
};

export default function ClientActivityPanel({ client, contacts, documents, loading }: Props) {
  const router    = useRouter();
  const { t, lang } = useTranslation();
  const locale    = lang === "en" ? "en-US" : "es-MX";

  if (!client) return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "24px",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: "8px", height: "100%",
    }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 600 }}>
        Selecciona un cliente
      </div>
    </div>
  );

  const primaryContact  = contacts.find((c) => c.is_primary) ?? contacts[0];
  const recentDocuments = documents.slice(0, 4);
  const keyContacts     = contacts.slice(0, 4);

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "18px",
      display: "flex", flexDirection: "column", gap: "14px",
      height: "100%", minHeight: 0,
    }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-blue)" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {client.name}
          </span>
        </div>
        <button
          onClick={() => router.push("/comercial/crm")}
          style={{
            height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)",
            background: "var(--color-brand-blue-light)", border: "1px solid var(--color-brand-blue)30",
            color: "var(--color-brand-blue)", fontSize: "11px", fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
          }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
          Ver en CRM →
        </button>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", minHeight: 0 }}>
        {/* CONTACTOS CLAVE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Contactos clave ({contacts.length})
          </div>
          {loading ? (
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Cargando…</div>
          ) : keyContacts.length === 0 ? (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "6px",
              border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)",
              padding: "14px", textAlign: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                Sin contactos registrados
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "6px" }}>
              {keyContacts.map((c) => {
                const initials = c.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
                return (
                  <div key={c.id} style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "8px 10px", borderRadius: "var(--radius-md)",
                    background: c.is_primary ? "var(--color-info-bg)" : "var(--color-bg-subtle)",
                    border: `1px solid ${c.is_primary ? "var(--color-info-border)" : "var(--color-border-faint)"}`,
                  }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                      background: "var(--color-brand-blue)20", border: "1px solid var(--color-brand-blue)30",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "10px", fontWeight: 800, color: "var(--color-brand-blue)",
                    }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.name}
                        {c.is_primary && <span style={{ marginLeft: "4px", fontSize: "9px", color: "var(--color-info-text)", fontWeight: 600 }}>★ Principal</span>}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.title ?? c.role?.replace(/_/g, " ") ?? "—"}
                      </div>
                      {c.email && (
                        <a href={`mailto:${c.email}`} style={{ fontSize: "10px", color: "var(--color-brand-blue)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                          {c.email}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DOCUMENTOS RECIENTES */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Documentos recientes ({documents.length})
          </div>
          {loading ? (
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Cargando…</div>
          ) : recentDocuments.length === 0 ? (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "6px",
              border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)",
              padding: "14px", textAlign: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                Sin documentos subidos
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "6px" }}>
              {recentDocuments.map((doc) => {
                const isExpired = doc.expires_at && new Date(doc.expires_at) < new Date();
                return (
                  <div key={doc.id} style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "8px 10px", borderRadius: "var(--radius-md)",
                    background: isExpired ? "var(--color-danger-bg)" : "var(--color-bg-subtle)",
                    border: `1px solid ${isExpired ? "var(--color-danger-border)" : "var(--color-border-faint)"}`,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isExpired ? "var(--color-danger-text)" : "var(--color-text-muted)"} strokeWidth="2" style={{ flexShrink: 0 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: "10px", color: isExpired ? "var(--color-danger-text)" : "var(--color-text-muted)" }}>
                        {doc.type.replace(/_/g, " ")}
                        {doc.expires_at && ` · ${isExpired ? "Venció" : "Vence"}: ${new Date(doc.expires_at).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })}`}
                      </div>
                    </div>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        style={{ flexShrink: 0, color: "var(--color-text-muted)", display: "flex", alignItems: "center" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* INFO FISCAL RÁPIDA */}
      {(client.rfc || client.tax_regime || client.payment_form) && (
        <div style={{
          flexShrink: 0, padding: "10px 14px", borderRadius: "var(--radius-md)",
          background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
          display: "flex", gap: "16px", flexWrap: "wrap",
        }}>
          {client.rfc && (
            <div>
              <div style={{ fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>RFC</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "monospace" }}>{client.rfc}</div>
            </div>
          )}
          {client.tax_regime && (
            <div>
              <div style={{ fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Régimen</div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-primary)" }}>{client.tax_regime}</div>
            </div>
          )}
          {client.payment_form && (
            <div>
              <div style={{ fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Pago</div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-primary)" }}>{client.payment_form}</div>
            </div>
          )}
          {client.credit_limit && client.credit_limit > 0 && (
            <div>
              <div style={{ fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Límite crédito</div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-success-text)" }}>${Number(client.credit_limit).toLocaleString(locale)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
