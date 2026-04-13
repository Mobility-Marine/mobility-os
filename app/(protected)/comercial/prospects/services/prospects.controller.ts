// ============================================================
// PROSPECTS CONTROLLER v2 — GOD LEVEL
// Hook maestro: estado + acciones + realtime + snapshot
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import type {
  Prospect,
  ProspectActivity,
  ProspectNote,
  ProspectTask,
  CreateActivityPayload,
  CreateNotePayload,
  CreateTaskPayload,
} from "../types/prospects.types";
import {
  fetchProspects,
  createProspect as createProspectService,
  updateProspect as updateProspectService,
  updateProspectStage as updateStageService,
  archiveProspect as archiveProspectService,
} from "./prospects.service";
import {
  fetchProspectSnapshot,
  createProspectActivity,
  createProspectNote,
  updateProspectNote,
  deleteProspectNote,
  createProspectTask,
  completeProspectTask,
} from "./prospects.activities.service";
import { convertProspectToCustomer } from "./prospect-conversion.service";
import { buildProspectHealth } from "./prospects.intelligence";
import { buildTimeline } from "./prospects.normalization";
import type { ProspectConversionInput } from "../types/prospects.types";

export function useProspectsController() {
  const { companyId }  = useTenant();
  const { user }       = useAuth();

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selected,  setSelected]  = useState<Prospect | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Snapshot del prospecto seleccionado
  const [activities, setActivities] = useState<ProspectActivity[]>([]);
  const [notes,      setNotes]      = useState<ProspectNote[]>([]);
  const [tasks,      setTasks]      = useState<ProspectTask[]>([]);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  // ──────────────────────────────────────────────────────────
  // LOAD PROSPECTS + REALTIME
  // ──────────────────────────────────────────────────────────

  const loadProspects = useCallback(async () => {
    if (!companyId) return;
    try {
      const data = await fetchProspects(companyId);
      // Enriquecer con health score
      const enriched = data.map((p) => ({
        ...p,
        health: buildProspectHealth({ prospect: p }),
      }));
      setProspects(enriched);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void loadProspects();

    const channel = supabase
      .channel(`prospects-${companyId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "prospects",
        filter: `company_id=eq.${companyId}`,
      }, () => void loadProspects())
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [companyId, loadProspects]);

  // ──────────────────────────────────────────────────────────
  // SNAPSHOT DEL PROSPECTO SELECCIONADO
  // ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!selected || !companyId) {
      setActivities([]); setNotes([]); setTasks([]);
      return;
    }
    setSnapshotLoading(true);
    fetchProspectSnapshot(companyId, selected.id).then((snap) => {
      setActivities(snap.activities);
      setNotes(snap.notes);
      setTasks(snap.tasks);

      // Actualizar selected con timeline + health completo
      const timeline = buildTimeline(snap.activities, snap.followups, snap.tasks);
      const health   = buildProspectHealth({
        prospect:   selected,
        activities: snap.activities,
        tasks:      snap.tasks,
        followups:  snap.followups,
      });
      setSelected((prev) => prev ? { ...prev, health, timeline } : prev);
    }).finally(() => setSnapshotLoading(false));
  }, [selected?.id, companyId]);

  // ──────────────────────────────────────────────────────────
  // ACCIONES — PROSPECTS
  // ──────────────────────────────────────────────────────────

  async function createProspect(payload: Parameters<typeof createProspectService>[1]) {
    if (!companyId) return;
    setSaving(true);
    try {
      const prospect = await createProspectService(companyId, {
        ...payload,
        created_by: user?.id,
      });
      await loadProspects();
      return prospect;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateProspect(id: string, payload: Partial<Prospect>) {
    if (!companyId) return;
    // Optimistic update
    setProspects((prev) => prev.map((p) => p.id === id ? { ...p, ...payload } : p));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, ...payload } : prev);
    try {
      await updateProspectService(id, payload);
      await loadProspects();
    } catch (e: any) {
      setError(e.message);
      await loadProspects(); // revert
    }
  }

  async function updateStage(id: string, stage: Prospect["stage"]) {
    if (!companyId || !stage) return;
    await updateStageService(companyId, id, stage);
    await loadProspects();
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, stage } : prev);
  }

  async function archiveProspect(id: string) {
    if (!companyId) return;
    await archiveProspectService(companyId, id);
    await loadProspects();
    if (selected?.id === id) setSelected(null);
  }

  async function convertProspect(prospectId: string, input: ProspectConversionInput = {}) {
    if (!companyId) return;
    setSaving(true);
    try {
      const result = await convertProspectToCustomer(companyId, prospectId, input);
      await loadProspects();
      if (selected?.id === prospectId) setSelected(null);
      return result;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setSaving(false);
    }
  }

  // ──────────────────────────────────────────────────────────
  // ACCIONES — ACTIVIDADES
  // ──────────────────────────────────────────────────────────

  async function addActivity(payload: CreateActivityPayload) {
    if (!companyId || !selected || !user) return;
    const act = await createProspectActivity(companyId, selected.id, user.id, payload);
    setActivities((prev) => [act, ...prev]);
  }

  async function addNote(payload: CreateNotePayload) {
    if (!companyId || !selected || !user) return;
    const note = await createProspectNote(companyId, selected.id, user.id, payload);
    setNotes((prev) => [note, ...prev]);
  }

  async function pinNote(noteId: string, is_pinned: boolean) {
    await updateProspectNote(noteId, { is_pinned });
    setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, is_pinned } : n));
  }

  async function removeNote(noteId: string) {
    await deleteProspectNote(noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  async function addTask(payload: CreateTaskPayload) {
    if (!companyId || !selected) return;
    const task = await createProspectTask(companyId, selected.id, payload);
    setTasks((prev) => [...prev, task]);
  }

  async function completeTask(taskId: string) {
    await completeProspectTask(taskId);
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, completed: true, status: "done" } : t));
  }

  // ──────────────────────────────────────────────────────────
  // RETURN
  // ──────────────────────────────────────────────────────────

  return {
    // State
    loading, saving, error, snapshotLoading,
    prospects, selected, setSelected,
    activities, notes, tasks,
    // Prospect actions
    createProspect, updateProspect,
    updateStage, archiveProspect, convertProspect,
    // Activity actions
    addActivity, addNote, pinNote, removeNote,
    addTask, completeTask,
    // Utils
    reload: loadProspects,
  };
}
