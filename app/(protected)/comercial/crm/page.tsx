"use client";

// ===== INICIO IMPORTS =====
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";
// ===== FIN IMPORTS =====


// ===== INICIO TYPES =====
type CrmAccount = {
  id: string;
  company_id: string;
  name: string;
  legal_name: string | null;
  industry: string | null;
  country: string | null;
  city: string | null;
  status: string;
  notes: string | null;
};

type CrmDocument = {
  id: string;
  account_id: string;
  name: string;
  file_path: string;
  file_type: string | null;
  size: number | null;
  storage_provider: string;
  created_at: string;
};
// ===== FIN TYPES =====


export default function CRMPage() {

  // ===== INICIO TENANT =====
  const { companyId } = useTenant();
  // ===== FIN TENANT =====

  // ===== INICIO STATE =====
  const [accounts, setAccounts] = useState<CrmAccount[]>([]);
  const [selected, setSelected] = useState<CrmAccount | null>(null);
  const [documents, setDocuments] = useState<CrmDocument[]>([]);
  const [loading, setLoading] = useState(true);
  // ===== FIN STATE =====

  // ===== INICIO LOAD ACCOUNTS =====
  useEffect(() => {
    if (!companyId) return;

    loadAccounts();

    const channel = supabase
      .channel("crm-accounts-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "crm_accounts",
          filter: `company_id=eq.${companyId}`,
        },
        loadAccounts
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);
  // ===== FIN LOAD ACCOUNTS =====


  async function loadAccounts() {
    if (!companyId) return;

    const { data } = await supabase
      .from("crm_accounts")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    setAccounts(data || []);
    setLoading(false);
  }

  // ===== INICIO LOAD DOCUMENTS =====
  useEffect(() => {
    if (!selected) return;
    loadDocuments(selected.id);
  }, [selected]);

  async function loadDocuments(accountId: string) {
    const { data } = await supabase
      .from("crm_documents")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false });

    setDocuments(data || []);
  }
  // ===== FIN LOAD DOCUMENTS =====


  // ===== INICIO UPLOAD DOCUMENT =====
  async function uploadDocument(file: File) {
    if (!selected || !companyId) return;

    const filePath = `${companyId}/${selected.id}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("crm-documents")
      .upload(filePath, file);

    if (error) {
      alert("Error subiendo archivo");
      return;
    }

    await supabase.from("crm_documents").insert({
      company_id: companyId,
      account_id: selected.id,
      name: file.name,
      file_path: filePath,
      file_type: file.type,
      size: file.size,
      storage_provider: "supabase",
    });

    loadDocuments(selected.id);
  }
  // ===== FIN UPLOAD DOCUMENT =====

  // ===== INICIO RENDER =====

  if (loading) return <div style={{ padding: 40 }}>Cargando CRM...</div>;

  return (
    <div style={{ padding: 24, display: "grid", gap: 20 }}>

      <h1>CRM — Empresas / Cuentas</h1>

      {/* ===== LISTA DE CUENTAS ===== */}
      <div style={{ display: "grid", gap: 10 }}>
        {accounts.map((a) => (
          <div
            key={a.id}
            onClick={() => setSelected(a)}
            style={{
              padding: 14,
              borderRadius: 12,
              background: "#0b1220",
              border: "1px solid #1f2937",
              cursor: "pointer",
            }}
          >
            <strong>{a.name}</strong>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              {a.industry || "Sin industria"} — {a.country || "-"}
            </div>
          </div>
        ))}
      </div>

      {/* ===== DETALLE ===== */}
      {selected && (
        <div style={{ marginTop: 20 }}>
          <h2>{selected.name}</h2>

          {/* ===== UPLOAD ===== */}
          <input
            type="file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadDocument(f);
            }}
          />

          {/* ===== DOCUMENTOS ===== */}
          <div style={{ marginTop: 16 }}>
            <h3>Documentos</h3>

            {documents.length === 0 && <p>No hay documentos.</p>}

            {documents.map((d) => (
              <DocumentRow key={d.id} doc={d} />
            ))}
          </div>
        </div>
      )}

    </div>
  );

  // ===== FIN RENDER =====
}


// ===== INICIO COMPONENT DOCUMENT ROW =====
function DocumentRow({ doc }: { doc: CrmDocument }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.storage
      .from("crm-documents")
      .getPublicUrl(doc.file_path);

    setUrl(data.publicUrl);
  }, [doc.file_path]);

  return (
    <div
      style={{
        padding: 10,
        borderBottom: "1px solid #1f2937",
      }}
    >
      <strong>{doc.name}</strong>

      {url && (
        <div>
          <a href={url} target="_blank">
            Ver documento
          </a>
        </div>
      )}
    </div>
  );
}
// ===== FIN COMPONENT DOCUMENT ROW =====
