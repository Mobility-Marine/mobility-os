"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import Agenda from "./components/Agenda";
import { supabase } from "@/lib/supabaseClient";

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
  | "Comercio Exterior";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activeView, setActiveView] = useState<ViewName>("Dashboard");
  const [status] = useState("Sistema listo");

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
    ],
    []
  );

  // 🔐 Redirección si no hay sesión
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // ⏳ Loader
  if (loading || !user) {
    return <div style={{ padding: 40 }}>Verificando sesión...</div>;
  }

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
      {/* SIDEBAR */}
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
              onClick={() => setActiveView(m)}
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
                transition: "0.15s",
              }}
            >
              {m}
            </div>
          ))}
        </div>

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
  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
    <img
      src="/logo.png"
      alt="Mobility OS"
      style={{ width: 38, height: 38 }}
    />

    <div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>
        {activeView}
      </div>

      <div style={{ fontSize: 12, color: "#9fb3d9" }}>
        Mobility OS Platform
      </div>
    </div>
  </div>

  {/* DERECHA */}
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    {/* ESTADO */}
    <div
      style={{
        background: "#0f2045",
        padding: "8px 14px",
        borderRadius: 10,
        border: "1px solid #2a4a88",
        fontSize: 13,
      }}
    >
      Sistema activo
    </div>

    {/* USUARIO */}
    <div
      style={{
        textAlign: "right",
        fontSize: 13,
      }}
    >
      <div style={{ color: "#9fb3d9" }}>Usuario</div>
      <div style={{ fontWeight: 600 }}>{user.email}</div>
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
        {!["Dashboard", "Agenda"].includes(activeView) && (
          <p>Módulo en construcción.</p>
        )}
      </main>
    </div>
  );
}
