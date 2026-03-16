import { supabase } from "@/lib/supabaseClient";

export async function createCompanyWithTenant(name: string) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) throw new Error("Usuario no autenticado");

  // 1. Crear tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .insert({
      name,
      owner_user_id: userId,
    })
    .select()
    .single();

  // 2. Crear empresa
  const { data: company } = await supabase
  .from("companies")
  .insert({
    name,
    tenant_id: tenant.id,
    owner_user_id: userId,
  })
  .select()
  .single();

  // 3. Asociar usuario al tenant
  await supabase.from("tenant_users").insert({
    tenant_id: tenant.id,
    user_id: userId,
    role: "owner",
  });

  // 4. Asociar usuario a la empresa
  await supabase.from("company_users").insert({
    company_id: company.id,
    user_id: userId,
    role: "owner",
    is_active: true,
  });

  return company;
}
