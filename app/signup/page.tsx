"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!email || !password) {
      alert("Completa correo y contraseña");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        alert("No se pudo crear el usuario");
        setLoading(false);
        return;
      }

      router.replace("/create-company");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error registrando usuario");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#061534",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#0b1f49",
          border: "1px solid #244a8f",
          borderRadius: 18,
          padding: 32,
          color: "#fff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: 24, fontSize: 28 }}>
          Crear cuenta
        </h1>

        <div style={{ display: "grid", gap: 14 }}>
          <input
            type="email"
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
            onClick={handleSignup}
            disabled={loading}
            style={primaryButton}
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <button
            onClick={() => router.replace("/login")}
            style={secondaryButton}
          >
            Ya tengo cuenta
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#07142f",
  color: "#fff",
  border: "1px solid #345a9d",
  borderRadius: 10,
  padding: "14px 16px",
  outline: "none",
  boxSizing: "border-box",
};

const primaryButton: React.CSSProperties = {
  background: "#3b6df6",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "14px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  background: "transparent",
  color: "#c7d7ff",
  border: "1px solid #345a9d",
  borderRadius: 10,
  padding: "14px 16px",
  fontWeight: 600,
  cursor: "pointer",
};
