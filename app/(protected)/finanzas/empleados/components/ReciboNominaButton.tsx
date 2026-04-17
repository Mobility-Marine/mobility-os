"use client";
import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import ReciboNominaPDF from "./ReciboNominaPDF";
import type { PayrollEntry, PayrollPeriod, Employee } from "../types/empleados.types";
import { fetchCompanySettings } from "@/app/(protected)/comercial/cotizaciones/services/quotations.service";
import { useTenant } from "@/lib/tenant/TenantProvider";

type Props = {
  entry:    PayrollEntry;
  period:   PayrollPeriod;
  employee: Employee;
  variant?: "icon" | "full";
};

export default function ReciboNominaButton({ entry, period, employee, variant = "full" }: Props) {
  const { companyId } = useTenant();
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const settings = companyId ? await fetchCompanySettings(companyId) : null;
      const blob = await pdf(
        <ReciboNominaPDF
          entry={entry}
          period={period}
          employee={employee}
          settings={settings}
        />
      ).toBlob();

      const fullName = `${employee.first_name}_${employee.last_name}`;
      const filename = `recibo_nomina_${fullName}_P${period.period_number}_${period.year}.pdf`;
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href    = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setLoading(false); }
  }

  if (variant === "icon") {
    return (
      <button onClick={handleDownload} disabled={loading} title="Descargar recibo PDF"
        style={{ width: "28px", height: "28px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: loading ? "var(--color-text-muted)" : "var(--color-brand-blue)", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {loading
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        }
      </button>
    );
  }

  return (
    <button onClick={handleDownload} disabled={loading}
      style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", color: "var(--color-brand-blue)", fontSize: "11px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "5px", opacity: loading ? 0.7 : 1 }}>
      {loading
        ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      }
      {loading ? "Generando…" : "Recibo PDF"}
    </button>
  );
}
