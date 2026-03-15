"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import Agenda from "./components/Agenda";

type ViewName =
  | "Dashboard"
  | "Prospectos"
  | "CRM"
  | "Agenda"
  | "Cotizaciones"
  | "Embarques"
  | "Facturación"
  | "Reportes"
  | "Proveedores"
  | "Comercio Exterior"
  | "Empresa";

export default function Home() {
  const { user, loading } = useAuth();
  const {
    companyId,
    memberships,
    loadingTenant,
    setActiveCompany,
  } = useTenant();

  const router = useRouter();

  const [activeView, setActiveView] =
    useState<ViewName>("Dashboard");

 const modules: ViewName[] = useMemo(
  () => [
    "Dashboard",
    "Prospectos",
    "CRM",
    "Agenda",
    "Cotizaciones",
    "Embarques",
    "Facturación",
    "Reportes",
    "Proveedores",
    "Comercio Exterior",
    "Empresa",
  ],
  []
);

  // 🔐 Redirección si no hay sesión
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

// ⏳ Loader global
if (loading || loadingTenant || !user) {
  return (
    <div style={{ padding: 40 }}>
      Verificando sesión...
    </div>
  );
}

// 🏢 Usuario sin empresa activa
if (!companyId) {
  return (
    <div style={{ padding: 40 }}>
      <h2>Usuario sin empresa activa</h2>
      <p>Debes crear o unirte a una empresa para continuar.</p>

      <button
        onClick={() => router.push("/create-company")}
        style={{
          marginTop: 20,
          padding: "12px 20px",
          background: "#2563eb",
          border: "none",
          borderRadius: 8,
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Crear empresa
      </button>
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#070f24",
        color: "#fff",
        fontFamily: "Inter, Arial",
        display: "grid",
        gridTemplateColumns: "280px 1fr",
      }}
    >
      {/* SIDEBAR O */}
      <aside
        style={{
          background: "#0b1733",
          borderRight: "1px solid #1f2f5a",
          padding: 24,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* LOGO */}
        <div style={{ marginBottom: 28 }}>
          <img
            src="/logo.png"
            alt="Mobility OS"
            style={{ width: "100%", maxWidth: 180 }}
          />
          <p style={{ color: "#9fb3d9", marginTop: 6 }}>
            Mobility Marine
          </p>
        </div>

        {/* MENÚ */}
        <div style={{ flex: 1 }}>
          {modules.map((m) => (
  <div
    key={m}
    onClick={() => {
      if (m === "Empresa") {
        router.push("/company");
        return;
      }
      setActiveView(m);
    }}
    style={{
      padding: "12px 14px",
      borderRadius: 10,
      marginBottom: 8,
      cursor: "pointer",
      background:
        activeView === m ? "#1b3a7a" : "transparent",
      border:
        activeView === m
          ? "1px solid #3b6ed6"
          : "1px solid transparent",
    }}
  >
    {m}
  </div>
))}

        {/* USUARIO */}
        <div
          style={{
            paddingTop: 16,
            borderTop: "1px solid #1f2f5a",
            fontSize: 14,
            color: "#9fb3d9",
          }}
        >
          Conectado como:
          <div style={{ color: "#fff", marginTop: 4 }}>
            {user.email}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ padding: 32 }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
            background: "#0b1733",
            padding: "12px 18px",
            borderRadius: 12,
            border: "1px solid #1f2f5a",
          }}
        >
          {/* IZQUIERDA */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <img
              src="/logo.png"
              alt="Mobility OS"
              style={{ width: 38, height: 38 }}
            />

          <div>
  <div
    style={{
      fontSize: 20,
      fontWeight: 600,
    }}
  >
    {activeView}
  </div>

  <div
    style={{
      fontSize: 12,
      color: "#9fb3d9",
    }}
  >
    Mobility OS Platform
  </div>

  {/* 🏢 Empresa activa */}
  {companyId && (
    <div
      style={{
        fontSize: 11,
        color: "#7fa1ff",
        marginTop: 2,
      }}
    >
      Tenant activo: {companyId.slice(0, 8)}
    </div>
  )}
</div>
          </div>

          {/* DERECHA */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            {/* SELECTOR EMPRESA PRO */}
<div style={{ display: "flex", flexDirection: "column" }}>
  <div
    style={{
      fontSize: 11,
      color: "#9fb3d9",
      marginBottom: 4,
      textAlign: "left",
    }}
  >
    Empresa
  </div>

  <select
    value={companyId || ""}
    onChange={async (e) => {
  await setActiveCompany(e.target.value);
  window.location.reload();
}}
    disabled={memberships.length === 0}
    style={{
      background: "#0f2045",
      color: "#fff",
      border: "1px solid #2a4a88",
      padding: "10px 12px",
      borderRadius: 10,
      fontWeight: 600,
      minWidth: 200,
      outline: "none",
      cursor: memberships.length === 0 ? "not-allowed" : "pointer",
    }}
  >
    {memberships.length === 0 && (
      <option value="">Sin empresas</option>
    )}

   {memberships.map((m) => (
  <option key={m.id} value={m.company_id}>
    {m.company_name || "Empresa"}
  </option>
))}
  </select>
</div>

            {/* USUARIO */}
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 12,
                  color: "#9fb3d9",
                }}
              >
                Usuario
              </div>
              <div style={{ fontWeight: 600 }}>
                {user.email}
              </div>
            </div>

            {/* LOGOUT */}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace("/login");
              }}
              style={{
                background: "#1f3a8a",
                border: "none",
                padding: "10px 14px",
                borderRadius: 8,
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Salir
            </button>
          </div>
        </header>

        {/* DASHBOARD */}
        {activeView === "Dashboard" && (
          <p>Sistema listo para operar.</p>
        )}

        {/* AGENDA */}
        {activeView === "Agenda" && <Agenda />}

        {/* OTROS */}
        {!["Dashboard", "Agenda"].includes(
          activeView
        ) && <p>Módulo en construcción.</p>}
      </main>
    </div>
  );
}
