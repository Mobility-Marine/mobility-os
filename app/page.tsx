"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
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
  | "Comercio Exterior";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activeView, setActiveView] = useState<ViewName>("Dashboard");
  const [status, setStatus] = useState("Sistema listo");

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

  // ⏳ Loader mientras valida sesión
  if (loading || !user) {
    return (
      <div style={{ padding: 40 }}>
        Verificando sesión...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08142c",
        color: "#fff",
        fontFamily: "Arial",
        display: "grid",
        gridTemplateColumns: "260px 1fr",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          background: "#0b1b3a",
          borderRight: "1px solid #1e335c",
          padding: 24,
        }}
      >
        <h2>Mobility OS</h2>
        <p style={{ color: "#9fb3d9" }}>Mobility Marine</p>

        <div style={{ marginTop: 24 }}>
          {modules.map((m) => (
            <div
              key={m}
              onClick={() => setActiveView(m)}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                marginBottom: 8,
                cursor: "pointer",
                background: activeView === m ? "#16315f" : "transparent",
                border:
                  activeView === m
                    ? "1px solid #2f5aa6"
                    : "1px solid transparent",
              }}
            >
              {m}
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ padding: 28 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <h1>{activeView}</h1>

          <div
            style={{
              background: "#102244",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #284577",
            }}
          >
            {status}
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
