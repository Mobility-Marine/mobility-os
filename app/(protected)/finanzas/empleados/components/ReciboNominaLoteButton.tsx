"use client";
import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import JSZip from "jszip";
import ReciboNominaPDF from "./ReciboNominaPDF";
import type { PayrollEntry, PayrollPeriod, Employee } from "../types/empleados.types";
import { fetchCompanySettings } from "@/app/(protected)/comercial/cotizaciones/services/quotations.service";
import { useTenant } from "@/lib/tenant/TenantProvider";

type Props = {
  entries:   PayrollEntry[];
  period:    PayrollPeriod;
  employees: Employee[];
};

export default function ReciboNominaLoteButton({ entries, period, employees }: Props) {
  const { companyId } = useTenant();
  const [loading,   setLoading]   = useState(false);
  const [progress,  setProgress]  = useState(0);

  async function handleDownloadAll() {
    if (!entries.length) return;
    setLoading(true); setProgress(0);
    try {
      const settings = companyId ? await fetchCompanySettings(companyId) : null;
      const zip      = new JSZip();
      const empMap   = new Map(employees.map(e => [e.id, e]));

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const emp   = empMap.get(entry.employee_id);
        if (!emp) continue;

        const blob = await pdf(
          <ReciboNominaPDF entry={entry} period={period} employee={emp} settings={settings} />
        ).toBlob();

        const filename = `${emp.last_name}_${emp.first_name}_P${period.period_number}.pdf`;
        zip.file(filename, blob);
        setProgress(Math.round(((i + 1) / entries.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url     = URL.createObjectURL(zipBlob);
      const a       = document.createElement("a");
      a.href        = url;
      a.download    = `nomina_P${period.period_number}_${period.year}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setLoading(false); setProgress(0); }
  }

  return (
    <button onClick={handleDownloadAll} disabled={loading || !entries.length}
      style={{ height: "32px", padding: "0 16px", borderRadius: "var(--radius-md)", background: entries.length ? "var(--color-success-text)" : "var(--color-bg-subtle)", color: entries.length ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "12px", fontWeight: 700, cursor: (loading || !entries.length) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: loading ? 0.8 : 1 }}>
      {loading
        ? <>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            {`Generando ${progress}%…`}
          </>
        : <>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {`Descargar todos (${entries.length})`}
          </>
      }
    </button>
  );
}
