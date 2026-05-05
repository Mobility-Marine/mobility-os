"use client";

// ════════════════════════════════════════════════════════════════════════
// DATOS E INTEGRACIONES — Placeholders visibles para roadmap del producto
// ════════════════════════════════════════════════════════════════════════
// Esta categoría muestra todas las integraciones planeadas como cards con
// el badge "Próximamente". Esto sirve dos propósitos:
//   1) Comunica el roadmap al usuario sin sorpresas.
//   2) Cuando una integración esté lista, solo cambiamos comingSoon=false
//      y conectamos el drawer correspondiente.
//
// Roadmap activo (al 5 may 2026):
//   - Importación masiva: parcial (Partners ya tiene importer)
//   - Email Brevo: SMTP configurado, pendiente activación cuenta
//   - Calendarios externos: pendiente OAuth Google/Outlook/Apple
//   - API Keys: pendiente sistema de tokens
// ════════════════════════════════════════════════════════════════════════

import SettingCard from "../components/SettingCard";

export default function IntegracionesCategory() {
  return (
    <div
      style={{
        display:             "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap:                 "16px",
      }}
    >
      <SettingCard
        icon="📥"
        title="Importación masiva"
        description="Sube clientes, proveedores, productos y catálogos vía CSV o Excel."
        comingSoon
      />
      <SettingCard
        icon="📤"
        title="Exportación de datos"
        description="Descarga respaldos completos, reportes históricos y estados de cuenta."
        comingSoon
      />
      <SettingCard
        icon="📧"
        title="Email transaccional"
        description="Envío automático de cotizaciones, facturas y avisos vía Brevo SMTP."
        comingSoon
      />
      <SettingCard
        icon="📅"
        title="Calendarios externos"
        description="Sincroniza eventos con Google Calendar, Outlook y Apple Calendar."
        comingSoon
      />
      <SettingCard
        icon="🔑"
        title="API Keys"
        description="Tokens para conectar Mobility OS con tus sistemas internos."
        comingSoon
      />
    </div>
  );
}