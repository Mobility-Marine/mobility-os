"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CompanySelector() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [activeCompany, setActiveCompany] = useState<string>("");

  useEffect(() => {
    loadCompanies();

    const saved = localStorage.getItem("activeCompanyId");
    if (saved) setActiveCompany(saved);
  }, []);

  async function loadCompanies() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) return;

    const { data } = await supabase
      .from("company_users")
      .select("company_id, companies(name)")
      .eq("user_id", user.id);

    setCompanies(data || []);
  }

  async function changeCompany(companyId: string) {
    setActiveCompany(companyId);

    localStorage.setItem("activeCompanyId", companyId);

    window.location.reload();
  }

  return (
    <select
      value={activeCompany}
      onChange={(e) => changeCompany(e.target.value)}
    >
      <option value="">Seleccionar empresa</option>

      {companies.map((c) => (
        <option key={c.company_id} value={c.company_id}>
          {c.companies.name}
        </option>
      ))}
    </select>
  );
}
