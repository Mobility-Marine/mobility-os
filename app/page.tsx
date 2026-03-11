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
      } catch (err) {
        setStatus("No se pudo conectar con Supabase");
      }
    }

    testConnection();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "#1e293b",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        <h1 style={{ marginBottom: 8 }}>Mobility OS</h1>
        <p style={{ marginTop: 0, color: "#cbd5e1" }}>
          Logistics & Foreign Trade Management System
        </p>

        <div
          style={{
            marginTop: 24,
            padding: 20,
            borderRadius: 12,
            background: "#0b1220",
            border: "1px solid #334155",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Estado del sistema</h2>
          <p>{status}</p>
          <p>
            Empresas registradas en base de datos:{" "}
            <strong>{companyCount ?? "-"}</strong>
          </p>
        </div>

        <div
          style={{
            marginTop: 24,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
          }}
        >
          {[
            "Dashboard",
            "CRM",
            "Cotizaciones",
            "Embarques",
            "Facturación",
            "Reportes",
          ].map((item) => (
            <div
              key={item}
              style={{
                background: "#172033",
                border: "1px solid #334155",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <strong>{item}</strong>
              <p style={{ color: "#94a3b8", marginBottom: 0, marginTop: 8 }}>
                Próximo módulo a desarrollar
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
