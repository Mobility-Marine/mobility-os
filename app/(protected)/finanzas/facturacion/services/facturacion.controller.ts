import { useState, useCallback } from "react";
import type { CFDIDocument, FacturacionStats, NewCFDIForm } from "../types/facturacion.types";
import {
  fetchCFDIs, fetchCFDIStats, fetchCFDIById,
  emitirCFDI, cancelarCFDI, downloadXML, downloadPDF, sendEmail,
  emitirComplementoPago, emitirNotaCredito,
  fetchBusinessNotes, createBusinessNote,
} from "./facturacion.service";

export type CFDIFilters = {
  search: string; type: string; status: string;
  from: string; to: string;
};

// status="" significa "todos los estados" (proforma + valid + cancelled)
// type=""   significa "todos los tipos" (I + E + P + T + N)
export const DEFAULT_FILTERS: CFDIFilters = {
  search: "", type: "", status: "", from: "", to: "",
};

export function useFacturacionController(companyId: string, userId: string) {

  const [cfdis,        setCfdis]        = useState<CFDIDocument[]>([]);
  const [selected,     setSelected]     = useState<{ cfdi: CFDIDocument; concepts: any[] } | null>(null);
  const [stats,        setStats]        = useState<FacturacionStats>({
    total_month: 0, count_month: 0,
    count_pending_pay: 0, total_pending_pay: 0,
    count_cancelled: 0, count_total: 0,
    por_moneda: {},
  });
  const [filters,      setFilters]      = useState<CFDIFilters>(DEFAULT_FILTERS);
  const [notes,        setNotes]        = useState<any[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [savingNote,   setSavingNote]   = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // ── CARGAR CFDIs + STATS ─────────────────────────────────────

  const load = useCallback(async (f?: CFDIFilters) => {
    if (!companyId) return;
    setLoading(true); setError(null);
    const active = f ?? filters;
    try {
      const [list, st] = await Promise.all([
        fetchCFDIs(companyId, active),
        fetchCFDIStats(companyId),
      ]);
      setCfdis(list);
      setStats(st);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [companyId, filters]);

  // ── FILTROS ──────────────────────────────────────────────────

  const handleFilter = useCallback((partial: Partial<CFDIFilters>) => {
    setFilters((p) => {
      const next = { ...p, ...partial };
      load(next);
      return next;
    });
  }, [load]);

  // ── SELECCIONAR CFDI (abre panel de detalle) ─────────────────

  const handleSelect = useCallback(async (cfdi: CFDIDocument) => {
    setLoading(true);
    try { setSelected(await fetchCFDIById(cfdi.id)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  // ── EMITIR FACTURA INGRESO ───────────────────────────────────

  const handleEmitir = useCallback(async (form: NewCFDIForm) => {
      setSaving(true); setError(null);
      try {
        const result = await emitirCFDI(companyId, userId, form);
        await load();
        return result?.cfdi ?? null;
      } catch (e: any) { setError(e.message); throw e; }
      finally { setSaving(false); }
    }, [companyId, userId, load]);

  // ── EMITIR COMPLEMENTO DE PAGO (REP) ─────────────────────────

  const handleEmitirComplemento = useCallback(async (payload: any) => {
    setSaving(true); setError(null);
    try {
      await emitirComplementoPago(companyId, userId, payload);
      await load();
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, load]);

  // ── EMITIR NOTA DE CRÉDITO ───────────────────────────────────

  const handleEmitirNotaCredito = useCallback(async (payload: any) => {
    setSaving(true); setError(null);
    try {
      await emitirNotaCredito(companyId, userId, payload);
      await load();
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, load]);

  // ── CANCELAR CFDI ────────────────────────────────────────────

  const handleCancelar = useCallback(async (
    cfdiId: string, facturApiId: string, motive: string, substitution?: string
  ) => {
    setSaving(true); setError(null);
    try {
      await cancelarCFDI(companyId, cfdiId, facturApiId, motive, substitution);
      await load();
      setSelected(null);
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, load]);

  // ── DESCARGAS ─────────────────────────────────────────────────

  const handleDownloadXML = useCallback((c: CFDIDocument) => {
    if (!c.facturapi_id) return;
    downloadXML(companyId, c.facturapi_id, `${c.serie ?? ""}${c.folio ?? c.id}`)
      .catch((e) => setError(e.message));
  }, [companyId]);

  const handleDownloadPDF = useCallback((c: CFDIDocument) => {
    if (!c.facturapi_id) return;
    downloadPDF(companyId, c.facturapi_id, `${c.serie ?? ""}${c.folio ?? c.id}`)
      .catch((e) => setError(e.message));
  }, [companyId]);

  // ── ENVIAR EMAIL ──────────────────────────────────────────────

  const handleSendEmail = useCallback(async (c: CFDIDocument, email: string) => {
    if (!c.facturapi_id) return;
    setSaving(true);
    try { await sendEmail(companyId, c.facturapi_id, email); }
    catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId]);

  // ── NOTAS SIN VALOR FISCAL ────────────────────────────────────

  const loadNotes = useCallback(async () => {
    if (!companyId) return;
    setLoadingNotes(true);
    try { setNotes(await fetchBusinessNotes(companyId)); }
    catch (e: any) { setError(e.message); }
    finally { setLoadingNotes(false); }
  }, [companyId]);

  const handleCreateNote = useCallback(async (payload: any) => {
    setSavingNote(true); setError(null);
    try {
      await createBusinessNote(companyId, userId, payload);
      await loadNotes();
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSavingNote(false); }
  }, [companyId, userId, loadNotes]);

  // ── RETURN ────────────────────────────────────────────────────

  return {
    // Estado
    cfdis, selected, stats, filters,
    notes, loading, saving, savingNote, loadingNotes, error,
    // Setters directos
    setSelected,
    // CFDIs
    load,
    handleFilter,
    handleSelect,
    handleEmitir,
    handleEmitirComplemento,
    handleEmitirNotaCredito,
    handleCancelar,
    handleDownloadXML,
    handleDownloadPDF,
    handleSendEmail,
    // Notas
    loadNotes,
    handleCreateNote,
  };
}
