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
    setStatus("Iniciando sesión...");

    // 🔐 Login
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

    // 🏢 Verificar empresa
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

    // 🆕 Sin empresa → onboarding
    if (!memberships || memberships.length === 0) {
      router.replace("/create-company");
      return;
    }

    // ✅ Con empresa → entrar al sistema
    router.replace("/");
  }

  return (
    <div style={wrap}>
      <div style={card}>
        {/* ===== HEADER ===== */}
        <div style={header}>
          <div style={logo}>Mobility OS</div>

          <div style={tagline}>
            Plataforma operativa inteligente para logística y comercio global
          </div>

          <div style={statusRow}>
            <StatusDot color="#22c55e" label="Sistema operativo" />
            <StatusDot color="#60a5fa" label="IA activa" />
            <StatusDot color="#facc15" label="Seguridad enterprise" />
          </div>
        </div>

        {/* ===== FORM ===== */}
        <div style={form}>
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

          {status && <div style={statusStyle}>{status}</div>}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={primaryButton}
          >
            {loading ? "Accediendo…" : "Entrar al sistema"}
          </button>

          <button
            onClick={() => router.replace("/signup")}
            style={secondaryButton}
          >
            Crear cuenta empresarial
          </button>
        </div>

        {/* ===== FOOTER ===== */}
        <div style={footer}>
          Mobility OS — Revenue · Operaciones · IA · Control total
        </div>
      </div>
    </div>
  );
}

function StatusDot({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div style={statusItem}>
      <div style={{ ...dot, background: color }} />
      {label}
    </div>
  );
}

/* =========================
   UNICORN STYLES
========================= */

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "radial-gradient(circle at 20% 20%, #0b1b35, #050a14 60%)",
  padding: 24,
};

const card: React.CSSProperties = {
  width: 420,
  maxWidth: "100%",
  background: "rgba(11,18,32,0.75)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(96,165,250,0.25)",
  borderRadius: 22,
  padding: 32,
  display: "grid",
  gap: 26,
  boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
};

const header: React.CSSProperties = {
  display: "grid",
  gap: 10,
  textAlign: "center",
};

const logo: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  color: "#eaf2ff",
};

const tagline: React.CSSProperties = {
  fontSize: 14,
  color: "#9fb0c8",
};

const statusRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 12,
  marginTop: 6,
  flexWrap: "wrap",
};

const statusItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  color: "#c7d2fe",
};

const dot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
};

const form: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const input: React.CSSProperties = {
  height: 46,
  borderRadius: 10,
  border: "1px solid #2b3a52",
  background: "#0b1323",
  color: "#f8fafc",
  padding: "0 14px",
  outline: "none",
};

const primaryButton: React.CSSProperties = {
  height: 48,
  borderRadius: 12,
  border: "none",
  background: "#4f7cff",
  color: "#0b1020",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  height: 44,
  borderRadius: 10,
  border: "1px solid #2b3a52",
  background: "transparent",
  color: "#c7d2fe",
  fontWeight: 700,
  cursor: "pointer",
};

const statusStyle: React.CSSProperties = {
  background: "rgba(59,130,246,0.15)",
  border: "1px solid rgba(59,130,246,0.35)",
  color: "#c7d2fe",
  padding: 10,
  borderRadius: 8,
  fontSize: 13,
};

const footer: React.CSSProperties = {
  textAlign: "center",
  fontSize: 11,
  color: "#64748b",
};
