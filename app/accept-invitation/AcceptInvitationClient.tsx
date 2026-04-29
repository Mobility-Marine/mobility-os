"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

// ============================================================
//   Página pública /accept-invitation?token=xxx
//   Flujo profesional tipo Slack/Notion:
//   - Valida token y estados (cancelled/expired/accepted)
//   - Si el usuario NO tiene cuenta: signup en línea con nombre + password
//   - Si el usuario YA tiene cuenta y está logueado: confirma y une
//   - Si está logueado pero con OTRO email: ofrece cambiar de cuenta
//
//   IMPORTANTE: usa RPCs `get_invitation_info` y `accept_invitation` con
//   SECURITY DEFINER para evitar bloqueos por RLS en el flujo público.
// ============================================================

type InvitationInfo = {
  email:        string;
  role:         string;
  status:       "pending" | "cancelled" | "accepted" | string;
  expires_at:   string;
  company_id:   string;
  company_name: string;
};

type Phase =
  | "loading"
  | "error"
  | "needs_signup"
  | "needs_login"
  | "confirm"
  | "joining"
  | "success";

const ROLE_LABELS: Record<string, string> = {
  admin:     "Administrador",
  manager:   "Gerente",
  comercial: "Comercial",
  logistica: "Logística",
  finanzas:  "Finanzas",
  compras:   "Compras",
  user:      "Usuario",
  viewer:    "Solo lectura",
};

export default function AcceptInvitationClient() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [phase,        setPhase]        = useState<Phase>("loading");
  const [errorMsg,     setErrorMsg]     = useState<string>("");
  const [invitation,   setInvitation]   = useState<InvitationInfo | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string>("");

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [busy,     setBusy]     = useState(false);
  const [formErr,  setFormErr]  = useState<string>("");

  // ───────── Cargar invitación + sesión actual ─────────
  const loadInvitation = useCallback(async () => {
    if (!token) {
      setPhase("error");
      setErrorMsg("El enlace de invitación no es válido — falta el token.");
      return;
    }

    // Usar RPC pública que bypasa RLS de forma controlada
    const { data, error } = await supabase
      .rpc("get_invitation_info", { p_token: token });

    if (error) {
      setPhase("error");
      setErrorMsg(`No pudimos verificar la invitación. Intenta de nuevo en un momento.`);
      return;
    }

    const inv: InvitationInfo | null = (data && data[0]) ?? null;

    if (!inv) {
      setPhase("error");
      setErrorMsg("Esta invitación no existe o el enlace está dañado.");
      return;
    }

    if (inv.status === "cancelled") {
      setPhase("error");
      setErrorMsg("Esta invitación fue cancelada por el administrador. Pídele que te envíe una nueva.");
      return;
    }
    if (inv.status === "accepted") {
      setPhase("error");
      setErrorMsg("Esta invitación ya fue aceptada. Si eres tú, inicia sesión normalmente.");
      return;
    }
    if (inv.status !== "pending") {
      setPhase("error");
      setErrorMsg("Esta invitación no está disponible.");
      return;
    }

    if (new Date(inv.expires_at) < new Date()) {
      setPhase("error");
      setErrorMsg("Esta invitación ya expiró. Pídele al administrador que te envíe una nueva.");
      return;
    }

    setInvitation(inv);

    // Pre-llenar nombre con la parte local del email (mejor UX)
    const localPart = inv.email.split("@")[0].replace(/[._-]/g, " ");
    setFullName(localPart.replace(/\b\w/g, l => l.toUpperCase()));

    // ¿Hay sesión activa?
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setPhase("needs_signup");
      return;
    }

    setCurrentEmail(user.email ?? "");

    if ((user.email ?? "").toLowerCase() !== inv.email.toLowerCase()) {
      setPhase("error");
      setErrorMsg(`Esta invitación es para ${inv.email}, pero estás conectado como ${user.email}. Cierra sesión y entra con la cuenta correcta.`);
      return;
    }

    setPhase("confirm");
  }, [token]);

  useEffect(() => { loadInvitation(); }, [loadInvitation]);

  // ───────── Crear cuenta nueva ─────────
  async function handleSignup() {
    if (!invitation) return;
    if (!fullName.trim())      { setFormErr("Escribe tu nombre completo"); return; }
    if (password.length < 8)   { setFormErr("La contraseña debe tener al menos 8 caracteres"); return; }
    setFormErr(""); setBusy(true);

    const { data, error } = await supabase.auth.signUp({
      email:    invitation.email,
      password: password,
      options:  { data: { full_name: fullName.trim() } },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        setBusy(false);
        setPhase("needs_login");
        setFormErr("Ya existe una cuenta con este correo. Inicia sesión para continuar.");
        return;
      }
      setBusy(false);
      setFormErr(error.message);
      return;
    }

    if (!data.user) {
      setBusy(false);
      setFormErr("No se pudo crear la cuenta. Intenta de nuevo.");
      return;
    }

    // Verificar si Supabase requiere confirmar email antes de poder usar la cuenta
    if (!data.session) {
      // Registro creado pero sin sesión activa: probablemente requiere confirmación.
      // Intentamos login directo (en proyectos sin email confirmation activado, funciona).
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email:    invitation.email,
        password: password,
      });
      if (loginErr) {
        setBusy(false);
        setPhase("error");
        setErrorMsg("Tu cuenta fue creada. Revisa tu correo para confirmarla y vuelve a abrir el enlace de invitación.");
        return;
      }
    }

    await joinCompany(fullName.trim());
  }

  // ───────── Iniciar sesión ─────────
  async function handleLogin() {
    if (!invitation) return;
    if (!password)   { setFormErr("Escribe tu contraseña"); return; }
    setFormErr(""); setBusy(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email:    invitation.email,
      password: password,
    });

    if (error) {
      setBusy(false);
      setFormErr("Correo o contraseña incorrectos");
      return;
    }

    if (!data.user) {
      setBusy(false);
      setFormErr("No se pudo iniciar sesión");
      return;
    }

    await joinCompany(fullName.trim() || data.user.email!.split("@")[0]);
  }

  // ───────── Confirmar (usuario ya logueado con email correcto) ─────────
  async function handleConfirm() {
    if (!invitation) return;
    setBusy(true);
    await joinCompany(fullName.trim() || currentEmail.split("@")[0]);
  }

  // ───────── Operación común: llamar la RPC accept_invitation ─────────
  async function joinCompany(name: string) {
    if (!invitation || !token) return;
    setPhase("joining");

    const { data, error } = await supabase.rpc("accept_invitation", {
      p_token:     token,
      p_full_name: name,
    });

    if (error) {
      setPhase("error");
      setErrorMsg(error.message ?? "No se pudo completar la invitación");
      return;
    }

    if (!data?.success) {
      setPhase("error");
      setErrorMsg("La operación no se completó. Intenta de nuevo.");
      return;
    }

    setPhase("success");
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  // ───────── Cerrar sesión (cuando el email no coincide) ─────────
  async function handleSignOut() {
    await supabase.auth.signOut();
    setCurrentEmail("");
    setPhase("loading");
    setErrorMsg("");
    loadInvitation();
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.brandHeader}>
          <div style={S.brandTitle}>Mobility OS</div>
          <div style={S.brandSubtitle}>Sistema operativo empresarial</div>
        </div>

        <div style={S.body}>
          {phase === "loading" && <Loading />}
          {phase === "error"   && <ErrorBlock message={errorMsg} onLogin={() => router.push("/login")} />}
          {phase === "joining" && <Loading text="Uniéndote a la empresa…" />}
          {phase === "success" && <SuccessBlock companyName={invitation?.company_name ?? ""} />}

          {(phase === "needs_signup" || phase === "needs_login") && invitation && (
            <SignupOrLogin
              mode={phase}
              invitation={invitation}
              fullName={fullName}
              password={password}
              busy={busy}
              formErr={formErr}
              setFullName={setFullName}
              setPassword={setPassword}
              switchMode={() => { setFormErr(""); setPhase(phase === "needs_signup" ? "needs_login" : "needs_signup"); }}
              onSignup={handleSignup}
              onLogin={handleLogin}
            />
          )}

          {phase === "confirm" && invitation && (
            <ConfirmBlock
              invitation={invitation}
              currentEmail={currentEmail}
              fullName={fullName}
              setFullName={setFullName}
              busy={busy}
              onConfirm={handleConfirm}
              onSignOut={handleSignOut}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
//                  Sub-componentes presentación
// ============================================================

function Loading({ text = "Cargando invitación…" }: { text?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={S.spinner} />
      <div style={{ marginTop: 14, fontSize: 14, color: "#64748b" }}>{text}</div>
    </div>
  );
}

function ErrorBlock({ message, onLogin }: { message: string; onLogin: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "10px 20px 30px" }}>
      <div style={S.errorIcon}>!</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginTop: 16, marginBottom: 8 }}>
        No se pudo continuar
      </div>
      <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, marginBottom: 24 }}>{message}</div>
      <button onClick={onLogin} style={S.btnSecondary}>Ir a iniciar sesión</button>
    </div>
  );
}

function SuccessBlock({ companyName }: { companyName: string }) {
  return (
    <div style={{ textAlign: "center", padding: "10px 20px 30px" }}>
      <div style={S.successIcon}>✓</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginTop: 16, marginBottom: 8 }}>
        ¡Bienvenido a {companyName}!
      </div>
      <div style={{ fontSize: 13, color: "#475569" }}>Redirigiendo al panel…</div>
    </div>
  );
}

function SignupOrLogin(props: {
  mode: "needs_signup" | "needs_login";
  invitation: InvitationInfo;
  fullName: string;
  password: string;
  busy: boolean;
  formErr: string;
  setFullName: (v: string) => void;
  setPassword: (v: string) => void;
  switchMode: () => void;
  onSignup: () => void;
  onLogin: () => void;
}) {
  const { mode, invitation, fullName, password, busy, formErr, setFullName, setPassword, switchMode, onSignup, onLogin } = props;
  const isSignup = mode === "needs_signup";
  const role = ROLE_LABELS[invitation.role] ?? invitation.role;

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
        Has sido invitado a {invitation.company_name}
      </div>
      <div style={{ fontSize: 13, color: "#475569", marginBottom: 20 }}>
        Te invitaron como <strong>{role}</strong>. {isSignup ? "Crea tu cuenta para continuar." : "Inicia sesión para aceptar."}
      </div>

      <div style={S.field}>
        <label style={S.label}>Correo electrónico</label>
        <input value={invitation.email} readOnly style={{ ...S.input, background: "#f1f5f9", color: "#64748b" }} />
      </div>

      {isSignup && (
        <div style={S.field}>
          <label style={S.label}>Nombre completo</label>
          <input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Ej: María González"
            style={S.input}
            autoFocus
          />
        </div>
      )}

      <div style={S.field}>
        <label style={S.label}>Contraseña {isSignup && "(mínimo 8 caracteres)"}</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={isSignup ? "Crea una contraseña segura" : "Tu contraseña"}
          style={S.input}
          autoFocus={!isSignup}
          onKeyDown={e => { if (e.key === "Enter" && !busy) (isSignup ? onSignup() : onLogin()); }}
        />
      </div>

      {formErr && <div style={S.formError}>{formErr}</div>}

      <button
        onClick={isSignup ? onSignup : onLogin}
        disabled={busy}
        style={{ ...S.btnPrimary, marginTop: 14, opacity: busy ? 0.6 : 1, cursor: busy ? "wait" : "pointer" }}
      >
        {busy ? "Procesando…" : (isSignup ? "Crear cuenta y unirme" : "Iniciar sesión y unirme")}
      </button>

      <div style={{ textAlign: "center", marginTop: 14 }}>
        <button onClick={switchMode} style={S.btnLink}>
          {isSignup ? "Ya tengo cuenta — iniciar sesión" : "No tengo cuenta — crear una"}
        </button>
      </div>
    </div>
  );
}

function ConfirmBlock(props: {
  invitation: InvitationInfo;
  currentEmail: string;
  fullName: string;
  setFullName: (v: string) => void;
  busy: boolean;
  onConfirm: () => void;
  onSignOut: () => void;
}) {
  const { invitation, currentEmail, fullName, setFullName, busy, onConfirm, onSignOut } = props;
  const role = ROLE_LABELS[invitation.role] ?? invitation.role;

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
        Únete a {invitation.company_name}
      </div>
      <div style={{ fontSize: 13, color: "#475569", marginBottom: 20 }}>
        Estás conectado como <strong>{currentEmail}</strong>. Te invitaron como <strong>{role}</strong>.
      </div>

      <div style={S.field}>
        <label style={S.label}>Nombre completo (puedes editarlo)</label>
        <input
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Tu nombre"
          style={S.input}
        />
      </div>

      <button
        onClick={onConfirm}
        disabled={busy}
        style={{ ...S.btnPrimary, marginTop: 14, opacity: busy ? 0.6 : 1, cursor: busy ? "wait" : "pointer" }}
      >
        {busy ? "Procesando…" : `Unirme a ${invitation.company_name}`}
      </button>

      <div style={{ textAlign: "center", marginTop: 14 }}>
        <button onClick={onSignOut} style={S.btnLink}>
          ¿Esta no es tu cuenta? Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ============================================================
//                          Estilos
// ============================================================
const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    padding: "20px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    background: "#ffffff",
    borderRadius: 16,
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
    overflow: "hidden",
  },
  brandHeader: {
    background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
    padding: "28px 30px",
    color: "#ffffff",
    textAlign: "center",
  },
  brandTitle:    { fontSize: 22, fontWeight: 900, letterSpacing: 1 },
  brandSubtitle: { fontSize: 11, fontWeight: 500, marginTop: 4, opacity: 0.85, textTransform: "uppercase", letterSpacing: 1 },
  body:          { padding: "28px 30px" },

  field: { marginBottom: 14 },
  label: { display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    width: "100%", height: 40, padding: "0 12px",
    borderRadius: 8, border: "1px solid #cbd5e1",
    background: "#ffffff", color: "#0f172a",
    fontSize: 14, outline: "none", boxSizing: "border-box",
  },
  formError: {
    padding: "10px 12px", borderRadius: 8,
    background: "#fef2f2", border: "1px solid #fecaca",
    color: "#b91c1c", fontSize: 12, marginTop: 6,
  },
  btnPrimary: {
    width: "100%", height: 44, borderRadius: 10,
    background: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
    color: "#ffffff", border: "none",
    fontSize: 14, fontWeight: 700, cursor: "pointer",
  },
  btnSecondary: {
    height: 40, padding: "0 18px", borderRadius: 8,
    background: "#1e40af", color: "#ffffff", border: "none",
    fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
  btnLink: {
    background: "transparent", border: "none",
    color: "#2563eb", fontSize: 12, cursor: "pointer",
    textDecoration: "underline",
  },
  spinner: {
    width: 36, height: 36, margin: "0 auto",
    border: "3px solid #e2e8f0", borderTopColor: "#2563eb",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },
  errorIcon: {
    width: 56, height: 56, borderRadius: "50%",
    background: "#fef2f2", color: "#dc2626",
    display: "grid", placeItems: "center", margin: "0 auto",
    fontSize: 28, fontWeight: 900, border: "2px solid #fecaca",
  },
  successIcon: {
    width: 56, height: 56, borderRadius: "50%",
    background: "#dcfce7", color: "#16a34a",
    display: "grid", placeItems: "center", margin: "0 auto",
    fontSize: 28, fontWeight: 900, border: "2px solid #bbf7d0",
  },
};
