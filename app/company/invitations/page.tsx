"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";

export default function InvitationsPage() {
  const { companyId } = useTenant();
  const [email, setEmail] = useState("");

  async function invite() {
    if (!companyId || !email) return;

    const token = crypto.randomUUID();

    await supabase.from("company_invitations").insert({
      company_id: companyId,
      email,
      token,
    });

    alert("Invitación creada");
    setEmail("");
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Invitar usuario</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={invite}>Invitar</button>
    </div>
  );
}
