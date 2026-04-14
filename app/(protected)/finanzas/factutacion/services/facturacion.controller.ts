import { useState, useCallback } from "react";
import type { CFDIDocument, FacturacionStats, NewCFDIForm } from "../types/facturacion.types";
import {
  fetchCFDIs, fetchCFDIStats, fetchCFDIById,
  emitirCFDI, cancelarCFDI, downloadXML, downloadPDF, sendEmail,
} from "./facturacion.service";

export type CFDIFilters = {
  search: string; type: string; status: string;
  from: string; to: string;
};
export const DEFAULT_FILTERS: CFDIFilters = { search: "", type: "", status: "", from: "", to: "" };

export function useFacturacionController(companyId: string, userId: string) {
  const [cfdis,    setCfdis]    = useState<CFDIDocument[]>([]);
  const [selected, setSelected] = useState<{ cfdi: CFDIDocument; concepts: any[] } | null>(null);
  const [stats,    setStats]    = useState<FacturacionStats>({ total_month: 0, count_month: 0, count_pending_pay: 0, total_pending_pay: 0, count_cancelled: 0, count_total: 0 });
  const [filters,  setFilters]  = useState<CFDIFilters>(DEFAULT_FILTERS);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async (f?: CFDIFilters) => {
    if (!companyId) return;
    setLoading(true); setError(null);
    const active = f ?? filters;
    try {
      const [list, st] = await Promise.all([
        fetchCFDIs(companyId, active),
        fetchCFDIStats(companyId),
      ]);
      setCfdis(list); setStats(st);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [companyId, filters]);

  const handleFilter = useCallback((partial: Partial<CFDIFilters>) => {
    setFilters((p) => {
      const next = { ...p, ...partial };
      load(next);
      return next;
    });
  }, [load]);

  const handleSelect = useCallback(async (cfdi: CFDIDocument) => {
    setLoading(true);
    try { setSelected(await fetchCFDIById(cfdi.id)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const handleEmitir = useCallback(async (form: NewCFDIForm) => {
    setSaving(true); setError(null);
    try {
      await emitirCFDI(companyId, userId, form);
      await load();
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, load]);

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

  const handleDownloadXML = useCallback((c: CFDIDocument) => {
    if (!c.facturapi_id) return;
    downloadXML(companyId, c.facturapi_id, `${c.serie ?? ""}${c.folio ?? c.id}`).catch((e) => setError(e.message));
  }, [companyId]);

  const handleDownloadPDF = useCallback((c: CFDIDocument) => {
    if (!c.facturapi_id) return;
    downloadPDF(companyId, c.facturapi_id, `${c.serie ?? ""}${c.folio ?? c.id}`).catch((e) => setError(e.message));
  }, [companyId]);

  const handleSendEmail = useCallback(async (c: CFDIDocument, email: string) => {
    if (!c.facturapi_id) return;
    setSaving(true);
    try { await sendEmail(companyId, c.facturapi_id, email); }
    catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId]);

  return {
    cfdis, selected, stats, filters, loading, saving, error,
    load, handleFilter, handleSelect, setSelected,
    handleEmitir, handleCancelar,
    handleDownloadXML, handleDownloadPDF, handleSendEmail,
  };
}
