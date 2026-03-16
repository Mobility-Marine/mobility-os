"use client";

import { useState } from "react";
import { createCompanyWithTenant } from "@/services/company/company.service";
import { useRouter } from "next/navigation";

export default function CreateCompanyPage() {
  const [name, setName] = useState("");
  const router = useRouter();

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function CreateCompanyPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    if (!name) return alert("Ingresa el nombre");

    setLoading(true);

    // 🔐 Usuario actual
    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    const user = userData?.user;

    if (userError || !user) {
      alert("Usuario no autenticado");
      setLoading(false);
      return;
    }

    try {
      // 🏢 1) Crear TENANT
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name,
          owner_user_id: user.id,
        })
        .select("id")
        .single();

      if (tenantError) {
        alert("TENANT ERROR: " + tenantError.message);
        setLoading(false);
        return;
      }

      // 🏢 2) Crear EMPRESA
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name,
          tenant_id: tenant.id,
          owner_user_id: user.id,
        })
        .select("id")
        .single();

      if (companyError) {
        alert("COMPANY ERROR: " + companyError.message);
        setLoading(false);
        return;
      }

      // 👤 3) Asociar usuario
      const { error: linkError } = await supabase
        .from("company_users")
        .insert({
          company_id: company.id,
          user_id: user.id,
          role: "owner",
          is_active: true,
        });

      if (linkError) {
        alert("COMPANY_USERS ERROR: " + linkError.message);
        setLoading(false);
        return;
      }

      // ⭐ 4) Guardar empresa activa
      const { error: settingsError } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          active_company_id: company.id,
        });

      if (settingsError) {
        alert("USER_SETTINGS ERROR: " + settingsError.message);
        setLoading(false);
        return;
      }

      // 🚀 Entrar al sistema
      router.replace("/");
    } catch (err: any) {
      alert("ERROR INESPERADO: " + err.message);
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Crear tu primera empresa</h1>

      <input
        placeholder="Nombre de la empresa"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ padding: 10, marginTop: 20 }}
      />

      <button
        onClick={handleCreate}
        disabled={loading}
        style={{ marginLeft: 10, padding: "10px 16px" }}
      >
        {loading ? "Creando..." : "Crear empresa"}
      </button>
    </div>
  );
}
