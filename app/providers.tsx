"use client";

import { AuthProvider } from "@/lib/auth/AuthProvider";
import TenantProvider from "@/lib/tenant/TenantProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TenantProvider>
        {children}
      </TenantProvider>
    </AuthProvider>
  );
}
