"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth } from "@/lib/auth/AuthProvider";

export type WidgetSize = "small" | "medium" | "large" | "full";

export interface WidgetConfig {
  id: string;
  size: WidgetSize;
  visible: boolean;
}

export const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: "command_strip",   size: "full",   visible: true },
  { id: "hero_panel",      size: "large",  visible: true },
  { id: "ai_panel",        size: "small",  visible: true },
  { id: "health_score",    size: "small",  visible: true },
  { id: "pipeline_funnel", size: "medium", visible: true },
  { id: "upcoming_events", size: "small",  visible: true },
  { id: "activity_feed",   size: "small",  visible: true },
  { id: "alerts_panel",    size: "small",  visible: true },
  { id: "quick_actions",   size: "small",  visible: true },
  { id: "team_activity",   size: "small",  visible: true },
  { id: "domain_cards",    size: "full",   visible: true },
];

const SETTING_KEY = "dashboard_layout";

export function useLayout() {
  const { user } = useAuth();
  const { companyId } = useTenant();
  const [layout, setLayout] = useState<WidgetConfig[]>(DEFAULT_LAYOUT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    void loadLayout();
  }, [user]);

  async function loadLayout() {
    const { data } = await supabase
      .from("user_settings")
      .select("value")
      .eq("user_id", user!.id)
      .eq("key", SETTING_KEY)
      .maybeSingle() as any;

    if (data?.value) {
      try {
        const saved = JSON.parse(data.value) as WidgetConfig[];
        const merged = mergeWithDefaults(saved);
        setLayout(merged);
      } catch {
        setLayout(DEFAULT_LAYOUT);
      }
    }
    setLoaded(true);
  }

  function mergeWithDefaults(saved: WidgetConfig[]): WidgetConfig[] {
    const savedMap = new Map(saved.map((w) => [w.id, w]));
    const existing = saved.filter((w) =>
      DEFAULT_LAYOUT.some((d) => d.id === w.id)
    );
    const newWidgets = DEFAULT_LAYOUT.filter(
      (d) => !savedMap.has(d.id)
    );
    return [...existing, ...newWidgets];
  }

  async function saveLayout(next: WidgetConfig[]) {
    if (!user) return;
    setLayout(next);
    await supabase.from("user_settings").upsert({
      user_id: user.id,
      key: SETTING_KEY,
      value: JSON.stringify(next),
      updated_at: new Date().toISOString(),
    } as any);
  }

  function reorder(fromId: string, toId: string) {
    if (fromId === toId) return;
    const next = [...layout];
    const fromIdx = next.findIndex((w) => w.id === fromId);
    const toIdx = next.findIndex((w) => w.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    void saveLayout(next);
  }

  function resizeWidget(id: string, size: WidgetSize) {
    const next = layout.map((w) =>
      w.id === id ? { ...w, size } : w
    );
    void saveLayout(next);
  }

  function toggleWidget(id: string) {
    const next = layout.map((w) =>
      w.id === id ? { ...w, visible: !w.visible } : w
    );
    void saveLayout(next);
  }

  function resetLayout() {
    void saveLayout(DEFAULT_LAYOUT);
  }

  return { layout, loaded, reorder, resizeWidget, toggleWidget, resetLayout };
}
