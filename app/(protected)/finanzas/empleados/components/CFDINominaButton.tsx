"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { fetchCompanySettings } from "@/app/(protected)/comercial/cotizaciones/services/quotations.service";
import { emitirCFDINomina } from "../services/nomina.cfdi.service";
import type { Employee, PayrollEntry, PayrollPeriod } from "../types/empleados.types";

type Props = {
  employee: Employee;
  entry:    PayrollEntry;
  period:   PayrollPeriod;
  onSuccess:(uuid: string) => void;
};

export default function CFDINominaButton({ employee, entry, period, onSuccess }: Props) {
  const { companyId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Si ya está timbrado, mostrar el UUID
  if (entry.cfdi_uuid) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: "var(--color-success-bg)", color: "var(--color-success-text)", border: "1px solid var(--color-success-border)" }}>
          ✓ Timbrado
        </span>
        <span style={{ fontSize: "9px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
          {entry.cfdi_uuid.substring(0, 8)}…
        </span>
      </div>
    );
  }

  async function handleTimbre() {
    if (!companyId) return;
    setLoading(true); setError(null);
    try {
      // Validar datos mínimos
      if (!employee.rfc)  throw new Error(`${employee.first_name} ${employee.last_name} no tiene RFC.`);
      if (!employee.curp) throw new Error(`${employee.first_name} ${employee.last_name} no tiene CURP.`);
      if (!employee.nss)  throw new Error(`${employee.first_name} ${employee.last_name} no tiene NSS.`);

      const [settings, { data: { user } }] = await Promise.all([
        fetchCompanySettings(companyId),
        supabase.auth.getUser(),
      ]);

      const result = await emitirCFDINomina(
        companyId, user?.id ?? "",
        employee, entry, period, settings
      );

      // Guardar UUID en payroll_entry
      await supabase.from("payroll_entries")
        .update({ cfdi_uuid: result.uuid, updated_at: new Date().toISOString() })
        .eq("id", entry.id);

      onSuccess(result.uuid);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
      <button onClick={handleTimbre} disabled={loading}
        style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)", background: loading ? "var(--color-bg-subtle)" : "var(--color-warning-bg)", border: `1px solid ${loading ? "var(--color-border)" : "var(--color-warning-border)"}`, color: loading ? "var(--color-text-muted)" : "var(--color-warning-text)", fontSize: "10px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
        {loading
          ? <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Timbrando…</>
          : <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Timbrar CFDI</>
        }
      </button>
      {error && (
        <div style={{ fontSize: "9px", color: "var(--color-danger-text)", maxWidth: "140px", textAlign: "right", lineHeight: 1.3 }}>
          {error}
        </div>
      )}
    </div>
  );
}
