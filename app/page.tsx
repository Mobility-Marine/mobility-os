"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type ClientRow = {
  id: string;
  name: string | null;
  rfc: string | null;
  address: string | null;
  contact: string | null;
  email: string | null;
  company_id: string | null;
};

type ViewName =
  | "Dashboard"
  | "CRM"
  | "Cotizaciones"
  | "Embarques"
  | "Facturación"
  | "Reportes"
  | "Proveedores"
  | "Comercio Exterior";

export default function Home() {
  const [status, setStatus] = useState("Conectando con Supabase...");
  const [companyCount, setCompanyCount] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<ViewName>("Dashboard");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: "",
    rfc: "",
    address: "",
    contact: "",
    email: "",
  });

  const modules: ViewName[] = useMemo(
    () => [
      "Dashboard",
      "CRM",
      "Cotizaciones",
      "Embarques",
      "Facturación",
      "Reportes",
      "Proveedores",
      "Comercio Exterior",
    ],
    []
  );

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

  useEffect(() => {
    if (activeView === "CRM") {
      loadClients();
    }
  }, [activeView]);

  async function loadClients() {
    setLoadingClients(true);

    const { data, error } = await supabase
      .from("clients")
      .select("id, name, rfc, address, contact, email, company_id")
      .order("created_at", { ascending: false });

    if (error) {
      setStatus(`Error cargando clientes: ${error.message}`);
      setLoadingClients(false);
      return;
    }

    setClients((data as ClientRow[]) || []);
    setLoadingClients(false);
  }

  async function createClient() {
    const { data: companyData } = await supabase
      .from("companies")
      .select("id")
      .limit(1);

    const firstCompanyId = companyData?.[0]?.id;

    if (!firstCompanyId) {
      setStatus("No existe una empresa base en la tabla companies.");
      return;
    }

    const { error } = await supabase.from("clients").insert({
      company_id: firstCompanyId,
      name: clientForm.name,
      rfc: clientForm.rfc,
      address: clientForm.address,
      contact: clientForm.contact,
      email: clientForm.email,
    });

    if (error) {
      setStatus(`Error creando cliente: ${error.message}`);
      return;
    }

    setClientForm({
      name: "",
      rfc: "",
      address: "",
      contact: "",
      email: "",
    });

    setStatus("Cliente creado correctamente");
    loadClients();
  }

  const cards = [
    { title: "Cotizaciones abiertas", value: "0" },
    { title: "Embarques activos", value: "0" },
    { title: "Facturas pendientes", value: "0" },
    { title: "Empresas registradas", value: companyCount ?? "-" },
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
              onClick={() => setActiveView(item)}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                marginBottom: 8,
                background: activeView === item ? "#16315f" : "transparent",
                color: "#c9d7f2",
                border:
                  activeView === item
                    ? "1px solid #2f5aa6"
                    : "1px solid transparent",
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
            <h1 style={{ margin: 0 }}>{activeView}</h1>
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

        {activeView === "Dashboard" && (
          <>
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
                  <div style={{ color: "#9fb3d9", fontSize: 14 }}>
                    {card.title}
                  </div>
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
                  Mobility OS ya está conectado con Supabase y listo para
                  comenzar a construir los módulos reales del sistema: CRM,
                  cotizaciones, embarques, facturación y reportes.
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
                <ul
                  style={{
                    paddingLeft: 18,
                    color: "#d8e3fb",
                    lineHeight: 1.8,
                  }}
                >
                  <li>Nuevo cliente</li>
                  <li>Nueva cotización</li>
                  <li>Nuevo embarque</li>
                  <li>Nueva factura</li>
                </ul>
              </div>
            </section>
          </>
        )}

        {activeView === "CRM" && (
          <div style={{ display: "grid", gap: 16 }}>
            <section
              style={{
                background: "#12284d",
                border: "1px solid #284577",
                borderRadius: 16,
                padding: 22,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Nuevo cliente</h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                <input
                  placeholder="Nombre o razón social"
                  value={clientForm.name}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, name: e.target.value })
                  }
                  style={inputStyle}
                />
                <input
                  placeholder="RFC"
                  value={clientForm.rfc}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, rfc: e.target.value })
                  }
                  style={inputStyle}
                />
                <input
                  placeholder="Dirección"
                  value={clientForm.address}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, address: e.target.value })
                  }
                  style={inputStyle}
                />
                <input
                  placeholder="Contacto"
                  value={clientForm.contact}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, contact: e.target.value })
                  }
                  style={inputStyle}
                />
                <input
                  placeholder="Correo"
                  value={clientForm.email}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, email: e.target.value })
                  }
                  style={{ ...inputStyle, gridColumn: "1 / span 2" }}
                />
              </div>

              <button
                onClick={createClient}
                style={{
                  marginTop: 16,
                  background: "#2f5aa6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 18px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Guardar cliente
              </button>
            </section>

            <section
              style={{
                background: "#12284d",
                border: "1px solid #284577",
                borderRadius: 16,
                padding: 22,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Clientes registrados</h3>

              {loadingClients ? (
                <p>Cargando clientes...</p>
              ) : clients.length === 0 ? (
                <p>No hay clientes registrados todavía.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginTop: 12,
                    }}
                  >
                    <thead>
                      <tr style={{ textAlign: "left", color: "#9fb3d9" }}>
                        <th style={thStyle}>Nombre</th>
                        <th style={thStyle}>RFC</th>
                        <th style={thStyle}>Dirección</th>
                        <th style={thStyle}>Contacto</th>
                        <th style={thStyle}>Correo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client) => (
                        <tr key={client.id}>
                          <td style={tdStyle}>{client.name || "-"}</td>
                          <td style={tdStyle}>{client.rfc || "-"}</td>
                          <td style={tdStyle}>{client.address || "-"}</td>
                          <td style={tdStyle}>{client.contact || "-"}</td>
                          <td style={tdStyle}>{client.email || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {!["Dashboard", "CRM"].includes(activeView) && (
          <section
            style={{
              background: "#12284d",
              border: "1px solid #284577",
              borderRadius: 16,
              padding: 22,
            }}
          >
            <h3 style={{ marginTop: 0 }}>{activeView}</h3>
            <p style={{ color: "#c5d3ee" }}>
              Este módulo será construido en la siguiente fase.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#0b1220",
  color: "#fff",
  border: "1px solid #334155",
  borderRadius: 10,
  padding: "12px 14px",
  outline: "none",
};

const thStyle: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "1px solid #334155",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "1px solid #22314f",
};
