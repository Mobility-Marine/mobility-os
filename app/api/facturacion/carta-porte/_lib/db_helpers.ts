// ═══════════════════════════════════════════════════════════════════════
// DB helpers para Carta Porte
// 
// - createCartaPorteDraft: crea cfdi_documents + concepts + carta_porte + hijas
// - updateCartaPorteDraft: actualiza un borrador (re-crea hijas)
// - deleteCartaPorteDraft: borra borrador con CASCADE
// - loadCartaPorteForStamping: carga todo para timbrar
// 
// IMPORTANTE: las "partes_transporte" de figuras se guardan como sort_orders
// (índices) en lugar de _temp_ids, para poder mapearlas correctamente al
// momento de timbrar a id_ubicacion (OR000001, DE000001...).
// ═══════════════════════════════════════════════════════════════════════

import { supabaseAdmin } from "./shared";
import type { CFDIConCartaPorteData } from "@/app/(protected)/finanzas/facturacion/cartaporte/types/carta_porte.types";

// ─── Helper: mapea _temp_ids de ubicaciones a sort_orders ───
function buildTempIdMap(
  ubicaciones: CFDIConCartaPorteData["carta_porte"]["ubicaciones"]
): Map<string, number> {
  const map = new Map<string, number>();
  ubicaciones.forEach((u, idx) => {
    if (u._temp_id) map.set(u._temp_id, idx);
  });
  return map;
}

// ═════════════════════════════════════════════════════════════════════
// CREATE
// ═════════════════════════════════════════════════════════════════════
export async function createCartaPorteDraft(
  companyId: string,
  userId: string,
  parentType: "I" | "T",
  data: CFDIConCartaPorteData
): Promise<{ cfdiId: string; cartaPorteId: string }> {

  // 1) Calcular totales del CFDI base
  const totals = computeBaseTotals(data);

  // 2) Insertar cfdi_documents
  const { data: cfdi, error: cfdiErr } = await supabaseAdmin
    .from("cfdi_documents")
    .insert({
      company_id:             companyId,
      type:                   parentType,
      status:                 "draft",
      receiver_rfc:           data.base.cliente.receiver_rfc || null,
      receiver_name:          data.base.cliente.receiver_name || null,
      receiver_email:         data.base.cliente.receiver_email || null,
      receiver_fiscal_regime: data.base.cliente.receiver_fiscal_regime,
      receiver_cfdi_use:      data.base.cliente.receiver_cfdi_use,
      receiver_zip:           data.base.cliente.receiver_zip,
      currency:               data.base.currency,
      exchange_rate:          data.base.exchange_rate,
      payment_method:         data.base.payment_method,
      payment_form:           data.base.payment_form,
      subtotal:               totals.subtotal,
      discount:               totals.discount,
      tax_amount:             totals.iva,
      retention_amount:       totals.ret,
      total:                  totals.total,
      notes:                  data.base.notes || null,
      created_by:             userId,
    })
    .select("id")
    .single();

  if (cfdiErr || !cfdi) throw new Error(cfdiErr?.message ?? "Error creando CFDI");
  const cfdiId = cfdi.id as string;

  // 3) cfdi_concepts (solo factura tipo I)
  if (parentType === "I") {
    await insertConcepts(cfdiId, data);
  }

  // 4) Cabecera Carta Porte + 5) hijas
  const cartaPorteId = await insertCartaPorteAndChildren(cfdiId, companyId, userId, data);

  return { cfdiId, cartaPorteId };
}

// ═════════════════════════════════════════════════════════════════════
// UPDATE
// ═════════════════════════════════════════════════════════════════════
export async function updateCartaPorteDraft(
  cfdiId: string,
  data: CFDIConCartaPorteData
): Promise<void> {
  const { data: cfdiRow } = await supabaseAdmin
    .from("cfdi_documents")
    .select("id, company_id, type")
    .eq("id", cfdiId)
    .maybeSingle();
  if (!cfdiRow) throw new Error("CFDI no encontrado");

  const totals = computeBaseTotals(data);

  // 1) Actualizar cabecera CFDI
  await supabaseAdmin
    .from("cfdi_documents")
    .update({
      receiver_rfc:           data.base.cliente.receiver_rfc || null,
      receiver_name:          data.base.cliente.receiver_name || null,
      receiver_email:         data.base.cliente.receiver_email || null,
      receiver_fiscal_regime: data.base.cliente.receiver_fiscal_regime,
      receiver_cfdi_use:      data.base.cliente.receiver_cfdi_use,
      receiver_zip:           data.base.cliente.receiver_zip,
      currency:               data.base.currency,
      exchange_rate:          data.base.exchange_rate,
      payment_method:         data.base.payment_method,
      payment_form:           data.base.payment_form,
      subtotal:               totals.subtotal,
      discount:               totals.discount,
      tax_amount:             totals.iva,
      retention_amount:       totals.ret,
      total:                  totals.total,
      notes:                  data.base.notes || null,
      updated_at:             new Date().toISOString(),
    })
    .eq("id", cfdiId);

  // 2) Borrar Carta Porte y conceptos existentes
  await supabaseAdmin.from("cfdi_carta_porte").delete().eq("cfdi_id", cfdiId);
  if (cfdiRow.type === "I") {
    await supabaseAdmin.from("cfdi_concepts").delete().eq("cfdi_id", cfdiId);
    await insertConcepts(cfdiId, data);
  }

  // 3) Recrear todo el CCP
  await insertCartaPorteAndChildren(cfdiId, cfdiRow.company_id, null, data);
}

// ═════════════════════════════════════════════════════════════════════
// DELETE (cascade)
// ═════════════════════════════════════════════════════════════════════
export async function deleteCartaPorteDraft(cfdiId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("cfdi_documents")
    .delete()
    .eq("id", cfdiId);
  if (error) throw new Error(`Error eliminando: ${error.message}`);
}

// ═════════════════════════════════════════════════════════════════════
// LOAD (para timbrar)
// ═════════════════════════════════════════════════════════════════════
export async function loadCartaPorteForStamping(cfdiId: string): Promise<{
  cfdi: any;
  concepts: any[];
  cartaPorte: any;
  ubicaciones: any[];
  mercancias: any[];
  figuras: any[];
}> {
  const [{ data: cfdi }, { data: concepts }, { data: cp }] = await Promise.all([
    supabaseAdmin.from("cfdi_documents").select("*").eq("id", cfdiId).maybeSingle(),
    supabaseAdmin.from("cfdi_concepts").select("*").eq("cfdi_id", cfdiId).order("created_at"),
    supabaseAdmin.from("cfdi_carta_porte").select("*").eq("cfdi_id", cfdiId).maybeSingle(),
  ]);

  if (!cfdi) throw new Error("CFDI no encontrado");
  if (!cp)   throw new Error("Carta Porte no encontrada para este CFDI");

  const [{ data: ubicaciones }, { data: mercancias }, { data: figuras }] = await Promise.all([
    supabaseAdmin.from("cfdi_carta_porte_ubicaciones").select("*").eq("carta_porte_id", cp.id).order("sort_order"),
    supabaseAdmin.from("cfdi_carta_porte_mercancias").select("*").eq("carta_porte_id", cp.id).order("sort_order"),
    supabaseAdmin.from("cfdi_carta_porte_figuras").select("*").eq("carta_porte_id", cp.id).order("sort_order"),
  ]);

  return {
    cfdi,
    concepts:    concepts ?? [],
    cartaPorte:  cp,
    ubicaciones: ubicaciones ?? [],
    mercancias:  mercancias ?? [],
    figuras:     figuras ?? [],
  };
}

// ═════════════════════════════════════════════════════════════════════
// HELPERS INTERNOS
// ═════════════════════════════════════════════════════════════════════

function computeBaseTotals(data: CFDIConCartaPorteData) {
  const t = data.base.conceptos.reduce(
    (acc, c) => {
      const base = c.quantity * c.unit_price * (1 - c.discount_pct / 100);
      const iva = base * c.tax_rate;
      const ret = base * c.retention_rate;
      acc.subtotal += base;
      acc.iva      += iva;
      acc.ret      += ret;
      acc.discount += c.quantity * c.unit_price * (c.discount_pct / 100);
      return acc;
    },
    { subtotal: 0, iva: 0, ret: 0, discount: 0 }
  );
  return { ...t, total: t.subtotal + t.iva - t.ret };
}

async function insertConcepts(cfdiId: string, data: CFDIConCartaPorteData): Promise<void> {
  const rows = data.base.conceptos.map((c) => {
    const base = c.quantity * c.unit_price * (1 - c.discount_pct / 100);
    const iva  = base * c.tax_rate;
    const ret  = base * c.retention_rate;
    return {
      cfdi_id:          cfdiId,
      product_key:      c.product_key,
      unit_key:         c.unit_key,
      description:      c.description,
      unit:             c.unit ?? null,
      quantity:         c.quantity,
      unit_price:       c.unit_price,
      discount:         c.quantity * c.unit_price * (c.discount_pct / 100),
      subtotal:         base,
      tax_rate:         c.tax_rate,
      tax_amount:       iva,
      retention_rate:   c.retention_rate,
      retention_amount: ret,
      total:            base + iva - ret,
      product_id:       c.product_id ?? null,
    };
  });
  if (rows.length === 0) return;
  const { error } = await supabaseAdmin.from("cfdi_concepts").insert(rows);
  if (error) throw new Error(`Error creando conceptos: ${error.message}`);
}

async function insertCartaPorteAndChildren(
  cfdiId: string,
  companyId: string,
  userId: string | null,
  data: CFDIConCartaPorteData
): Promise<string> {
  const cp = data.carta_porte;

  // Cabecera
  const { data: cpRow, error: cpErr } = await supabaseAdmin
    .from("cfdi_carta_porte")
    .insert({
      cfdi_id:                                  cfdiId,
      company_id:                               companyId,
      version:                                  cp.header.version,
      transp_internac:                          cp.header.transp_internac,
      entrada_salida_merc:                      cp.header.entrada_salida_merc ?? null,
      pais_origen_destino:                      cp.header.pais_origen_destino ?? null,
      via_entrada_salida:                       cp.header.via_entrada_salida ?? null,
      total_dist_rec:                           cp.header.total_dist_rec,
      registro_istmo:                           cp.header.registro_istmo ?? null,
      ubicacion_polo_origen:                    cp.header.ubicacion_polo_origen ?? null,
      ubicacion_polo_destino:                   cp.header.ubicacion_polo_destino ?? null,
      peso_bruto_total:                         cp.mercancias_agregado.peso_bruto_total,
      unidad_peso:                              cp.mercancias_agregado.unidad_peso,
      peso_neto_total:                          cp.mercancias_agregado.peso_neto_total ?? null,
      num_total_mercancias:                     cp.mercancias_agregado.num_total_mercancias,
      cargo_por_tasacion:                       cp.mercancias_agregado.cargo_por_tasacion ?? null,
      logistica_inversa_recoleccion_devolucion: cp.mercancias_agregado.logistica_inversa_recoleccion_devolucion ?? null,
      modos_transporte:                         cp.header.modos_transporte,
      autotransporte:                           cp.autotransporte ?? null,
      transporte_maritimo:                      cp.transporte_maritimo ?? null,
      transporte_aereo:                         cp.transporte_aereo ?? null,
      transporte_ferroviario:                   cp.transporte_ferroviario ?? null,
      regimenes_aduaneros:                      cp.regimenes_aduaneros ?? null,
      created_by:                               userId,
    })
    .select("id")
    .single();

  if (cpErr || !cpRow) throw new Error(`Error creando Carta Porte: ${cpErr?.message}`);
  const cartaPorteId = cpRow.id as string;

  // Ubicaciones
  const ubicacionRows = cp.ubicaciones.map((u, idx) => ({
    carta_porte_id:                cartaPorteId,
    sort_order:                    idx,
    tipo_ubicacion:                u.tipo_ubicacion,
    rfc_remitente_destinatario:    u.rfc_remitente_destinatario,
    num_reg_id_trib:               u.num_reg_id_trib ?? null,
    residencia_fiscal:             u.residencia_fiscal ?? null,
    nombre_remitente_destinatario: u.nombre_remitente_destinatario ?? null,
    num_estacion:                  u.num_estacion ?? null,
    nombre_estacion:               u.nombre_estacion ?? null,
    navegacion_trafico:            u.navegacion_trafico ?? null,
    fecha_hora_salida_llegada:     u.fecha_hora_salida_llegada,
    tipo_estacion:                 u.tipo_estacion ?? null,
    distancia_recorrida:           u.distancia_recorrida ?? null,
    calle:                         u.domicilio.calle ?? null,
    numero_exterior:               u.domicilio.numero_exterior ?? null,
    numero_interior:               u.domicilio.numero_interior ?? null,
    colonia:                       u.domicilio.colonia ?? null,
    localidad:                     u.domicilio.localidad ?? null,
    referencia:                    u.domicilio.referencia ?? null,
    municipio:                     u.domicilio.municipio ?? null,
    estado:                        u.domicilio.estado,
    pais:                          u.domicilio.pais,
    codigo_postal:                 u.domicilio.codigo_postal,
  }));
  if (ubicacionRows.length > 0) {
    const { error } = await supabaseAdmin.from("cfdi_carta_porte_ubicaciones").insert(ubicacionRows);
    if (error) throw new Error(`Error creando ubicaciones: ${error.message}`);
  }

  // Mercancías
  const mercanciaRows = cp.mercancias.map((m, idx) => ({
    carta_porte_id:                          cartaPorteId,
    sort_order:                              idx,
    bienes_transp:                           m.bienes_transp,
    clave_sti:                               m.clave_sti ?? null,
    descripcion:                             m.descripcion,
    cantidad:                                m.cantidad,
    clave_unidad:                            m.clave_unidad,
    unidad:                                  m.unidad ?? null,
    dimensiones:                             m.dimensiones ?? null,
    material_peligroso:                      m.material_peligroso,
    cve_material_peligroso:                  m.cve_material_peligroso ?? null,
    embalaje:                                m.embalaje ?? null,
    desc_embalaje:                           m.desc_embalaje ?? null,
    sector_cofepris:                         m.sector_cofepris ?? null,
    nombre_ingrediente_activo:               m.nombre_ingrediente_activo ?? null,
    nom_quimico:                             m.nom_quimico ?? null,
    denominacion_generica_prod:              m.denominacion_generica_prod ?? null,
    denominacion_distintiva_prod:            m.denominacion_distintiva_prod ?? null,
    fabricante:                              m.fabricante ?? null,
    fecha_caducidad:                         m.fecha_caducidad ?? null,
    lote_medicamento:                        m.lote_medicamento ?? null,
    forma_farmaceutica:                      m.forma_farmaceutica ?? null,
    condiciones_esp_transp:                  m.condiciones_esp_transp ?? null,
    registro_sanitario_folio_autorizacion:   m.registro_sanitario_folio_autorizacion ?? null,
    permiso_importacion:                     m.permiso_importacion ?? null,
    folio_impo_vucem:                        m.folio_impo_vucem ?? null,
    num_cas:                                 m.num_cas ?? null,
    razon_social_emp_imp:                    m.razon_social_emp_imp ?? null,
    num_registro_sanitario_pl_imp:           m.num_registro_sanitario_pl_imp ?? null,
    peso_en_kg:                              m.peso_en_kg,
    valor_mercancia:                         m.valor_mercancia ?? null,
    moneda:                                  m.moneda ?? null,
    fraccion_arancelaria:                    m.fraccion_arancelaria ?? null,
    uuid_comercio_ext:                       m.uuid_comercio_ext ?? null,
    tipo_materia:                            m.tipo_materia ?? null,
    descripcion_materia:                     m.descripcion_materia ?? null,
    documentacion_aduanera:                  m.documentacion_aduanera ?? null,
    guias_identificacion:                    m.guias_identificacion ?? null,
    cantidad_transporta:                     m.cantidad_transporta ?? null,
    pedimentos:                              m.pedimentos ?? null,
  }));
  if (mercanciaRows.length > 0) {
    const { error } = await supabaseAdmin.from("cfdi_carta_porte_mercancias").insert(mercanciaRows);
    if (error) throw new Error(`Error creando mercancías: ${error.message}`);
  }

  // Figuras: convertir partes_transporte (_temp_ids) a sort_orders
  const tempIdMap = buildTempIdMap(cp.ubicaciones);
  const figuraRows = cp.figuras.map((f, idx) => {
    let partesTransporte: number[] | null = null;
    if (f.partes_transporte && f.partes_transporte.length > 0) {
      partesTransporte = f.partes_transporte
        .map((tempId) => tempIdMap.get(tempId))
        .filter((v): v is number => v !== undefined);
      if (partesTransporte.length === 0) partesTransporte = null;
    }

    return {
      carta_porte_id:    cartaPorteId,
      sort_order:        idx,
      tipo_figura:       f.tipo_figura,
      rfc_figura:        f.rfc_figura ?? null,
      num_licencia:      f.num_licencia ?? null,
      nombre_figura:     f.nombre_figura ?? null,
      num_reg_id_trib:   f.num_reg_id_trib ?? null,
      residencia_fiscal: f.residencia_fiscal ?? null,
      calle:             f.domicilio?.calle ?? null,
      numero_exterior:   f.domicilio?.numero_exterior ?? null,
      numero_interior:   f.domicilio?.numero_interior ?? null,
      colonia:           f.domicilio?.colonia ?? null,
      localidad:         f.domicilio?.localidad ?? null,
      referencia:        f.domicilio?.referencia ?? null,
      municipio:         f.domicilio?.municipio ?? null,
      estado:            f.domicilio?.estado ?? null,
      pais:              f.domicilio?.pais ?? null,
      codigo_postal:     f.domicilio?.codigo_postal ?? null,
      partes_transporte: partesTransporte,
    };
  });
  if (figuraRows.length > 0) {
    const { error } = await supabaseAdmin.from("cfdi_carta_porte_figuras").insert(figuraRows);
    if (error) throw new Error(`Error creando figuras: ${error.message}`);
  }

  return cartaPorteId;
}
