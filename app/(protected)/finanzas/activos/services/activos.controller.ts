import { useState, useCallback } from "react";
import type { FixedAsset, DepreciationEntry, AssetDisposal, AssetStats } from "../types/activos.types";
import {
  fetchAssets, createAsset, updateAsset, fetchAssetStats,
  fetchPendingDepreciation, fetchPostedDepreciation,
  postDepreciationPeriod, disposeAsset, fetchDisposals,
} from "./activos.service";

export function useActivosController(companyId: string, userId: string) {
  const [assets,      setAssets]      = useState<FixedAsset[]>([]);
  const [stats,       setStats]       = useState<AssetStats>({
    total_assets: 0, total_cost: 0, total_book_value: 0,
    total_accumulated_dep: 0, monthly_dep_pending: 0, by_type: {} as any,
  });
  const [pending,     setPending]     = useState<DepreciationEntry[]>([]);
  const [posted,      setPosted]      = useState<DepreciationEntry[]>([]);
  const [disposals,   setDisposals]   = useState<AssetDisposal[]>([]);
  const [selected,    setSelected]    = useState<FixedAsset | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const today  = new Date();
  const period = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try {
      const [assetList, st, pend, post, disp] = await Promise.all([
        fetchAssets(companyId),
        fetchAssetStats(companyId),
        fetchPendingDepreciation(companyId, period),
        fetchPostedDepreciation(companyId, period),
        fetchDisposals(companyId),
      ]);
      setAssets(assetList); setStats(st);
      setPending(pend); setPosted(post);
      setDisposals(disp);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [companyId, period]);

  const handleCreate = useCallback(async (payload: any) => {
    setSaving(true); setError(null);
    try { await createAsset(companyId, userId, payload); await load(); }
    catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, load]);

  const handleUpdate = useCallback(async (id: string, updates: Partial<FixedAsset>) => {
    setSaving(true);
    try { await updateAsset(companyId, id, updates); await load(); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }, [companyId, load]);

  const handlePostPeriod = useCallback(async () => {
    setSaving(true); setError(null);
    try {
      const count = await postDepreciationPeriod(companyId, period);
      await load();
      return count;
    } catch (e: any) { setError(e.message); return 0; }
    finally { setSaving(false); }
  }, [companyId, period, load]);

  const handleDispose = useCallback(async (payload: any) => {
    setSaving(true); setError(null);
    try { await disposeAsset(companyId, userId, payload); await load(); }
    catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, load]);

  return {
    assets, stats, pending, posted, disposals, selected, period,
    loading, saving, error,
    setSelected, load,
    handleCreate, handleUpdate, handlePostPeriod, handleDispose,
  };
}
