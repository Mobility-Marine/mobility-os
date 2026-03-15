"use client";

import { useState } from "react";
import { createCompanyWithTenant } from "@/services/company/company.service";
import { useRouter } from "next/navigation";

export default function CreateCompanyPage() {
  const [name, setName] = useState("");
  const router = useRouter();

  async function handleCreate() {
    if (!name) return alert("Ingresa el nombre");

    await createCompanyWithTenant(name);

    router.push("/dashboard");
    router.refresh();
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
        style={{ marginLeft: 10, padding: "10px 16px" }}
      >
        Crear empresa
      </button>
    </div>
  );
}
