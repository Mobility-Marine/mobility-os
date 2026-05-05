// ════════════════════════════════════════════════════════════════════════
// PARTNER BANKING SERVICE — Wrapper del endpoint /api/partner-banking
// ════════════════════════════════════════════════════════════════════════
// Las claves bancarias (CLABE, cuenta, IBAN) NUNCA pasan por Supabase
// directo del cliente — siempre van por el endpoint para encriptarse
// con AES-256-GCM en el servidor.
// ════════════════════════════════════════════════════════════════════════

// ── Tipo del banking en el cliente (plaintext) ────────────────────────
export type PartnerBanking = {
  id?:              string;
  bank_name:        string;
  account_holder:   string;
  account_type?:    string;
  currency?:        string;
  swift_code?:      string;
  alias?:           string;
  is_default?:      boolean;
  is_active?:       boolean;
  notes?:           string;
  // Campos sensibles (plaintext en el wire, encriptados en BD):
  account_number?:  string;
  clabe?:           string;
  iban?:            string;
  // Tracking local (modo wizard):
  _localId?:        string;
  _isDirty?:        boolean;
  _isDeleted?:      boolean;
};

// ── Helper: POST al endpoint ─────────────────────────────────────────
async function callBankingAPI(payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string; banking?: PartnerBanking[]; id?: string; deleted?: boolean }> {
  const res = await fetch("/api/partner-banking", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error ?? `Error ${res.status} en /api/partner-banking`);
  }
  return data;
}

// ── Listar bancos del partner (decrypta los sensibles) ───────────────
export async function listPartnerBanking(
  companyId: string,
  partnerId: string,
): Promise<PartnerBanking[]> {
  const data = await callBankingAPI({ action: "list", companyId, partnerId });
  return data.banking ?? [];
}

// ── Guardar uno (insert o update) ────────────────────────────────────
export async function savePartnerBanking(
  companyId: string,
  partnerId: string,
  banking: PartnerBanking,
): Promise<string> {
  // Limpiar campos solo-frontend antes de enviar
  const { _localId, _isDirty, _isDeleted, ...clean } = banking;
  const data = await callBankingAPI({ action: "save", companyId, partnerId, banking: clean });
  return data.id ?? "";
}

// ── Eliminar uno ──────────────────────────────────────────────────────
export async function deletePartnerBanking(
  companyId: string,
  bankingId: string,
): Promise<void> {
  await callBankingAPI({ action: "delete", companyId, bankingId });
}

// ── Sincronizar diff (al guardar el wizard en modo EDIT) ─────────────
// Aplica insert/update/delete según los flags _isDirty/_isDeleted/id.
// Retorna la lista actualizada.
export async function syncBankingDiff(
  companyId: string,
  partnerId: string,
  banking: PartnerBanking[],
): Promise<PartnerBanking[]> {
  // 1. Eliminar los marcados con id
  for (const b of banking) {
    if (b._isDeleted && b.id) {
      await deletePartnerBanking(companyId, b.id);
    }
  }

  // 2. Insertar/actualizar los modificados
  for (const b of banking) {
    if (b._isDeleted) continue;
    if (!b.id || b._isDirty) {
      await savePartnerBanking(companyId, partnerId, b);
    }
  }

  // 3. Releer
  return listPartnerBanking(companyId, partnerId);
}

// ── Insert masivo (modo CREATE del partner) ──────────────────────────
export async function bulkInsertBanking(
  companyId: string,
  partnerId: string,
  banking: PartnerBanking[],
): Promise<void> {
  for (const b of banking) {
    if (b._isDeleted) continue;
    if (!b.bank_name || !b.account_holder) continue;
    await savePartnerBanking(companyId, partnerId, b);
  }
}