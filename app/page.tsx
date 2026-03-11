"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [status, setStatus] = useState("Conectando con Supabase...");
  const [companyCount, setCompanyCount] = useState<number | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        const { count, error } = await supabase
          .from("companies")
          .select("*", { count: "exact", head: true });

        if (error) {
          setStatus(`Error de conexión: ${error.message}`);
          return;
        }

        setCompanyCount(count ?? 0);
        setStatus("Supabase conectado correctamente");
      } catch {
        setStatus("No se pudo conectar con Supabase");
      }
    }

    testConnection();
  }, []);

  const cards = [
    { title: "Cotizaciones abiertas", value: "0" },
    { title: "Embarques activos", value: "0" },
    { title: "Facturas pendientes", value: "0" },
    { title: "Empresas registradas", value: companyCount ?? "-" },
  ];

  const modules = [
    "Dashboard",
    "CRM",
    "Cotizaciones",
    "Embarques",
    "Facturación",
    "Reportes",
    "Proveedores",
    "Comercio Exterior",
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08142c",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        display: "grid",
        gridTemplateColumns: "260px 1fr",
      }}
    >
      <aside
        style={{
          background: "#0b1b3a",
          borderRight: "1px solid #1e335c",
          padding: "24px 18px",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 6 }}>Mobility OS</h2>
        <p style={{ color: "#9fb3d9", fontSize: 14, marginTop: 0 }}>
          Mobility Marine
        </p>

        <div style={{ marginTop: 28 }}>
          {modules.map((item) => (
            <div
              key={item}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                marginBottom: 8,
                background: item === "Dashboard" ? "#16315f" : "transparent",
                color: item === "Dashboard" ? "#ffffff" : "#c9d7f2",
                border: item === "Dashboard" ? "1px solid #2f5aa6" : "1px solid transparent",
                cursor: "pointer",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </aside>

      <main style={{ padding: 28 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>Dashboard</h1>
            <p style={{ margin: "6px 0 0", color: "#aab9d6" }}>
              ERP logístico y de comercio exterior
            </p>
          </div>

          <div
            style={{
              background: "#102244",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #284577",
              color: "#dbe7ff",
              fontSize: 14,
            }}
          >
            {status}
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {cards.map((card) => (
            <div
              key={card.title}
              style={{
                background: "#12284d",
                border: "1px solid #284577",
                borderRadius: 16,
                padding: 20,
              }}
            >
              <div style={{ color: "#9fb3d9", fontSize: 14 }}>{card.title}</div>
              <div style={{ fontSize: 30, fontWeight: 700, marginTop: 10 }}>
                {card.value}
              </div>
            </div>
          ))}
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "#12284d",
              border: "1px solid #284577",
              borderRadius: 16,
              padding: 22,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Resumen general</h3>
            <p style={{ color: "#c5d3ee", lineHeight: 1.6 }}>
              Mobility OS ya está conectado con Supabase y listo para comenzar a
              construir los módulos reales del sistema: CRM, cotizaciones,
              embarques, facturación y reportes.
            </p>
            <p style={{ color: "#9fb3d9" }}>
              Empresas registradas: <strong>{companyCount ?? "-"}</strong>
            </p>
          </div>

          <div
            style={{
              background: "#12284d",
              border: "1px solid #284577",
              borderRadius: 16,
              padding: 22,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Accesos rápidos</h3>
            <ul style={{ paddingLeft: 18, color: "#d8e3fb", lineHeight: 1.8 }}>
              <li>Nuevo cliente</li>
              <li>Nueva cotización</li>
              <li>Nuevo embarque</li>
              <li>Nueva factura</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
