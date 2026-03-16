"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function handleSignup() {
    setStatus("Creando cuenta...");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Cuenta creada. Inicia sesión.");
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
        <h2>Crear cuenta — Mobility OS</h2>

        <input
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            marginBottom: 12,
            height: 40,
            borderRadius: 8,
            border: "1px solid #334155",
            padding: "0 12px",
            background: "#020617",
            color: "#fff",
          }}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            marginBottom: 12,
            height: 40,
            borderRadius: 8,
            border: "1px solid #334155",
            padding: "0 12px",
            background: "#020617",
            color: "#fff",
          }}
        />

        <button
          onClick={handleSignup}
          style={{
            width: "100%",
            height: 42,
            borderRadius: 8,
            background: "#2563eb",
            border: "none",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Registrarse
        </button>

        <p style={{ marginTop: 12, color: "#94a3b8" }}>{status}</p>
      </div>
    </div>
  );
}
