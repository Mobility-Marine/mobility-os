"use client";

// ============================================================
// 👤 PROSPECT WORKSPACE — Enterprise Final (Editable + Create)
// Compatible con Customer 360 + Auditoría + Conversión
// ============================================================

import type { Prospect } from "../types/prospects.types";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { convertProspectToCustomer } from "../services/prospect-conversion.service";
import { useEffect, useState } from "react";
import ProspectActivityTimeline from "./ProspectActivityTimeline";
import { shouldMoveToOpportunity } from "../services/prospects.normalization";

type Props = {
  prospect: Prospect | null;

  createProspect: (payload: any) => Promise<any>;
  updateProspect: (id: string, payload: any) => Promise<any>;
  archiveProspect: (id: string) => Promise<any>;
};

export default function ProspectWorkspace({
  prospect,
  createProspect,
  updateProspect,
  archiveProspect,
}: Props) {
  const { companyId } = useTenant();

  // ==========================================================
  // FORM STATE (CREATE + EDIT)
  // ==========================================================

  const [form, setForm] = useState<any>({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    estimated_value: "",
    notes: "",
  });

  useEffect(() => {
    if (prospect) {
      setForm(prospect);
    } else {
      setForm({
        name: "",
        company_name: "",
        email: "",
        phone: "",
        estimated_value: "",
        notes: "",
      });
    }
  }, [prospect]);

  function setField(key: string, value: any) {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  }

  // ==========================================================
  // SAVE (CREATE O UPDATE)
  // ==========================================================

  async function handleSave() {
    if (prospect?.id) {
      await updateProspect(prospect.id, form);
      alert("Prospecto actualizado");
    } else {
      await createProspect(form);
      alert("Prospecto creado");
    }
  }

  // ==========================================================
  // CONVERSIÓN A CLIENTE
  // ==========================================================

  async function handleConvert() {
    if (!companyId || !prospect) return;

    if (!confirm("¿Convertir este prospecto en cliente?")) return;

    try {
      await convertProspectToCustomer(companyId, prospect.id, {});
      alert("Prospecto convertido a cliente correctamente.");
    } catch (err: any) {
      alert(err.message || "Error al convertir prospecto.");
    }
  }

  // ==========================================================
  // EMPTY STATE — WORKSPACE INTELIGENTE
  // ==========================================================

  if (!prospect) {
    return (
      <div style={container}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>
          Centro de trabajo de prospectos
        </div>

        <div style={emptyHero}>
          <div style={heroTitle}>
            Selecciona un prospecto o crea uno nuevo
          </div>

          <div style={heroSubtitle}>
            Aquí podrás gestionar información, actividades,
            inteligencia comercial y conversión a cliente.
          </div>
        </div>
      </div>
    );
  }
  
  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div style={container}>
      {/* HEADER */}
      <div style={{ fontSize: 22, fontWeight: 800 }}>
        {prospect ? "DETALLE DEL PROSPECTO" : "NUEVO PROSPECTO"}
      </div>

      {/* FORM */}
      <div style={grid}>
        <Field label="Nombre">
          <input
            value={form.name || ""}
            onChange={(e) => setField("name", e.target.value)}
          />
        </Field>

        <Field label="Empresa">
          <input
            value={form.company_name || ""}
            onChange={(e) =>
              setField("company_name", e.target.value)
            }
          />
        </Field>

        <Field label="Email">
          <input
            value={form.email || ""}
            onChange={(e) =>
              setField("email", e.target.value)
            }
          />
        </Field>

        <Field label="Teléfono">
          <input
            value={form.phone || ""}
            onChange={(e) =>
              setField("phone", e.target.value)
            }
          />
        </Field>

        <Field label="Valor estimado">
          <input
            type="number"
            value={form.estimated_value || ""}
            onChange={(e) =>
              setField("estimated_value", e.target.value)
            }
          />
        </Field>
      </div>

      {/* NOTAS */}
      <Field label="Notas">
        <textarea
          rows={4}
          value={form.notes || ""}
          onChange={(e) =>
            setField("notes", e.target.value)
          }
        />
      </Field>
      
      {/* KPIs SOLO SI EXISTE */}
      {prospect && (
        <div style={kpiGrid}>
          <InfoCard
            label="Etapa"
            value={prospect.stage || prospect.status || "new"}
          />

          <InfoCard
            label="Origen"
            value={
              prospect.lead_source ||
              prospect.sourceNormalized ||
              "manual"
            }
          />

          <InfoCard
            label="Valor estimado"
            value={
              prospect.estimated_value
                ? `$${Number(
                    prospect.estimated_value
                  ).toLocaleString("es-MX")}`
                : "Sin estimación"
            }
          />
        </div>
      )}

{/* READY FOR OPPORTUNITY — REVENUE HANDOFF */}
{prospect && shouldMoveToOpportunity(prospect) && (
  <div style={handoffBox}>
    <div style={handoffTitle}>
      🚀 Listo para mover a Oportunidades
    </div>

    <div style={handoffText}>
      Este prospecto cumple criterios comerciales para iniciar
      gestión de ingresos (pipeline de ventas).
    </div>
  </div>
)}
      
{/* ACTIVIDAD — AUDITORÍA / CUSTOMER 360 */}
{prospect && (
  <ProspectActivityTimeline
    activities={prospect?.activities || []}
  />
)}
      
      {/* ACCIONES */}
      <div style={actions}>
        <button style={primaryButton} onClick={handleSave}>
          {prospect ? "Guardar cambios" : "Crear prospecto"}
        </button>

        {prospect && (
          <>
            <button
              style={secondaryButton}
              onClick={handleConvert}
            >
              Convertir a cliente
            </button>

            <button
              style={dangerButton}
              onClick={() =>
                archiveProspect(prospect.id)
              }
            >
              Marcar como perdido
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTES UI
// ============================================================

function Field({ label, children }: any) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <label style={{ fontSize: 12, color: "#94a3b8" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={infoCard}>
      <div style={{ fontSize: 12, color: "#94a3b8" }}>
        {label}
      </div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const container: React.CSSProperties = {
  background: "#020617",
  border: "1px solid #1f2937",
  borderRadius: 12,
  padding: 20,
  display: "grid",
  gap: 16,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0,1fr))",
  gap: 12,
};

const kpiGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0,1fr))",
  gap: 12,
};

const infoCard: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid #1f2937",
  borderRadius: 10,
  padding: 12,
};

const actions: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 6,
};

const primaryButton: React.CSSProperties = {
  background: "#3b82f6",
  border: "none",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButton: React.CSSProperties = {
  background: "#16a34a",
  border: "none",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 700,
};

const dangerButton: React.CSSProperties = {
  background: "#ef4444",
  border: "none",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 700,
};

const handoffBox: React.CSSProperties = {
  background: "rgba(16,185,129,0.10)",
  border: "1px solid rgba(16,185,129,0.35)",
  borderRadius: 12,
  padding: 14,
};

const handoffTitle: React.CSSProperties = {
  fontWeight: 800,
  color: "#34d399",
  marginBottom: 4,
};

const handoffText: React.CSSProperties = {
  fontSize: 13,
  color: "#d1fae5",
};

const emptyHero: React.CSSProperties = {
  background: "#0b1220",
  border: "1px dashed #334155",
  borderRadius: 12,
  padding: 40,
  textAlign: "center",
  color: "#94a3b8",
};

const heroTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  marginBottom: 8,
  color: "#e5e7eb",
};

const heroSubtitle: React.CSSProperties = {
  maxWidth: 420,
  margin: "0 auto",
};
