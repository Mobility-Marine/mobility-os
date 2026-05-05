// ════════════════════════════════════════════════════════════════════════
// TabEvaluation — Tab 8 del wizard PartnerDrawer (ERP-grade)
// ════════════════════════════════════════════════════════════════════════
// Evaluaciones multi-criterio del partner con histórico:
//   - Formulario nueva evaluación: 6 criterios StarRating 1-5
//   - Auto-cálculo overall_score y sugerencia de recomendación
//   - Comentarios estructurados: fortalezas, debilidades, acciones
//   - Lista histórica con tabla compacta
//   - KPIs agregados: promedio acumulado por criterio
//   - CRUD inmediato (no deferido al save del partner)
//
// REQUIERE partner.id existente. En modo CREATE muestra mensaje.
// ════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  PartnerEvaluation,
  EvaluationRecommendation,
  EVALUATION_CRITERIA,
  RECOMMENDATION_OPTIONS,
  listEvaluationsByPartner,
  createEvaluation,
  deleteEvaluation,
  computeOverallScore,
  computeEvaluationStats,
  suggestRecommendation,
} from "../services/partner-evaluations.service";
import { Field, FIELD_INPUT, FIELD_SELECT, FIELD_TEXTAREA, SectionTitle } from "../components/Field";

// ── Props ─────────────────────────────────────────────────────────────
export type TabEvaluationProps = {
  partnerId?:     string;
  companyId:      string;
  userId?:        string;
  evaluatorName?: string;
};

// ── Estilos ───────────────────────────────────────────────────────────
const PANEL: CSSProperties = {
  padding:       "16px",
  borderRadius:  "var(--radius-md)",
  border:        "1px solid var(--color-border)",
  background:    "var(--color-bg-subtle)",
  display:       "flex",
  flexDirection: "column",
  gap:           "12px",
};

const KPI_BAR: CSSProperties = {
  display:             "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap:                 "10px",
};

const KPI_CARD: CSSProperties = {
  padding:        "12px 14px",
  borderRadius:   "var(--radius-md)",
  border:         "1px solid var(--color-border)",
  background:     "var(--color-bg-elevated)",
  display:        "flex",
  flexDirection:  "column",
  gap:            "4px",
};

const KPI_LABEL: CSSProperties = {
  fontSize:       "10px",
  fontWeight:     600,
  letterSpacing:  "0.4px",
  textTransform:  "uppercase",
  color:          "var(--color-text-muted)",
};

const KPI_VALUE: CSSProperties = {
  fontSize:       "20px",
  fontWeight:     700,
  color:          "var(--color-text-primary)",
  lineHeight:     1.1,
};

const STAR_BUTTON: CSSProperties = {
  background:     "transparent",
  border:         "none",
  cursor:         "pointer",
  padding:        "2px",
  fontSize:       "20px",
  outline:        "none",
  transition:     "transform 0.1s",
};

const HISTORY_ROW: CSSProperties = {
  display:             "grid",
  gridTemplateColumns: "120px 1fr 80px 120px 100px 40px",
  alignItems:          "center",
  gap:                 "12px",
  padding:             "10px 14px",
  borderRadius:        "var(--radius-md)",
  border:              "1px solid var(--color-border)",
  background:          "var(--color-bg-subtle)",
  fontSize:            "12px",
};

const ICON_BUTTON: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  justifyContent: "center",
  width:          "28px",
  height:         "28px",
  borderRadius:   "var(--radius-sm, 4px)",
  border:         "1px solid var(--color-border)",
  background:     "transparent",
  color:          "var(--color-text-muted)",
  cursor:         "pointer",
  fontSize:       "13px",
  outline:        "none",
};

const PRIMARY_BUTTON: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  justifyContent: "center",
  height:         "32px",
  padding:        "0 16px",
  borderRadius:   "var(--radius-md)",
  fontSize:       "13px",
  fontWeight:     600,
  cursor:         "pointer",
  border:         "1px solid var(--color-brand-blue, #3b82f6)",
  background:     "var(--color-brand-blue, #3b82f6)",
  color:          "#fff",
  outline:        "none",
};

const SECONDARY_BUTTON: CSSProperties = {
  ...PRIMARY_BUTTON,
  background:  "transparent",
  color:       "var(--color-text-primary)",
  borderColor: "var(--color-border)",
};

const EMPTY_STATE: CSSProperties = {
  padding:       "32px 20px",
  textAlign:     "center",
  border:        "1px dashed var(--color-border)",
  borderRadius:  "var(--radius-md)",
  color:         "var(--color-text-muted)",
  fontSize:      "13px",
  lineHeight:    1.6,
};

const BADGE_BASE: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  gap:            "4px",
  padding:        "3px 8px",
  borderRadius:   "var(--radius-sm, 4px)",
  fontSize:       "10px",
  fontWeight:     700,
  letterSpacing:  "0.3px",
  textTransform:  "uppercase",
};

// ── Helpers ───────────────────────────────────────────────────────────
function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-MX", { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

function recommendationConfig(code: EvaluationRecommendation | null | undefined) {
  return RECOMMENDATION_OPTIONS.find((r) => r.code === code) ?? null;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function defaultPeriodLabel(): string {
  const d = new Date();
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
}

// ── StarRating ────────────────────────────────────────────────────────
function StarRating({
  value,
  onChange,
  size = 20,
}: {
  value:    number | null | undefined;
  onChange: (v: number | null) => void;
  size?:    number;
}) {
  const v = typeof value === "number" ? value : 0;
  return (
    <div style={{ display: "inline-flex", gap: "2px", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(v === n ? null : n)}
          style={{ ...STAR_BUTTON, fontSize: `${size}px` }}
          aria-label={`${n} estrellas`}
          title={`${n} de 5`}
        >
          {n <= v ? "⭐" : "☆"}
        </button>
      ))}
      <span
        style={{
          fontSize:    "11px",
          color:       "var(--color-text-muted)",
          marginLeft:  "6px",
          minWidth:    "30px",
        }}
      >
        {v > 0 ? `${v}/5` : "—"}
      </span>
    </div>
  );
}

// ── Componente ────────────────────────────────────────────────────────
export function TabEvaluation({
  partnerId,
  companyId,
  userId,
  evaluatorName,
}: TabEvaluationProps) {
  const [evaluations, setEvaluations] = useState<PartnerEvaluation[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [showForm,    setShowForm]    = useState(false);

  // ── Estado del formulario nueva evaluación ────────────────────────
  const [formDate,           setFormDate]           = useState(todayISO());
  const [formPeriod,         setFormPeriod]         = useState(defaultPeriodLabel());
  const [formQuality,        setFormQuality]        = useState<number | null>(null);
  const [formDelivery,       setFormDelivery]       = useState<number | null>(null);
  const [formPrice,          setFormPrice]          = useState<number | null>(null);
  const [formService,        setFormService]        = useState<number | null>(null);
  const [formCommunication,  setFormCommunication]  = useState<number | null>(null);
  const [formDocumentation,  setFormDocumentation]  = useState<number | null>(null);
  const [formRecommendation, setFormRecommendation] = useState<EvaluationRecommendation | null>(null);
  const [formComments,       setFormComments]       = useState("");
  const [formStrengths,      setFormStrengths]      = useState("");
  const [formWeaknesses,     setFormWeaknesses]     = useState("");
  const [formActions,        setFormActions]        = useState("");

  // ── Score actual del form (para preview) ──────────────────────────
  const liveOverall = computeOverallScore({
    quality_score:       formQuality,
    delivery_score:      formDelivery,
    price_score:         formPrice,
    service_score:       formService,
    communication_score: formCommunication,
    documentation_score: formDocumentation,
  });

  // ── Auto-sugerir recomendación cuando overall cambia ──────────────
  useEffect(() => {
    if (liveOverall === null || formRecommendation !== null) return;
    setFormRecommendation(suggestRecommendation(liveOverall));
  }, [liveOverall, formRecommendation]);

  // ── Cargar evaluaciones ───────────────────────────────────────────
  useEffect(() => {
    if (!partnerId || !companyId) return;
    let cancelled = false;
    setLoading(true);
    listEvaluationsByPartner(companyId, partnerId)
      .then((d) => { if (!cancelled) setEvaluations(d); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [partnerId, companyId]);

  // ── Stats agregadas ────────────────────────────────────────────────
  const stats = computeEvaluationStats(evaluations);

  // ── Reset form ────────────────────────────────────────────────────
  function resetForm() {
    setFormDate(todayISO());
    setFormPeriod(defaultPeriodLabel());
    setFormQuality(null);
    setFormDelivery(null);
    setFormPrice(null);
    setFormService(null);
    setFormCommunication(null);
    setFormDocumentation(null);
    setFormRecommendation(null);
    setFormComments("");
    setFormStrengths("");
    setFormWeaknesses("");
    setFormActions("");
  }

  // ── Handler: guardar nueva evaluación ─────────────────────────────
  async function handleSave() {
    if (!partnerId || !companyId) return;
    if (liveOverall === null) {
      setError("Debes calificar al menos un criterio.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await createEvaluation(
        companyId,
        partnerId,
        {
          evaluation_date:     formDate,
          period_label:        formPeriod || null,
          quality_score:       formQuality,
          delivery_score:      formDelivery,
          price_score:         formPrice,
          service_score:       formService,
          communication_score: formCommunication,
          documentation_score: formDocumentation,
          recommendation:      formRecommendation,
          comments:            formComments  || null,
          strengths:           formStrengths || null,
          weaknesses:          formWeaknesses || null,
          improvement_actions: formActions   || null,
        },
        userId,
        evaluatorName,
      );
      setEvaluations((prev) => [created, ...prev]);
      resetForm();
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  // ── Handler: eliminar ─────────────────────────────────────────────
  async function handleDelete(id: string) {
    const ok = window.confirm("¿Eliminar esta evaluación? Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      await deleteEvaluation(companyId, id);
      setEvaluations((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  // ── Modo CREATE: bloquear ─────────────────────────────────────────
  if (!partnerId) {
    return (
      <div style={{ padding: "20px" }}>
        <div style={EMPTY_STATE}>
          📊 <strong>Guarda primero el partner</strong>
          <br />
          Las evaluaciones se asocian al partner. Completa los tabs obligatorios,
          presiona <strong>Guardar</strong>, vuelve a abrir el partner en modo edición y
          registra evaluaciones aquí.
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <SectionTitle>Evaluación del partner</SectionTitle>

      <div style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.55 }}>
        Registra evaluaciones periódicas multi-criterio (calidad, puntualidad, precio, servicio,
        comunicación, documentación). El sistema calcula automáticamente el promedio global y
        sugiere una recomendación. El histórico se conserva para análisis de evolución.
      </div>

      {error && (
        <div
          style={{
            padding:       "10px 14px",
            borderRadius:  "var(--radius-md)",
            background:    "rgba(239, 68, 68, 0.1)",
            color:         "var(--color-danger-text)",
            fontSize:      "12px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* ─── KPIs agregados (si hay datos) ─── */}
      {stats.count > 0 && (
        <div style={KPI_BAR}>
          <div style={KPI_CARD}>
            <div style={KPI_LABEL}>Total evaluaciones</div>
            <div style={KPI_VALUE}>{stats.count}</div>
          </div>
          <div style={KPI_CARD}>
            <div style={KPI_LABEL}>Promedio global</div>
            <div style={KPI_VALUE}>
              {stats.average_overall !== null ? `${stats.average_overall} ⭐` : "—"}
            </div>
          </div>
          <div style={KPI_CARD}>
            <div style={KPI_LABEL}>Última recomendación</div>
            <div style={{ ...KPI_VALUE, fontSize: "13px" }}>
              {(() => {
                const cfg = recommendationConfig(stats.latest_recommendation);
                return cfg ? `${cfg.emoji} ${cfg.label}` : "—";
              })()}
            </div>
          </div>
          <div style={KPI_CARD}>
            <div style={KPI_LABEL}>Última fecha</div>
            <div style={{ ...KPI_VALUE, fontSize: "13px" }}>
              {formatDate(evaluations[0]?.evaluation_date)}
            </div>
          </div>
        </div>
      )}

      {loading && <div style={{ color: "var(--color-text-muted)" }}>⏳ Cargando evaluaciones...</div>}

      {!loading && evaluations.length === 0 && !showForm && (
        <div style={EMPTY_STATE}>
          📊 No hay evaluaciones registradas.
          <br />
          Haz clic en <strong>Nueva evaluación</strong> para registrar la primera.
        </div>
      )}

      {/* ─── Formulario nueva evaluación ─── */}
      {showForm && (
        <div style={{ ...PANEL, border: "1px solid var(--color-brand-blue, #3b82f6)", background: "rgba(59, 130, 246, 0.05)" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            ➕ Nueva evaluación
          </div>

          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap:                 "12px",
            }}
          >
            <Field label="Fecha" required>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                style={FIELD_INPUT}
              />
            </Field>
            <Field label="Periodo" hint="Ej. Q4 2025, oct-25, Anual 2025">
              <input
                type="text"
                value={formPeriod}
                onChange={(e) => setFormPeriod(e.target.value)}
                placeholder="Periodo evaluado"
                style={FIELD_INPUT}
              />
            </Field>
            <Field label="Score global" span={2} hint="Calculado automáticamente.">
              <div
                style={{
                  ...FIELD_INPUT,
                  display:        "flex",
                  alignItems:     "center",
                  fontWeight:     700,
                  fontSize:       "16px",
                  color:          liveOverall !== null
                    ? "var(--color-brand-blue, #3b82f6)"
                    : "var(--color-text-muted)",
                  background:     "var(--color-bg-subtle)",
                }}
              >
                {liveOverall !== null ? `${liveOverall} / 5.00 ⭐` : "Sin calificar"}
              </div>
            </Field>
          </div>

          {/* Criterios */}
          <div
            style={{
              padding:        "12px",
              borderRadius:   "var(--radius-md)",
              background:     "var(--color-bg-elevated)",
              border:         "1px solid var(--color-border)",
              display:        "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap:            "10px",
            }}
          >
            {EVALUATION_CRITERIA.map((c) => {
              let value:    number | null = null;
              let setValue: (v: number | null) => void = () => {};
              if (c.field === "quality_score")       { value = formQuality;       setValue = setFormQuality;       }
              if (c.field === "delivery_score")      { value = formDelivery;      setValue = setFormDelivery;      }
              if (c.field === "price_score")         { value = formPrice;         setValue = setFormPrice;         }
              if (c.field === "service_score")       { value = formService;       setValue = setFormService;       }
              if (c.field === "communication_score") { value = formCommunication; setValue = setFormCommunication; }
              if (c.field === "documentation_score") { value = formDocumentation; setValue = setFormDocumentation; }

              return (
                <div
                  key={c.field as string}
                  style={{
                    display:        "flex",
                    flexDirection:  "column",
                    gap:            "4px",
                    padding:        "8px 10px",
                    borderRadius:   "var(--radius-sm, 4px)",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {c.label}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                    {c.hint}
                  </div>
                  <StarRating value={value} onChange={setValue} />
                </div>
              );
            })}
          </div>

          <Field label="Recomendación">
            <select
              value={formRecommendation ?? ""}
              onChange={(e) =>
                setFormRecommendation(
                  (e.target.value || null) as EvaluationRecommendation | null,
                )
              }
              style={FIELD_SELECT}
            >
              <option value="">— Sin definir —</option>
              {RECOMMENDATION_OPTIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.emoji} {r.label}
                </option>
              ))}
            </select>
          </Field>

          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap:                 "12px",
            }}
          >
            <Field label="Fortalezas">
              <textarea
                value={formStrengths}
                onChange={(e) => setFormStrengths(e.target.value)}
                placeholder="Aspectos destacados positivos..."
                rows={3}
                style={{ ...FIELD_TEXTAREA, minHeight: "70px" }}
              />
            </Field>
            <Field label="Debilidades / Áreas de mejora">
              <textarea
                value={formWeaknesses}
                onChange={(e) => setFormWeaknesses(e.target.value)}
                placeholder="Aspectos que requieren atención..."
                rows={3}
                style={{ ...FIELD_TEXTAREA, minHeight: "70px" }}
              />
            </Field>
            <Field label="Acciones de mejora acordadas">
              <textarea
                value={formActions}
                onChange={(e) => setFormActions(e.target.value)}
                placeholder="Compromisos y plan de acción..."
                rows={3}
                style={{ ...FIELD_TEXTAREA, minHeight: "70px" }}
              />
            </Field>
            <Field label="Comentarios adicionales">
              <textarea
                value={formComments}
                onChange={(e) => setFormComments(e.target.value)}
                placeholder="Observaciones generales..."
                rows={3}
                style={{ ...FIELD_TEXTAREA, minHeight: "70px" }}
              />
            </Field>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || liveOverall === null}
              style={{
                ...PRIMARY_BUTTON,
                opacity: saving || liveOverall === null ? 0.5 : 1,
                cursor:  saving || liveOverall === null ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Guardando..." : "💾 Guardar evaluación"}
            </button>
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(false); }}
              disabled={saving}
              style={SECONDARY_BUTTON}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ─── Lista histórica ─── */}
      {evaluations.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Histórico ({evaluations.length})
          </div>

          <div
            style={{
              ...HISTORY_ROW,
              background: "var(--color-bg-elevated)",
              fontWeight: 700,
              fontSize:   "10px",
              textTransform: "uppercase",
              letterSpacing: "0.4px",
              color:      "var(--color-text-muted)",
            }}
          >
            <div>Fecha</div>
            <div>Periodo / Evaluador</div>
            <div style={{ textAlign: "center" }}>Score</div>
            <div>Recomendación</div>
            <div>Criterios</div>
            <div></div>
          </div>

          {evaluations.map((e) => {
            const cfg = recommendationConfig(e.recommendation);
            return (
              <div key={e.id} style={HISTORY_ROW}>
                <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                  {formatDate(e.evaluation_date)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                  <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {e.period_label || "—"}
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                    {e.evaluator_name || "Sin evaluador"}
                  </span>
                </div>
                <div style={{ textAlign: "center", fontWeight: 700, fontSize: "14px", color: "var(--color-brand-blue, #3b82f6)" }}>
                  {e.overall_score !== null && e.overall_score !== undefined
                    ? `${e.overall_score}`
                    : "—"}
                </div>
                <div>
                  {cfg && (
                    <span style={{ ...BADGE_BASE, color: cfg.color, background: cfg.bg }}>
                      {cfg.emoji} {cfg.label}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "3px", fontSize: "10px", color: "var(--color-text-muted)" }}>
                  {e.quality_score        != null && <span title="Calidad">      C{e.quality_score}</span>}
                  {e.delivery_score       != null && <span title="Puntualidad">  P{e.delivery_score}</span>}
                  {e.price_score          != null && <span title="Precio">       $${e.price_score}</span>}
                  {e.service_score        != null && <span title="Servicio">     S{e.service_score}</span>}
                  {e.communication_score  != null && <span title="Comunicación"> Co{e.communication_score}</span>}
                  {e.documentation_score  != null && <span title="Documentación">D{e.documentation_score}</span>}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => handleDelete(e.id!)}
                    style={ICON_BUTTON}
                    title="Eliminar evaluación"
                    aria-label="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!showForm && !loading && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          style={{
            ...PRIMARY_BUTTON,
            alignSelf: "flex-start",
          }}
        >
          ➕ Nueva evaluación
        </button>
      )}
    </div>
  );
}