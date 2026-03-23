"use client";

// ============================================================
// 🧾 PROSPECT CREATE DRAWER — ELITE
// Unicorn Revenue OS Grade
// Panel lateral para creación avanzada
// ============================================================

import { useState } from "react";
import type { Prospect } from "../types/prospects.types";

type Props = {
  open: boolean;
  onClose: () => void;

  createProspect: (payload: {
    name?: string;
    company_name?: string;
    email?: string;
    phone?: string;
    notes?: string;
    estimated_value?: number;
  }) => Promise<Prospect>;

  onCreated?: (p: Prospect) => void;
};

export default function ProspectCreateDrawer({
  open,
  onClose,
  createProspect,
  onCreated,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    estimated_value: "",
    notes: "",
  });

  function setField(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate() {
    if (!form.name && !form.company_name) {
      alert("Ingresa nombre o empresa");
      return;
    }

    setLoading(true);

    try {
      const prospect = await createProspect({
        ...form,
        estimated_value: form.estimated_value
          ? Number(form.estimated_value)
          : undefined,
      });

      onCreated?.(prospect);

      setForm({
        name: "",
        company_name: "",
        email: "",
        phone: "",
        estimated_value: "",
        notes: "",
      });

      onClose();
    } catch (err) {
      alert("No se pudo crear el prospecto");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* BACKDROP */}
      <div style={backdrop} onClick={onClose} />

      {/* DRAWER */}
      <div style={drawer}>
        {/* HEADER */}
        <div style={header}>
          <div style={title}>Nuevo Prospecto</div>

          <button style={closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* FORM */}
        <div style={formGrid}>
          <Field label="Nombre">
            <input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
            />
          </Field>

          <Field label="Empresa">
            <input
              value={form.company_name}
              onChange={(e) =>
                setField("company_name", e.target.value)
              }
            />
          </Field>

          <Field label="Email">
            <input
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
          </Field>

          <Field label="Teléfono">
            <input
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </Field>

          <Field label="Valor estimado">
            <input
              type="number"
              value={form.estimated_value}
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
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
          />
        </Field>

        {/* ACTIONS */}
        <div style={actions}>
          <button
            style={primaryButton}
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear prospecto"}
          </button>

          <button style={secondaryButton} onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================================
// COMPONENTES
// ============================================================

function Field({ label, children }: any) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const backdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  zIndex: 40,
};

const drawer: React.CSSProperties = {
  position: "fixed",
  right: 0,
  top: 0,
  bottom: 0,
  width: 420,
  background: "#020617",
  borderLeft: "1px solid #1f2937",
  padding: 20,
  zIndex: 50,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const title: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 18,
};

const closeBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#94a3b8",
  cursor: "pointer",
  fontSize: 18,
};

const formGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 12,
};

const actions: React.CSSProperties = {
  marginTop: "auto",
  display: "flex",
  gap: 10,
};

const primaryButton: React.CSSProperties = {
  flex: 1,
  background: "#3b82f6",
  border: "none",
  color: "#fff",
  padding: "12px",
  borderRadius: 10,
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  background: "#1f2937",
  border: "none",
  color: "#fff",
  padding: "12px",
  borderRadius: 10,
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
};
