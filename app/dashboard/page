"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCompany();
  }, []);

  async function checkCompany() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.replace("/login");
      return;
    }

    // ✅ Dejar que RLS filtre automáticamente
    const { data, error } = await supabase
      .from("company_users")
      .select("company_id")
      .limit(1);

    if (error) {
      console.error(error);
      router.replace("/create-company");
      return;
    }

    if (!data || data.length === 0) {
      router.replace("/create-company");
    } else {
      setLoading(false);
    }
  }

  if (loading) return <div>Cargando...</div>;

  return <div>Dashboard principal 🚀</div>;
}
