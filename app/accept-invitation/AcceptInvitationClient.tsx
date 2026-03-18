"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

// ===== INICIO lógica cliente =====
export default function AcceptInvitationClient() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("token");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Procesando invitación...");

  useEffect(() => {
    accept();
  }, []);

  async function accept() {
    if (!token) {
      setMessage("Token inválido");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Debes iniciar sesión primero");
      setLoading(false);
      return;
    }

    const { data: invitation } = await supabase
      .from("company_invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (!invitation) {
      setMessage("Invitación no válida o expirada");
      setLoading(false);
      return;
    }

    if (invitation.status !== "pending") {
      setMessage("Esta invitación ya fue utilizada");
      setLoading(false);
      return;
    }

    await supabase.from("company_users").insert({
      user_id: user.id,
      company_id: invitation.company_id,
      role: invitation.role,
      is_active: true,
    });

    await supabase
      .from("company_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    setMessage("Invitación aceptada. Redirigiendo...");

    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  }

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        height: "100vh",
        background: "#020617",
        color: "#fff",
        fontSize: 18,
      }}
    >
      {loading ? "Cargando..." : message}
    </div>
  );
}
// ===== FIN lógica cliente =====
