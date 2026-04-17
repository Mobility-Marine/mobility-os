"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import { useEmpleadosController } from "./services/empleados.controller";
import EmpleadosDashboard   from "./components/EmpleadosDashboard";
import EmpleadosNomina      from "./components/EmpleadosNomina";
import EmpleadosVacaciones  from "./components/EmpleadosVacaciones";
import EmpleadosNuevoDrawer from "./components/EmpleadosNuevoDrawer";

type Tab = "dashboard" | "expedientes" | "nomina" | "vacaciones" | "prestamos";

export default function EmpleadosPage() {
  const { lang, t }   = useTranslation();
  const { companyId } = useTenant();
  const es  = lang !== "en";
  const em  = (t as any).empleados ?? {};

  const [userId,   setUserId]   = useState("");
  const [tab,      setTab]      = useState<Tab>("dashboard");
  const [newOpen,  setNewOpen]  = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  const ctrl = useEmpleadosController(companyId ?? "", userId);

  useEffect(() => { if (companyId && userId) ctrl.load(); }, [companyId, userId]);

  const TABS: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "dashboard",    label: em.tabDashboard    ?? "Dashboard",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
    { key: "expedientes",  label: em.tabExpedientes  ?? "Expedientes",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { key: "nomina",       label: em.tabNomina       ?? "Nómina",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
    { key: "vacaciones",   label: em.tabVacaciones   ?? "Vacaciones",
      badge: ctrl.timeOff.filter(t => t.status === "pending").length,
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  ];

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
            👥 {em.title ?? "Empleados"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {em.
