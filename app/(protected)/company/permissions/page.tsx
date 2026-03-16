"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";

type Role = {
  id: string;
  name: string;
};

type Module = {
  key: string;
  name: string;
};

export default function PermissionsPage() {
  const { companyId } = useTenant();

  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [permissions, setPermissions] = useState<any[]>([]);

  useEffect(() => {
    loadInitialData();
  }, [companyId]);

  async function loadInitialData() {
    if (!companyId) return;

    const { data: rolesData } = await supabase
      .from("company_roles")
      .select("id, name")
      .eq("company_id", companyId);

    const { data: modulesData } = await supabase
      .from("modules")
      .select("key, name");

    setRoles(rolesData || []);
    setModules(modulesData || []);
  }

  async function loadPermissions(roleId: string) {
    setSelectedRole(roleId);

    const { data } = await supabase
      .from("company_role_permissions")
      .select("*")
      .eq("role_id", roleId);

    setPermissions(data || []);
  }

  function getPermission(moduleKey: string) {
    return permissions.find(
      (p) => p.module_key === moduleKey
    );
  }

  async function togglePermission(
    moduleKey: string,
    field: string,
    value: boolean
  ) {
    if (!companyId || !selectedRole) return;

    const existing = getPermission(moduleKey);

    if (existing) {
      await supabase
        .from("company_role_permissions")
        .update({ [field]: value })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("company_role_permissions")
        .insert({
          company_id: companyId,
          role_id: selectedRole,
          module_key: moduleKey,
          [field]: value,
        });
    }

    loadPermissions(selectedRole);
  }

  if (!companyId) {
    return (
      <div style={{ padding: 40 }}>
        Sin empresa activa
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Permisos por rol</h1>

      {/* 🔹 Selector de rol */}
      <div style={{ marginTop: 20 }}>
        <select
          value={selectedRole}
          onChange={(e) =>
            loadPermissions(e.target.value)
          }
          style={{
            padding: 10,
            borderRadius: 6,
          }}
        >
          <option value="">Selecciona rol</option>

          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* 🔹 Tabla permisos */}
      {selectedRole && (
        <div style={{ marginTop: 30 }}>
          {modules.map((m) => {
            const perm = getPermission(m.key);

            return (
              <div
                key={m.key}
                style={{
                  padding: 16,
                  marginBottom: 12,
                  border: "1px solid #ccc",
                  borderRadius: 8,
                }}
              >
                <strong>{m.name}</strong>

                <div style={{ marginTop: 8 }}>
                  {[
                    "can_view",
                    "can_create",
                    "can_edit",
                    "can_delete",
                  ].map((f) => (
                    <label
                      key={f}
                      style={{
                        marginRight: 20,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          perm?.[f] || false
                        }
                        onChange={(e) =>
                          togglePermission(
                            m.key,
                            f,
                            e.target.checked
                          )
                        }
                      />{" "}
                      {f.replace("can_", "")}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
