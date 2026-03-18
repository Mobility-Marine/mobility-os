"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setStatus("Ingresa correo y contraseña");
      return;
    }

    setLoading(true);
    setStatus("Validando credenciales...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setStatus("Error obteniendo usuario");
      setLoading(false);
      return;
    }

    const { data: memberships, error: membershipError } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.id)
      .limit(1);

    if (membershipError) {
      console.error(membershipError);
      setStatus("Error verificando empresa");
      setLoading(false);
      return;
    }

    if (!memberships || memberships.length === 0) {
      router.replace("/create-company");
      return;
    }

    router.replace("/");
  }

  return (
    <div style={page}>
      <div style={glow} />

      <div style={card}>
        <div style={brand}>Mobility OS</div>

        <div style={tagline}>
          Plataforma operativa inteligente para empresas globales
        </div>

        <div style={statusBar}>
          <Dot color="#22c55e" /> Sistema operativo
          <Dot color="#eab308" /> Seguridad enterprise
          <Dot color="#f97316" /> IA activa
        </div>

        <input
          placeholder="Correo corporativo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={input}
        />

        <button onClick={handleLogin} disabled={loading} style={primaryBtn}>
          {loading ? "Accediendo..." : "Entrar al sistema"}
        </button>

        <button
          onClick={() => router.replace("/signup")}
          style={secondaryBtn}
        >
          Crear cuenta empresarial
        </button>

        <div style={statusText}>{status}</div>

        <div style={footer}>
          Mobility OS — Revenue · Operaciones · IA · Control total
        </div>
      </div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        marginRight: 6,
        marginLeft: 12,
      }}
    />
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 20% 20%, #1f2937 0%, #020617 60%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica",
  position: "relative",
};

const glow: React.CSSProperties = {
  position: "absolute",
  width: 600,
  height: 600,
  background:
    "radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)",
  filter: "blur(120px)",
};

const card: React.CSSProperties = {
  width: 420,
  padding: 40,
  borderRadius: 18,
  background: "rgba(10,10,10,0.85)",
  backdropFilter: "blur(30px)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow:
    "0 40px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
  display: "flex",
  flexDirection: "column",
  gap: 16,
  zIndex: 2,
};

const brand: React.CSSProperties = {
  fontSize: 34,
  fontWeight: 700,
  letterSpacing: -0.5,
};

const tagline: React.CSSProperties = {
  fontSize: 14,
  color: "#9ca3af",
  marginBottom: 6,
};

const statusBar: React.CSSProperties = {
  fontSize: 12,
  color: "#9ca3af",
  marginBottom: 10,
};

const input: React.CSSProperties = {
  width: "100%",
  height: 46,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  padding: "0 14px",
  background: "#020617",
  color: "#fff",
  fontSize: 15,
  outline: "none",
};

const primaryBtn: React.CSSProperties = {
  width: "100%",
  height: 48,
  borderRadius: 12,
  background: "#ffffff",
  color: "#000",
  border: "none",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
  marginTop: 8,
};

const secondaryBtn: React.CSSProperties = {
  width: "100%",
  height: 46,
  borderRadius: 12,
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "#e5e7eb",
  fontWeight: 600,
  cursor: "pointer",
};

const statusText: React.CSSProperties = {
  minHeight: 18,
  fontSize: 13,
  color: "#f87171",
};

const footer: React.CSSProperties = {
  fontSize: 11,
  color: "#6b7280",
  textAlign: "center",
  marginTop: 10,
};
