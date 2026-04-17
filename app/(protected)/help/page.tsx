"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

type HelpSection = "guia" | "atajos" | "soporte" | "changelog";

const MODULES_GUIDE = [
  { icon: "📊", name: "Dashboard", desc: "Vista ejecutiva de toda la operación en tiempo real. Muestra alertas, KPIs y acceso rápido a los módulos críticos." },
  { icon: "📅", name: "Agenda", desc: "Calendario de actividades, reuniones y seguimientos. Se conectará con Google/Outlook Calendar próximamente." },
  { icon: "🎯", name: "Prospectos", desc: "Pipeline visual de oportunidades comerciales. Arrastra tarjetas entre etapas, registra actividades y genera cotizaciones directamente." },
  { icon: "📋", name: "Cotizaciones", desc: "Genera cotizaciones profesionales en PDF con tus colores de marca. Convierte cotizaciones aprobadas en pedidos o facturas." },
  { icon: "👥", name: "Clientes / CRM", desc: "Gestión de clientes, historial de operaciones, documentos y contactos. El corazón del Customer 360." },
  { icon: "🚢", name: "Logística / Embarques", desc: "Seguimiento de embarques, proveedores logísticos, documentación y facturación automática al entregar." },
  { icon: "🏭", name: "Abastecimiento", desc: "Control de proveedores, órdenes de compra, recepciones e inventario centralizado." },
  { icon: "🧾", name: "Facturación", desc: "Emisión de CFDI 4.0 (facturas, notas de crédito, complementos de pago, nómina). Conectado con Facturapi y el SAT." },
  { icon: "📥", name: "CXC — Cuentas por Cobrar", desc: "Cartera de clientes con aging, seguimiento de cobranza y sincronización automática con CFDIs." },
  { icon: "📤", name: "CXP — Cuentas por Pagar", desc: "Obligaciones con proveedores, facturas recibidas, programación de pagos." },
  { icon: "🏦", name: "Bancos / Tesorería", desc: "Cuentas bancarias, movimientos, conciliación y posición de efectivo en tiempo real." },
  { icon: "💧", name: "Flujo de Efectivo", desc: "Posición actual, histórico 6 meses y proyección a 90 días. Separado por moneda." },
  { icon: "🏛️", name: "Activos Fijos", desc: "Catálogo de activos, depreciación automática (línea recta, doble saldo, suma de dígitos), bajas y valor en libros." },
  { icon: "📒", name: "Contabilidad", desc: "Estado de resultados, balance general, libro diario e indicadores financieros. ISR dinámico según régimen fiscal." },
  { icon: "🧾", name: "Impuestos", desc: "Posición fiscal mensual, declaración de IVA, ISR provisional por régimen. Registro de pagos al SAT." },
  { icon: "👥", name: "Empleados / Nómina", desc: "Expedientes, cálculo de nómina (IMSS, ISR, INFONAVIT), recibos PDF y timbrado de CFDI de nómina." },
  { icon: "📊", name: "Reportes", desc: "Métricas ejecutivas consolidadas por período. Exportación a CSV." },
  { icon: "⚙️", name: "Configuración", desc: "Datos fiscales, logo, colores de marca, régimen fiscal, usuarios, invitaciones y sellos SAT." },
];

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], desc: "Abrir Command Hub (IA)" },
  { keys: ["Esc"],       desc: "Cerrar drawers y modales" },
  { keys: ["Enter"],     desc: "Confirmar en formularios" },
];

const CHANGELOG = [
  { version: "2.1", date: "Abr 2026", items: ["Módulo de Empleados con nómina completa (IMSS, ISR, INFONAVIT, catorcenal)", "CFDI de Nómina timbrado vía Facturapi (Complemento Nómina 1.2)", "Recibo de nómina PDF descargable por empleado y lote ZIP", "Activos Fijos con depreciación automática y tabla completa SAT", "Impuestos multi-régimen (Moral, PFAE, RESICO PM/PF)", "Módulo de Reportes ejecutivos con exportación CSV"] },
  { version: "2.0", date: "Mar 2026", items: ["Facturación CFDI 4.0 con Facturapi en producción", "CXC y CXP separados por moneda (MXN/USD)", "Bancos y Tesorería con triggers automáticos", "Flujo de Efectivo con proyección 90 días", "Contabilidad: Estado de Resultados, Balance General, Libro Diario", "Activos Fijos conectados al Balance General"] },
  { version: "1.5", date: "Feb 2026", items: ["Pipeline visual de prospectos", "Módulo logístico completo con embarques", "Cotizaciones PDF con colores de marca", "Command Hub con IA integrada", "Multi-tenant con cambio de empresa en tiempo real"] },
];

export default function HelpPage() {
  const { lang } = useTranslation();
  const es = lang !== "en";
  const [section, setSection] = useState<HelpSection>("guia");
  const [search, setSearch]   = useState("");

  const filteredModules = MODULES_GUIDE.filter(m =>
    search.length < 2 ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.desc.toLowerCase().includes(search.toLowerCase())
  );

  const SECTIONS: { key: HelpSection; label: string; icon: string }[] = [
    { key: "guia",      label: es ? "Guía de módulos"  : "Module guide",      icon: "📖" },
    { key: "atajos",    label: es ? "Atajos"           : "Shortcuts",         icon: "⌨️" },
    { key: "soporte",   label: es ? "Soporte"          : "Support",           icon: "💬" },
    { key: "changelog", label: es ? "Novedades"        : "What's new",        icon: "🚀" },
  ];

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px", minHeight: "100vh" }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
          💬 {es ? "Centro de ayuda" : "Help center"}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
          {es ? "Documentación, atajos y novedades de Mobility OS." : "Documentation, shortcuts and what's new in Mobility OS."}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--color-border-faint)" }}>
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setSection(s.key)}
            style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md) var(--radius-md) 0 0", background: section === s.key ? "var(--color-bg-base)" : "transparent", border: section === s.key ? "1px solid var(--color-border-faint)" : "none", borderBottom: section === s.key ? "1px solid var(--color-bg-base)" : "none", color: section === s.key ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: section === s.key ? 700 : 400, cursor: "pointer", marginBottom: section === s.key ? "-1px" : "0" }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Guía de módulos */}
      {section === "guia" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={es ? "Buscar módulo…" : "Search module…"}
            style={{ height: "36px", padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "13px", outline: "none", width: "280px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))", gap: "10px" }}>
            {filteredModules.map(m => (
              <div key={m.name} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px 18px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                  {m.icon}
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>{m.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Atajos */}
      {section === "atajos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "600px" }}>
          <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--color-border-faint)", background: "var(--color-bg-subtle)", fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {es ? "Atajos de teclado" : "Keyboard shortcuts"}
            </div>
            {SHORTCUTS.map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: i < SHORTCUTS.length - 1 ? "1px solid var(--color-border-faint)" : "none" }}>
                <span style={{ fontSize: "13px", color: "var(--color-text-second)" }}>{s.desc}</span>
                <div style={{ display: "flex", gap: "4px" }}>
                  {s.keys.map(k => (
                    <kbd key={k} style={{ padding: "3px 8px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", fontSize: "11px", fontFamily: "monospace", color: "var(--color-text-primary)", fontWeight: 600 }}>
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Soporte */}
      {section === "soporte" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "14px", maxWidth: "900px" }}>
          {[
            { icon: "💬", title: "Chat con IA", desc: "Usa el Command Hub (Ctrl+K) para preguntar cualquier cosa sobre el sistema, generar reportes o ejecutar acciones.", action: es ? "Abrir Command Hub" : "Open Command Hub", href: null },
            { icon: "📧", title: "Soporte por email", desc: "¿Tienes un problema técnico o una sugerencia? Contáctanos directamente.", action: "soporte@mobility-os.com", href: "mailto:soporte@mobility-os.com" },
            { icon: "📚", title: "Documentación", desc: "Guía completa de todos los módulos, APIs y configuraciones avanzadas.", action: es ? "Ver documentación" : "View docs", href: "https://docs.mobility-os.com" },
            { icon: "🐛", title: es ? "Reportar un bug" : "Report a bug", desc: es ? "Encontraste algo que no funciona bien. Ayúdanos a mejorarlo." : "Found something that doesn't work. Help us improve.", action: "GitHub Issues", href: "https://github.com/Mobility-Marine/mobility-os/issues" },
          ].map(c => (
            <div key={c.title} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ fontSize: "28px" }}>{c.icon}</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "6px" }}>{c.title}</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>{c.desc}</div>
              </div>
              {c.href ? (
                <a href={c.href} target="_blank" rel="noreferrer"
                  style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-brand-blue)", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                  {c.action} →
                </a>
              ) : (
                <button onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
                  style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" }}>
                  {c.action}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Changelog */}
      {section === "changelog" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
          {CHANGELOG.map(v => (
            <div key={v.version} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <div style={{ padding: "12px 20px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, padding: "2px 8px", borderRadius: "var(--radius-full)", background: "var(--color-brand-blue)", color: "#fff" }}>
                  v{v.version}
                </span>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{v.date}</span>
              </div>
              <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {v.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "var(--color-text-second)" }}>
                    <span style={{ color: "var(--color-success-text)", flexShrink: 0, marginTop: "1px" }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
