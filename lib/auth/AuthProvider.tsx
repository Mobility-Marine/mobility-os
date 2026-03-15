"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AuthContextType = {
  user: any | null;
  companyId: string | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  companyId: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUser(user);

      // 🔹 Obtener empresa del usuario
      const { data } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (data) setCompanyId(data.company_id);

      setLoading(false);
    };

    loadSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, companyId, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
