"use client";

// ════════════════════════════════════════════════════════════════════════
// PLATAFORMA — Configuración del SaaS: usuarios, suscripción, ayuda
// ════════════════════════════════════════════════════════════════════════
// Las cards de Usuarios y Suscripción reutilizan los tabs existentes
// (TabUsuarios y TabSuscripcion) dentro de drawers. La card de Ayuda
// es un link directo al módulo /help.
// ════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { useRouter }    from "next/navigation";
import SettingCard      from "../components/SettingCard";
import SettingDrawer    from "../components/SettingDrawer";
import TabUsuarios      from "../tabs/TabUsuarios";
import TabSuscripcion   from "../tabs/TabSuscripcion";

type DrawerKey = null | "usuarios" | "suscripcion";

export default function PlataformaCategory() {
  const [openDrawer, setOpenDrawer] = useState<DrawerKey>(null);
  const router = useRouter();

  return (
    <>
      {/* Grid de cards */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap:                 "16px",
        }}
      >
        <SettingCard
          icon="👥"
          title="Usuarios y permisos"
          description="Invita a tu equipo, asigna roles y gestiona accesos."
          onClick={() => setOpenDrawer("usuarios")}
        />
        <SettingCard
          icon="💳"
          title="Suscripción"
          description="Plan actual, próximos cobros y método de pago."
          onClick={() => setOpenDrawer("suscripcion")}
        />
        <SettingCard
          icon="🎓"
          title="Ayuda y soporte"
          description="Centro de ayuda, documentación y contacto con el equipo."
          onClick={() => router.push("/help")}
        />
      </div>

      {/* Drawer: Usuarios */}
      <SettingDrawer
        open={openDrawer === "usuarios"}
        onClose={() => setOpenDrawer(null)}
        title="Usuarios y permisos"
        description="Gestiona quién tiene acceso al workspace y con qué rol."
        icon="👥"
        size="lg"
      >
        <TabUsuarios />
      </SettingDrawer>

      {/* Drawer: Suscripción */}
      <SettingDrawer
        open={openDrawer === "suscripcion"}
        onClose={() => setOpenDrawer(null)}
        title="Suscripción"
        description="Tu plan, ciclo de facturación y método de pago."
        icon="💳"
        size="md"
      >
        <TabSuscripcion />
      </SettingDrawer>
    </>
  );
}