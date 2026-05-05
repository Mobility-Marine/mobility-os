"use client";

// ════════════════════════════════════════════════════════════════════════
// MI CUENTA — Categoría de Settings con configuración personal del usuario
// ════════════════════════════════════════════════════════════════════════
// Patrón: 1 card por concepto. La card "Mi perfil" reutiliza el componente
// TabPerfil existente dentro de un drawer lateral.
// ════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import SettingCard    from "../components/SettingCard";
import SettingDrawer  from "../components/SettingDrawer";
import TabPerfil      from "../tabs/TabPerfil";

type DrawerKey = null | "perfil";

export default function MiCuentaCategory() {
  const [openDrawer, setOpenDrawer] = useState<DrawerKey>(null);

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
          icon="👤"
          title="Mi perfil"
          description="Nombre, foto, correo electrónico y contraseña."
          onClick={() => setOpenDrawer("perfil")}
        />
      </div>

      {/* Drawer: Mi perfil */}
      <SettingDrawer
        open={openDrawer === "perfil"}
        onClose={() => setOpenDrawer(null)}
        title="Mi perfil"
        description="Datos personales y de acceso a tu cuenta."
        icon="👤"
        size="md"
      >
        <TabPerfil />
      </SettingDrawer>
    </>
  );
}