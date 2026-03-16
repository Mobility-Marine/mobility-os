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

    // 🏢 Verificar si pertenece a alguna empresa
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

    // 🆕 Usuario SIN empresa → onboarding
    if (!memberships || memberships.length === 0) {
      router.replace("/create-company");
      return;
    }

    // ✅ Usuario con empresa → entrar al sistema
    router.replace("/");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08142c",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          background: "#0b1b3a",
          padding: 32,
          borderRadius: 12,
          width: 340,
          border: "1px solid #284577",
        }}
      >
        <h2>Mobility OS</h2>

        <input
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={primaryButton}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {/* ⭐ Crear cuenta */}
        <button
          onClick={() => router.replace("/signup")}
          style={secondaryButton}
        >
          Crear cuenta
        </button>

        <p style={{ marginTop: 12, color: "#94a3b8" }}>{status}</p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginBottom: 12,
  height: 40,
  borderRadius: 8,
  border: "1px solid #334155",
  padding: "0 12px",
  background: "#020617",
  color: "#fff",
};

const primaryButton: React.CSSProperties = {
  width: "100%",
  height: 42,
  borderRadius: 8,
  background: "#2563eb",
  border: "none",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
  marginBottom: 10,
};

const secondaryButton: React.CSSProperties = {
  width: "100%",
  height: 42,
  borderRadius: 8,
  background: "transparent",
  border: "1px solid #3b82f6",
  color: "#c7d7ff",
  fontWeight: "bold",
  cursor: "pointer",
};
