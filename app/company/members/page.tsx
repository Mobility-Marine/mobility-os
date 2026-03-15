"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";

export default function MembersPage() {
  const { companyId } = useTenant();
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    loadMembers();
  }, [companyId]);

  async function loadMembers() {
    if (!companyId) return;

    const { data } = await supabase
      .from("company_users")
      .select("*")
      .eq("company_id", companyId);

    setMembers(data || []);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Usuarios de la empresa</h1>

      {members.map((m) => (
        <div key={m.id}>
          {m.user_id} — {m.role}
        </div>
      ))}
    </div>
  );
}
