"use client";

import { useEffect, useState } from "react";
import { syncAllModuleEvents } from "@/services/agenda/module-events.service";

export function useModuleEvents(companyId: string | null) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (!companyId) return;
    void sync();
    const id = setInterval(sync, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [companyId]);

  async function sync() {
    if (!companyId || syncing) return;
    setSyncing(true);
    try {
      await syncAllModuleEvents(companyId);
      setLastSync(new Date());
    } catch (err) {
      console.error("Module sync error:", err);
    } finally {
      setSyncing(false);
    }
  }

  return { syncing, lastSync, syncNow: sync };
}
