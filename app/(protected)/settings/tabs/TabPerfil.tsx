"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";

const INPUT: React.CSSProperties = {
  width: "100%", height: "38px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 24px", display: "grid", gap: "14px" }}>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", paddingBottom: "10px", borderBottom: "1px solid var(--color-border-faint)" }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "12px", alignItems: "center" }}>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

export default function TabPerfil() {
  const { t, lang, changeLanguage } = useTranslation();
  const { user }             = useAuth();
  const { companyId }        = useTenant();
  const fileRef              = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    full_name:    "",
    phone:        "",
    phone_mobile: "",
    job_title:    "",
    avatar_url:   "",
  });
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Password
  const [pwForm,   setPwForm]  = useState({ current: "", newPw: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError,  setPwError]  = useState<string | null>(null);
  const [pwSaved,  setPwSaved]  = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_profiles")
      .select("full_name, phone, phone_mobile, job_title, avatar_url")
      .eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setProfile({
          full_name:    data.full_name    ?? "",
          phone:        data.phone        ?? "",
          phone_mobile: data.phone_mobile ?? "",
          job_title:    data.job_title    ?? "",
          avatar_url:   data.avatar_url   ?? "",
        });
      });
  }, [user]);

  async function handleSaveProfile() {
    if (!user) return;
    setSaving(true); setError(null);
    try {
      await supabase.from("user_profiles").upsert({
        user_id:      user.id,
        full_name:    profile.full_name,
        phone:        profile.phone,
        phone_mobile: profile.phone_mobile || null,
        job_title:    profile.job_title    || null,
        avatar_url:   profile.avatar_url,
        updated_at:   new Date().toISOString(),
      }, { onConflict: "user_id" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext  = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("user-assets").upload(path, file, { upsert: true });
    if (uploadError) { setError(uploadError.message); return; }
    const { data } = supabase.storage.from("user-assets").getPublicUrl(path);
    setProfile((p) => ({ ...p, avatar_url: data.publicUrl }));
  }

  async function handleChangePassword() {
    if (!pwForm.newPw || pwForm.newPw !== pwForm.confirm) {
      setPwError("Las contraseñas no coinciden"); return;
    }
    if (pwForm.newPw.length < 8) {
      setPwError("Mínimo 8 caracteres"); return;
    }
    setPwSaving(true); setPwError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
      if (error) throw error;
      setPwSaved(true);
      setPwForm({ current: "", newPw: "", confirm: "" });
      setTimeout(() => setPwSaved(false), 2500);
    } catch (e: any) { setPwError(e.message); }
    finally { setPwSaving(false); }
  }

  const initials = (profile.full_name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>
        {(t.settings as any)?.tabPerfil ?? "Mi perfil"}
      </div>

      {/* FOTO + NOMBRE */}
      <Section title={(t.settings as any)?.profileInfo ?? "Información personal"}>
        {/* AVATAR */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: profile.avatar_url ? "transparent" : "var(--color-brand-blue)",
            overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid var(--color-border)",
          }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="avatar" />
              : <span style={{ fontSize: "24px", fontWeight: 800, color: "#fff" }}>{initials}</span>
            }
          </div>
          <div>
            <button onClick={() => fileRef.current?.click()} style={{
              height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)",
              background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
              color: "var(--color-text-second)", fontSize: "12px", fontWeight: 600, cursor: "pointer",
            }}>
              {(t.settings as any)?.changePhoto ?? "Cambiar foto"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              JPG, PNG o WebP. Máx. 2MB
            </div>
          </div>
        </div>

        <Field label={(t.settings as any)?.fullName ?? "Nombre completo"}>
          <input value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} placeholder="Alejandro Reyes" style={INPUT} />
        </Field>

        <Field label={(t.settings as any)?.jobTitle ?? "Puesto / Título profesional"}>
          <input
            value={profile.job_title}
            onChange={(e) => setProfile((p) => ({ ...p, job_title: e.target.value }))}
            placeholder="ej: Traffic and Logistics Manager / Lic. en Comercio Internacional"
            style={INPUT}
          />
        </Field>

        <Field label="Email">
          <input value={user?.email ?? ""} disabled style={{ ...INPUT, opacity: 0.6, cursor: "not-allowed" }} />
        </Field>

        <Field label={(t.settings as any)?.phone ?? "Teléfono fijo / oficina"}>
          <input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+52 449 123 4567" style={INPUT} />
        </Field>

        <Field label={(t.settings as any)?.phoneMobile ?? "Teléfono móvil"}>
          <input
            value={profile.phone_mobile}
            onChange={(e) => setProfile((p) => ({ ...p, phone_mobile: e.target.value }))}
            placeholder="+52 449 123 4567"
            style={INPUT}
          />
        </Field>

        {error && (
          <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "12px" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleSaveProfile} disabled={saving} style={{
            height: "36px", padding: "0 20px", borderRadius: "var(--radius-md)",
            background: saved ? "var(--color-success-text)" : "var(--color-brand-blue)",
            color: "#fff", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer",
          }}>
            {saving ? t.general.loading : saved ? "✓ Guardado" : t.general.save}
          </button>
        </div>
      </Section>

      {/* IDIOMA */}
      <Section title={(t.settings as any)?.languageTitle ?? "Idioma"}>
        <Field label={(t.settings as any)?.language ?? "Idioma del sistema"}>
          <div style={{ display: "flex", gap: "8px" }}>
            {(["es", "en"] as const).map((l) => (
              <button key={l} onClick={() => changeLanguage(l)} style={{
                height: "36px", padding: "0 20px", borderRadius: "var(--radius-md)",
                background: lang === l ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
                border: `1px solid ${lang === l ? "var(--color-brand-blue)" : "var(--color-border)"}`,
                color: lang === l ? "#fff" : "var(--color-text-second)",
                fontSize: "13px", fontWeight: lang === l ? 700 : 400, cursor: "pointer",
              }}>
                {l === "es" ? "🇲🇽 Español" : "🇺🇸 English"}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* CONTRASEÑA */}
      <Section title={(t.settings as any)?.passwordTitle ?? "Cambiar contraseña"}>
        <Field label={(t.settings as any)?.newPassword ?? "Nueva contraseña"}>
          <input type="password" value={pwForm.newPw} onChange={(e) => setPwForm((p) => ({ ...p, newPw: e.target.value }))} placeholder="••••••••" style={INPUT} />
        </Field>
        <Field label={(t.settings as any)?.confirmPassword ?? "Confirmar contraseña"}>
          <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" style={INPUT} />
        </Field>

        {pwError && (
          <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "12px" }}>
            {pwError}
          </div>
        )}
        {pwSaved && (
          <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontSize: "12px" }}>
            ✓ Contraseña actualizada correctamente
          </div>
        )}
        <div>
          <button onClick={handleChangePassword} disabled={pwSaving || !pwForm.newPw} style={{
            height: "36px", padding: "0 20px", borderRadius: "var(--radius-md)",
            background: "var(--color-brand-blue)", color: "#fff", border: "none",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
          }}>
            {pwSaving ? t.general.loading : (t.settings as any)?.updatePassword ?? "Actualizar contraseña"}
          </button>
        </div>
      </Section>
    </div>
  );
}
