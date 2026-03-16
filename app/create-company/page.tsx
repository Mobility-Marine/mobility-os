"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function CreateCompanyPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function createCompany() {
    if (!name) return alert("Ingresa nombre");

    setLoading(true);

    // 🔐 Usuario actual
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      alert("Usuario no autenticado");
      setLoading(false);
      return;
    }

    try {
      // ===============================
      // 🏢 1️⃣ Crear TENANT
      // ===============================
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name,
          owner_user_id: user.id,
        })
        .select("id")
        .single();

      if (tenantError) throw tenantError;

      // ===============================
      // 🏢 2️⃣ Crear EMPRESA
      // ===============================
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name,
          tenant_id: tenant.id,
          owner_user_id: user.id,
        })
        .select("id")
        .single();

      if (companyError) throw companyError;

      // ===============================
      // 👤 3️⃣ Asociar usuario como owner
      // ===============================
      const { error: linkError } = await supabase
        .from("company_users")
        .insert({
          company_id: company.id,
          user_id: user.id,
          role: "owner",
          is_active: true,
        });

      if (linkError) throw linkError;

      // ===============================
      // ⭐ 4️⃣ Guardar empresa activa
      // ===============================
      const { error: settingsError } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          active_company_id: company.id,
        });

      if (settingsError) throw settingsError;

      // ===============================
      // 🚀 5️⃣ Entrar al sistema
      // ===============================
      router.replace("/");
    } catch (err) {
      console.error(err);
      alert("Error creando empresa");
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Crear empresa</h1>

      <input
        placeholder="Nombre de la empresa"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ padding: 10, marginTop: 20 }}
      />

      <br />

      <button
        onClick={createCompany}
        disabled={loading}
        style={{ marginTop: 20 }}
      >
        {loading ? "Creando..." : "Crear empresa"}
      </button>
    </div>
  );
}
