"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomeRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return <div style={{ padding: 40 }}>Cargando Mobility OS...</div>;
}
