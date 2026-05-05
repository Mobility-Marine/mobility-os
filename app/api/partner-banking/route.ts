// ════════════════════════════════════════════════════════════════════════
// API: POST /api/partner-banking
// ════════════════════════════════════════════════════════════════════════
// CRUD para datos bancarios de partners con encriptación AES-256-GCM.
//
// Acciones (action en el body):
//   - "list":   { companyId, partnerId } → lista bancos (decrypta campos sensibles)
//   - "save":   { companyId, partnerId, banking }   → insert o update
//   - "delete": { companyId, bankingId }            → elimina
//
// Encriptación:
//   - Algoritmo: AES-256-GCM
//   - Clave: BANKING_ENCRYPTION_KEY del .env (64 chars hex = 32 bytes)
//   - Formato bytea: [IV (12B)] + [ciphertext] + [authTag (16B)]
//   - IV aleatorio por cada encriptación (nunca reutilizado)
//
// Seguridad:
//   - Las claves nunca se exponen al cliente
//   - Usa SUPABASE_SERVICE_ROLE_KEY (consistente con resto del proyecto)
//   - Si BANKING_ENCRYPTION_KEY no está configurada, el endpoint falla
//     con instrucción clara
// ════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from "crypto";

const ALGO    = "aes-256-gcm";
const IV_LEN  = 12; // GCM standard
const TAG_LEN = 16; // GCM auth tag

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Tipos ────────────────────────────────────────────────────────────
type BankingPayload = {
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
};

// ── Helpers de cripto ────────────────────────────────────────────────
function getEncryptionKey(): Buffer {
  const hex = process.env.BANKING_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "BANKING_ENCRYPTION_KEY no configurada o inválida. Debe ser 64 caracteres hex (32 bytes). " +
      "Genérala con: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return Buffer.from(hex, "hex");
}

function encryptText(plaintext: string | undefined | null): Buffer | null {
  if (!plaintext) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const key = getEncryptionKey() as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iv  = randomBytes(IV_LEN) as any;
  const cipher  = createCipheriv(ALGO, key, iv);
  const cipherT = Buffer.concat([cipher.update(plaintext, "utf8") as any, cipher.final() as any]);
  const authTag = cipher.getAuthTag();
  // Formato: [IV][cipherText][authTag]
  return Buffer.concat([iv, cipherT as any, authTag as any]);
}

function decryptText(blob: Buffer | null | undefined): string | null {
  if (!blob || blob.length < IV_LEN + TAG_LEN) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const key      = getEncryptionKey() as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iv       = blob.subarray(0, IV_LEN) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tag      = blob.subarray(blob.length - TAG_LEN) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cipherT  = blob.subarray(IV_LEN, blob.length - TAG_LEN) as any;
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(cipherT) as any, decipher.final() as any]);
    return plain.toString("utf8");
  } catch {
    return null;
  }
}

// Convierte el formato hex/bytea de Supabase (\x...) a Buffer
function pgByteaToBuffer(value: unknown): Buffer | null {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === "string") {
    if (value.startsWith("\\x")) return Buffer.from(value.slice(2), "hex");
    return Buffer.from(value, "hex");
  }
  return null;
}

// Convierte Buffer al formato hex \x... que Supabase entiende para bytea
function bufferToPgBytea(buf: Buffer | null): string | null {
  if (!buf) return null;
  return "\\x" + buf.toString("hex");
}

// ── Helpers de respuesta ──────────────────────────────────────────────
function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}
function ok(data: unknown) {
  return NextResponse.json({ ok: true, ...((data as object) ?? {}) });
}

// ── Handler principal ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: { action?: string; companyId?: string; partnerId?: string; bankingId?: string; banking?: BankingPayload };
  try {
    body = await req.json();
  } catch {
    return bad("Body inválido. Se esperaba JSON.");
  }

  const { action, companyId } = body;
  if (!action)    return bad("action es requerido (list | save | delete).");
  if (!companyId) return bad("companyId es requerido.");

  // Validar que la key existe ANTES de cualquier operación
  try {
    getEncryptionKey();
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }

  // ── LIST ──────────────────────────────────────────────────────────
  if (action === "list") {
    if (!body.partnerId) return bad("partnerId es requerido para list.");

    const { data, error } = await supabaseAdmin
      .from("partner_banking")
      .select(
        "id, company_id, partner_id, bank_name, account_holder, account_type, currency, swift_code, alias, is_default, is_active, notes, account_number_encrypted, clabe_encrypted, iban_encrypted, created_at, updated_at",
      )
      .eq("company_id", companyId)
      .eq("partner_id", body.partnerId)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) return bad(error.message, 500);

    // Decriptar campos sensibles
    const list = (data ?? []).map((row: Record<string, unknown>) => {
      const accBuf  = pgByteaToBuffer(row.account_number_encrypted);
      const clabBuf = pgByteaToBuffer(row.clabe_encrypted);
      const ibanBuf = pgByteaToBuffer(row.iban_encrypted);
      return {
        id:             row.id,
        bank_name:      row.bank_name,
        account_holder: row.account_holder,
        account_type:   row.account_type,
        currency:       row.currency,
        swift_code:     row.swift_code,
        alias:          row.alias,
        is_default:     row.is_default,
        is_active:      row.is_active,
        notes:          row.notes,
        account_number: decryptText(accBuf),
        clabe:          decryptText(clabBuf),
        iban:           decryptText(ibanBuf),
        created_at:     row.created_at,
        updated_at:     row.updated_at,
      };
    });

    return ok({ banking: list });
  }

  // ── SAVE (insert o update) ────────────────────────────────────────
  if (action === "save") {
    if (!body.partnerId || !body.banking) {
      return bad("partnerId y banking son requeridos para save.");
    }
    const b = body.banking;
    if (!b.bank_name || !b.account_holder) {
      return bad("bank_name y account_holder son obligatorios.");
    }

    // Encriptar campos sensibles
    const accountEncBuf = encryptText(b.account_number);
    const clabeEncBuf   = encryptText(b.clabe);
    const ibanEncBuf    = encryptText(b.iban);

    // Si se marca is_default, desmarcar los demás del mismo partner
    if (b.is_default) {
      await supabaseAdmin
        .from("partner_banking")
        .update({ is_default: false })
        .eq("company_id", companyId)
        .eq("partner_id", body.partnerId);
    }

    const dbPayload: Record<string, unknown> = {
      company_id:               companyId,
      partner_id:               body.partnerId,
      bank_name:                b.bank_name,
      account_holder:           b.account_holder,
      account_type:             b.account_type   ?? null,
      currency:                 b.currency       ?? "MXN",
      swift_code:               b.swift_code     ?? null,
      alias:                    b.alias          ?? null,
      is_default:               b.is_default     ?? false,
      is_active:                b.is_active      ?? true,
      notes:                    b.notes          ?? null,
      account_number_encrypted: bufferToPgBytea(accountEncBuf),
      clabe_encrypted:          bufferToPgBytea(clabeEncBuf),
      iban_encrypted:           bufferToPgBytea(ibanEncBuf),
      updated_at:               new Date().toISOString(),
    };

    if (b.id) {
      // UPDATE
      const { data, error } = await supabaseAdmin
        .from("partner_banking")
        .update(dbPayload)
        .eq("id", b.id)
        .eq("company_id", companyId)
        .select("id")
        .single();
      if (error) return bad(error.message, 500);
      return ok({ id: (data as { id: string }).id });
    } else {
      // INSERT
      const { data, error } = await supabaseAdmin
        .from("partner_banking")
        .insert(dbPayload)
        .select("id")
        .single();
      if (error) return bad(error.message, 500);
      return ok({ id: (data as { id: string }).id });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────
  if (action === "delete") {
    if (!body.bankingId) return bad("bankingId es requerido para delete.");
    const { error } = await supabaseAdmin
      .from("partner_banking")
      .delete()
      .eq("id", body.bankingId)
      .eq("company_id", companyId);
    if (error) return bad(error.message, 500);
    return ok({ deleted: true });
  }

  return bad(`Acción no soportada: ${action}`);
}