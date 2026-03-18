"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Prospect = {
  id: string;
  company_id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  lead_source: string | null;
  interested_service: string | null;
  status: string | null;
  notes: string | null;
  estimated_value: number | null;
  next_follow_up: string | null;
  created_at: string;
  is_active?: boolean | null;
};

type ProspectForm = {
  name: string;
  company_name: string;
  email: string;
  phone: string;
  lead_source: string;
  interested_service: string;
  status: string;
  notes: string;
  estimated_value: number;
  next_follow_up: string;
};

const statusOptions = [
  "Nuevo",
  "Contactado",
  "Calificado",
  "Seguimiento",
  "Convertible",
  "Ganado",
  "Perdido",
];

export default function ProspectosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [message, setMessage] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);

  const [form, setForm] = useState<ProspectForm>({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    lead_source: "",
    interested_service: "",
    status: "Nuevo",
    notes: "",
    estimated_value: 0,
    next_follow_up: "",
  });

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    setLoading(true);

    const { data } = await supabase
      .from("company_users")
      .select("company_id")
      .limit(1)
      .single();

    if (!data?.company_id) {
      setLoading(false);
      setMessage("No se encontró company_id activo.");
      return;
    }

    setCompanyId(data.company_id);
    await loadProspects(data.company_id);
    setLoading(false);
  }

  async function loadProspects(activeCompanyId?: string) {
    const cid = activeCompanyId || companyId;
    if (!cid) return;

    const { data, error } = await supabase
      .from("prospects")
      .select("*")
      .eq("company_id", cid)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Error cargando prospectos: ${error.message}`);
      return;
    }

    setProspects(data || []);
  }

  async function loadActivities(prospectId: string) {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("prospect_id", prospectId)
    .order("created_at", { ascending: false });

  if (!error) {
    setActivities(data || []);
  }
}
  
  async function createProspect() {
    if (!companyId) return;
    if (!form.name.trim()) {
      setMessage("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload = {
      company_id: companyId,
      name: form.name.trim(),
      company_name: form.company_name.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      lead_source: form.lead_source.trim() || null,
      interested_service: form.interested_service.trim() || null,
      status: form.status,
      notes: form.notes.trim() || null,
      estimated_value: form.estimated_value || 0,
      next_follow_up: form.next_follow_up || null,
      is_active: !["Ganado", "Perdido"].includes(form.status),
    };

    const { error } = await supabase.from("prospects").insert(payload);

    if (error) {
      setMessage(`Error creando prospecto: ${error.message}`);
      setSaving(false);
      return;
    }

    setForm({
      name: "",
      company_name: "",
      email: "",
      phone: "",
      lead_source: "",
      interested_service: "",
      status: "Nuevo",
      notes: "",
      estimated_value: 0,
      next_follow_up: "",
    });

    setMessage("Prospecto creado correctamente.");
    await loadProspects();
    setSaving(false);
  }

  async function updateProspectStatus(prospectId: string, newStatus: string) {
    const { error } = await supabase
      .from("prospects")
      .update({
        status: newStatus,
        is_active: !["Ganado", "Perdido"].includes(newStatus),
      })
      .eq("id", prospectId);

    if (error) {
      setMessage(`Error actualizando estatus: ${error.message}`);
      return;
    }

    await loadProspects();
  }

  async function convertToOpportunity(prospect: Prospect) {
    if (!companyId) return;

    const probabilityMap: Record<string, number> = {
      Nuevo: 10,
      Contactado: 20,
      Calificado: 35,
      Seguimiento: 45,
      Convertible: 60,
      Ganado: 100,
      Perdido: 0,
    };

    const { error } = await supabase.from("sales_opportunities").insert({
      company_id: companyId,
      name: prospect.company_name || prospect.name,
      prospect_id: prospect.id,
      stage: "qualification",
      status: "open",
      estimated_value: prospect.estimated_value || 0,
      probability: probabilityMap[prospect.status || "Nuevo"] || 10,
      expected_close_date: null,
      assigned_to: null,
    });

    if (error) {
      setMessage(`Error convirtiendo a opportunity: ${error.message}`);
      return;
    }

    await supabase
      .from("prospects")
      .update({
        status: "Ganado",
        is_active: false,
      })
      .eq("id", prospect.id);

    setMessage("Prospecto convertido a opportunity.");
    await loadProspects();
  }

  function getProspectScore(p: Prospect) {
    let score = 0;

    score += Math.min((p.estimated_value || 0) / 1000, 40);

    const stageWeights: Record<string, number> = {
      Nuevo: 5,
      Contactado: 12,
      Calificado: 20,
      Seguimiento: 28,
      Convertible: 35,
      Ganado: 50,
      Perdido: 0,
    };

    score += stageWeights[p.status || "Nuevo"] || 0;

    if (p.email) score += 5;
    if (p.phone) score += 5;
    if (p.next_follow_up) score += 5;

    return Math.round(score);
  }

  const filtered = useMemo(() => {
    return prospects.filter((p) => {
      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.company_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.interested_service?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "Todos" || (p.status || "Nuevo") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [prospects, search, statusFilter]);

  const pipelineTotal = useMemo(
    () => filtered.reduce((sum, p) => sum + (p.estimated_value || 0), 0),
    [filtered]
  );

  const activeCount = useMemo(
    () => filtered.filter((p) => !["Ganado", "Perdido"].includes(p.status || "")).length,
    [filtered]
  );

  const convertibleCount = useMemo(
    () => filtered.filter((p) => ["Calificado", "Seguimiento", "Convertible"].includes(p.status || "")).length,
    [filtered]
  );

  const averageScore = useMemo(() => {
    if (!filtered.length) return 0;
    return Math.round(
      filtered.reduce((sum, p) => sum + getProspectScore(p), 0) / filtered.length
    );
  }, [filtered]);

  if (loading) {
    return <div style={loadingStyle}>Cargando módulo comercial…</div>;
  }

  return (
    <div style={pageWrap}>
      <div style={hero}>
        <div>
          <div style={eyebrow}>REVENUE OS</div>
          <h1 style={title}>Prospectos inteligentes</h1>
          <div style={subtitle}>
            Captura, calificación y preparación para convertir en oportunidades reales.
          </div>
        </div>

        <div style={heroActions}>
          <div style={heroKpi}>
            <div style={heroKpiLabel}>Pipeline estimado</div>
            <div style={heroKpiValue}>${pipelineTotal.toLocaleString("es-MX")}</div>
          </div>
          <div style={heroKpi}>
            <div style={heroKpiLabel}>Convertibles</div>
            <div style={heroKpiValue}>{convertibleCount}</div>
          </div>
        </div>
      </div>

      {message && <div style={messageStyle}>{message}</div>}

      <div style={topGrid}>
        <section style={panel}>
          <div style={panelTitle}>Nuevo prospecto</div>

          <div style={formGrid}>
            <input
              style={input}
              placeholder="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              style={input}
              placeholder="Empresa"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            />
            <input
              style={input}
              placeholder="Correo"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              style={input}
              placeholder="Teléfono"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              style={input}
              placeholder="Origen del lead"
              value={form.lead_source}
              onChange={(e) => setForm({ ...form, lead_source: e.target.value })}
            />
            <input
              style={input}
              placeholder="Servicio de interés"
              value={form.interested_service}
              onChange={(e) =>
                setForm({ ...form, interested_service: e.target.value })
              }
            />
            <input
              style={input}
              type="number"
              placeholder="Valor estimado"
              value={form.estimated_value || ""}
              onChange={(e) =>
                setForm({ ...form, estimated_value: Number(e.target.value) })
              }
            />
            <select
              style={input}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              style={input}
              type="date"
              value={form.next_follow_up}
              onChange={(e) =>
                setForm({ ...form, next_follow_up: e.target.value })
              }
            />
            <input
              style={input}
              placeholder="Notas"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <button style={primaryButton} onClick={createProspect} disabled={saving}>
            {saving ? "Guardando…" : "Guardar prospecto"}
          </button>
        </section>

        <section style={panel}>
          <div style={panelTitle}>Inteligencia comercial</div>

          <div style={kpiGrid}>
            <KpiCard label="Prospectos activos" value={String(activeCount)} />
            <KpiCard label="Convertibles" value={String(convertibleCount)} />
            <KpiCard label="Score promedio" value={String(averageScore)} />
            <KpiCard
              label="Valor pipeline"
              value={`$${pipelineTotal.toLocaleString("es-MX")}`}
            />
          </div>

          <div style={aiBox}>
            <div style={aiTitle}>Prospect AI Director</div>
            <div style={aiText}>
              {convertibleCount > 0
                ? `Hay ${convertibleCount} prospecto(s) listos para empujarse a opportunity. Prioriza los de mayor score y valor estimado.`
                : "No hay prospectos suficientemente maduros todavía. Conviene nutrir y dar seguimiento."}
            </div>
          </div>
        </section>
      </div>

      <section style={panel}>
        <div style={toolbar}>
          <div style={panelTitle}>Base comercial</div>

          <div style={toolbarControls}>
            <input
              style={inputCompact}
              placeholder="Buscar prospecto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              style={inputCompact}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Todos">Todos</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Prospecto</th>
                <th style={th}>Empresa</th>
                <th style={th}>Servicio</th>
                <th style={th}>Valor</th>
                <th style={th}>Score</th>
                <th style={th}>Estatus</th>
                <th style={th}>Siguiente paso</th>
                <th style={th}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  style={row}
                  onClick={() => {
  setSelected(p);
  loadActivities(p.id);
}}
                >
                  <td style={td}>{p.name || "-"}</td>
                  <td style={td}>{p.company_name || "-"}</td>
                  <td style={td}>{p.interested_service || "-"}</td>
                  <td style={td}>
                    ${(p.estimated_value || 0).toLocaleString("es-MX")}
                  </td>
                  <td style={td}>{getProspectScore(p)}</td>
                  <td style={td}>
                    <select
                      style={statusSelect}
                      value={p.status || "Nuevo"}
                      onChange={(e) => updateProspectStatus(p.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={td}>
                    {p.next_follow_up
                      ? new Date(p.next_follow_up).toLocaleDateString("es-MX")
                      : "-"}
                  </td>
                  <td style={td}>
                    <button
                      style={secondaryButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        void convertToOpportunity(p);
                      }}
                    >
                      Convertir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
  <section style={panel}>
    <div style={panelTitle}>Detalle del prospecto</div>

    {/* ===== DATOS PRINCIPALES ===== */}
    <div style={detailGrid}>
      <Detail label="Nombre" value={selected.name} />
      <Detail label="Empresa" value={selected.company_name || "-"} />
      <Detail label="Correo" value={selected.email || "-"} />
      <Detail label="Teléfono" value={selected.phone || "-"} />
      <Detail label="Origen" value={selected.lead_source || "-"} />
      <Detail
        label="Servicio de interés"
        value={selected.interested_service || "-"}
      />
      <Detail
        label="Valor estimado"
        value={`$${(selected.estimated_value || 0).toLocaleString("es-MX")}`}
      />
      <Detail
        label="Score IA"
        value={String(getProspectScore(selected))}
      />
      <Detail label="Notas" value={selected.notes || "-"} />
    </div>

    {/* ===== ACCIONES RÁPIDAS ===== */}
    <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
      <button
        onClick={() => convertToOpportunity(selected)}
        style={{
          background: "#16a34a",
          border: "none",
          color: "#fff",
          padding: "10px 14px",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Convertir a oportunidad
      </button>

      <button
        onClick={() => setSelected(null)}
        style={{
          background: "#374151",
          border: "none",
          color: "#fff",
          padding: "10px 14px",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Cerrar
      </button>
    </div>

    {/* ===== TIMELINE DE ACTIVIDAD ===== */}
    <div style={{ marginTop: 26 }}>
      <div style={{ fontWeight: 800, marginBottom: 12 }}>
        Actividad del prospecto
      </div>

      <button
        onClick={async () => {
          const title = prompt("Describe la actividad");
          if (!title) return;

          await supabase.from("activities").insert({
            prospect_id: selected.id,
            company_id: selected.company_id,
            type: "note",
            title,
          });

          loadActivities(selected.id);
        }}
        style={{
          marginBottom: 14,
          background: "#2f5aa6",
          border: "none",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        + Agregar actividad
      </button>

      {activities.length === 0 ? (
        <p>No hay actividades registradas.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {activities.map((a) => (
            <div
              key={a.id}
              style={{
                background: "#162a52",
                padding: 12,
                borderRadius: 10,
                border: "1px solid #284577",
              }}
            >
              <div style={{ fontWeight: 700 }}>
                {a.type} — {a.title}
              </div>

              <div
                style={{
                  fontSize: 12,
                  opacity: 0.7,
                  marginTop: 4,
                }}
              >
                {new Date(a.created_at).toLocaleString("es-MX")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </section>
)}

      </div>
);
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={kpiCard}>
      <div style={kpiLabel}>{label}</div>
      <div style={kpiValue}>{value}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={detailCard}>
      <div style={detailLabel}>{label}</div>
      <div style={detailValue}>{value}</div>
    </div>
  );
}

const loadingStyle: React.CSSProperties = {
  padding: 24,
};

const pageWrap: React.CSSProperties = {
  display: "grid",
  gap: 20,
};

const hero: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const eyebrow: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.12em",
  color: "#6b7280",
  fontWeight: 800,
  textTransform: "uppercase",
};

const title: React.CSSProperties = {
  margin: "6px 0 8px",
  fontSize: 38,
  lineHeight: 1,
  fontWeight: 900,
  color: "#f8fafc",
};

const subtitle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 15,
};

const heroActions: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const heroKpi: React.CSSProperties = {
  minWidth: 180,
  background: "#0b1220",
  border: "1px solid #1f2937",
  borderRadius: 14,
  padding: 14,
};

const heroKpiLabel: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
};

const heroKpiValue: React.CSSProperties = {
  marginTop: 6,
  fontSize: 28,
  fontWeight: 900,
  color: "#f8fafc",
};

const messageStyle: React.CSSProperties = {
  background: "rgba(96,165,250,0.10)",
  border: "1px solid rgba(96,165,250,0.25)",
  color: "#dbeafe",
  borderRadius: 12,
  padding: 14,
};

const topGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.3fr 1fr",
  gap: 20,
};

const panel: React.CSSProperties = {
  background: "#0b0f14",
  border: "1px solid #1f2937",
  borderRadius: 18,
  padding: 18,
  display: "grid",
  gap: 16,
};

const panelTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: "#f8fafc",
};

const formGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const input: React.CSSProperties = {
  height: 44,
  borderRadius: 10,
  border: "1px solid #263140",
  background: "#0f141b",
  color: "#f8fafc",
  padding: "0 12px",
  outline: "none",
};

const inputCompact: React.CSSProperties = {
  height: 40,
  borderRadius: 10,
  border: "1px solid #263140",
  background: "#0f141b",
  color: "#f8fafc",
  padding: "0 12px",
  outline: "none",
};

const primaryButton: React.CSSProperties = {
  height: 44,
  borderRadius: 10,
  border: "1px solid #7aa2ff",
  background: "#7aa2ff",
  color: "#0a0d12",
  padding: "0 16px",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  height: 34,
  borderRadius: 8,
  border: "1px solid #263140",
  background: "#111827",
  color: "#f8fafc",
  padding: "0 12px",
  fontWeight: 700,
  cursor: "pointer",
};

const kpiGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const kpiCard: React.CSSProperties = {
  background: "#0f141b",
  border: "1px solid #1f2937",
  borderRadius: 14,
  padding: 14,
};

const kpiLabel: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
};

const kpiValue: React.CSSProperties = {
  marginTop: 6,
  fontSize: 28,
  fontWeight: 900,
  color: "#f8fafc",
};

const aiBox: React.CSSProperties = {
  background: "rgba(96,165,250,0.10)",
  border: "1px solid rgba(96,165,250,0.25)",
  borderRadius: 14,
  padding: 16,
  display: "grid",
  gap: 8,
};

const aiTitle: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.12em",
  color: "#60a5fa",
  fontWeight: 800,
  textTransform: "uppercase",
};

const aiText: React.CSSProperties = {
  color: "#dbeafe",
  lineHeight: 1.6,
};

const toolbar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

const toolbarControls: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const th: React.CSSProperties = {
  textAlign: "left",
  fontSize: 12,
  color: "#94a3b8",
  fontWeight: 800,
  padding: "12px 10px",
  borderBottom: "1px solid #1f2937",
};

const td: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "1px solid #17202b",
  color: "#e5e7eb",
  fontSize: 14,
};

const row: React.CSSProperties = {
  cursor: "pointer",
};

const statusSelect: React.CSSProperties = {
  height: 34,
  borderRadius: 8,
  border: "1px solid #263140",
  background: "#111827",
  color: "#f8fafc",
  padding: "0 8px",
};

const detailGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
};

const detailCard: React.CSSProperties = {
  background: "#0f141b",
  border: "1px solid #1f2937",
  borderRadius: 12,
  padding: 14,
};

const detailLabel: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
};

const detailValue: React.CSSProperties = {
  marginTop: 6,
  color: "#f8fafc",
  fontWeight: 700,
};
