// ═══════════════════════════════════════════════════════════════════════
// Convierte los datos de BD al formato JSON que acepta Facturapi para
// emitir un CFDI con complemento Carta Porte 3.1.
// 
// Ref: https://docs.facturapi.io/api/cfdi-3-3#crear-cfdi-con-complemento-carta-porte
// ═══════════════════════════════════════════════════════════════════════

import { buildIdUbicacionMap } from "./shared";

interface BuildArgs {
  parentType:  "I" | "T";
  cfdi:        any;
  concepts:    any[];
  cartaPorte:  any;
  ubicaciones: any[];
  mercancias:  any[];
  figuras:     any[];
  serie:       string;
  folio:       number;
}

export function buildFacturapiPayload(args: BuildArgs): any {
  const { parentType, cfdi, concepts, cartaPorte, ubicaciones, mercancias, figuras, serie, folio } = args;

  // ── Pre-cálculo de id_ubicacion (OR000001 / DE000001...) ──
  const idsByIndex = buildIdUbicacionMap(ubicaciones);

  // ── Customer ──
  const customer = {
    tax_id:     cfdi.receiver_rfc,
    legal_name: cfdi.receiver_name,
    tax_system: cfdi.receiver_fiscal_regime,
    address:    cfdi.receiver_zip ? { zip: cfdi.receiver_zip } : undefined,
    email:      cfdi.receiver_email ?? undefined,
  };

  // ── Items: tipo I = conceptos cobrados; tipo T = mercancías con precio 0 ──
  const items = parentType === "I"
    ? concepts.map((c) => buildItemFromConcept(c))
    : mercancias.map((m) => buildItemFromMercancia(m));

  // ── Ubicaciones del complemento ──
  const fpUbicaciones = ubicaciones.map((u, idx) => ({
    tipo_ubicacion:                 u.tipo_ubicacion,
    id_ubicacion:                   idsByIndex[idx],
    rfc_remitente_destinatario:     u.rfc_remitente_destinatario,
    num_reg_id_trib:                u.num_reg_id_trib ?? undefined,
    residencia_fiscal:              u.residencia_fiscal ?? undefined,
    nombre_remitente_destinatario:  u.nombre_remitente_destinatario ?? undefined,
    num_estacion:                   u.num_estacion ?? undefined,
    nombre_estacion:                u.nombre_estacion ?? undefined,
    navegacion_trafico:             u.navegacion_trafico ?? undefined,
    fecha_hora_salida_llegada:      u.fecha_hora_salida_llegada,
    tipo_estacion:                  u.tipo_estacion ?? undefined,
    distancia_recorrida:            u.distancia_recorrida ?? undefined,
    domicilio: {
      calle:           u.calle ?? undefined,
      numero_exterior: u.numero_exterior ?? undefined,
      numero_interior: u.numero_interior ?? undefined,
      colonia:         u.colonia ?? undefined,
      localidad:       u.localidad ?? undefined,
      referencia:      u.referencia ?? undefined,
      municipio:       u.municipio ?? undefined,
      estado:          u.estado,
      pais:            u.pais,
      codigo_postal:   u.codigo_postal,
    },
  }));

  // ── Mercancías del complemento ──
  const fpMercancias = mercancias.map((m) => ({
    bienes_transp:          m.bienes_transp,
    clave_sti:              m.clave_sti ?? undefined,
    descripcion:            m.descripcion,
    cantidad:               Number(m.cantidad),
    clave_unidad:           m.clave_unidad,
    unidad:                 m.unidad ?? undefined,
    dimensiones:            m.dimensiones ?? undefined,
    material_peligroso:     m.material_peligroso ? "Sí" : "No",
    cve_material_peligroso: m.cve_material_peligroso ?? undefined,
    embalaje:               m.embalaje ?? undefined,
    descrip_embalaje:       m.desc_embalaje ?? undefined,
    peso_en_kg:             Number(m.peso_en_kg),
    valor_mercancia:        m.valor_mercancia ?? undefined,
    moneda:                 m.moneda ?? undefined,
    fraccion_arancelaria:   m.fraccion_arancelaria ?? undefined,
    uuid_comercio_ext:      m.uuid_comercio_ext ?? undefined,
    tipo_materia:           m.tipo_materia ?? undefined,
    descripcion_materia:    m.descripcion_materia ?? undefined,
    documentacion_aduanera: m.documentacion_aduanera ?? undefined,
    guias_identificacion:   m.guias_identificacion ?? undefined,
    cantidad_transporta:    m.cantidad_transporta ?? undefined,
    pedimentos:             m.pedimentos ?? undefined,
  }));

  // ── Figuras transporte ──
  const fpFiguras = figuras.map((f) => {
    const out: any = {
      tipo_figura:       f.tipo_figura,
      rfc_figura:        f.rfc_figura ?? undefined,
      num_licencia:      f.num_licencia ?? undefined,
      nombre_figura:     f.nombre_figura ?? undefined,
      num_reg_id_trib:   f.num_reg_id_trib ?? undefined,
      residencia_fiscal: f.residencia_fiscal ?? undefined,
    };
    if (f.codigo_postal || f.calle) {
      out.domicilio = {
        calle:           f.calle ?? undefined,
        numero_exterior: f.numero_exterior ?? undefined,
        numero_interior: f.numero_interior ?? undefined,
        colonia:         f.colonia ?? undefined,
        localidad:       f.localidad ?? undefined,
        referencia:      f.referencia ?? undefined,
        municipio:       f.municipio ?? undefined,
        estado:          f.estado ?? undefined,
        pais:            f.pais ?? undefined,
        codigo_postal:   f.codigo_postal ?? undefined,
      };
    }
    // partes_transporte: BD almacena sort_orders → mapear a id_ubicacion
    if (f.partes_transporte && Array.isArray(f.partes_transporte) && f.partes_transporte.length > 0) {
      out.partes_transporte = f.partes_transporte
        .map((sortOrder: number) => {
          const id = idsByIndex[sortOrder];
          return id ? { id_ubicacion: id } : null;
        })
        .filter(Boolean);
    }
    return out;
  });

  // ── Mercancías object: incluye datos del modo de transporte ──
  const mercanciasObject: any = {
    peso_bruto_total:     Number(cartaPorte.peso_bruto_total),
    unidad_peso:          cartaPorte.unidad_peso,
    num_total_mercancias: Number(cartaPorte.num_total_mercancias),
    merc:                 fpMercancias,
  };
  if (cartaPorte.peso_neto_total) mercanciasObject.peso_neto_total = Number(cartaPorte.peso_neto_total);
  if (cartaPorte.autotransporte)         mercanciasObject.autotransporte     = cartaPorte.autotransporte;
  if (cartaPorte.transporte_maritimo)    mercanciasObject.transp_maritimo    = cartaPorte.transporte_maritimo;
  if (cartaPorte.transporte_aereo)       mercanciasObject.transp_aereo       = cartaPorte.transporte_aereo;
  if (cartaPorte.transporte_ferroviario) mercanciasObject.transp_ferroviario = cartaPorte.transporte_ferroviario;

  // ── Complemento Carta Porte ──
  const cartaPorteData: any = {
    transp_internac:    cartaPorte.transp_internac === "Sí",
    total_dist_rec:     Number(cartaPorte.total_dist_rec),
    ubicaciones:        fpUbicaciones,
    mercancias:         mercanciasObject,
    figura_transporte:  fpFiguras,
  };
  if (cartaPorte.transp_internac === "Sí") {
    cartaPorteData.entrada_salida_merc = cartaPorte.entrada_salida_merc;
    cartaPorteData.pais_origen_destino = cartaPorte.pais_origen_destino;
    cartaPorteData.via_entrada_salida  = cartaPorte.via_entrada_salida;
    if (cartaPorte.regimenes_aduaneros && cartaPorte.regimenes_aduaneros.length > 0) {
      cartaPorteData.regimenes_aduaneros = cartaPorte.regimenes_aduaneros;
    }
  }

  // ── Blindaje SAT (PPD/PUE/UseCFDI según tipo de comprobante) ──
  // CFDI Tipo T (Traslado): el SAT exige uso="S01" (Sin efectos fiscales),
  // payment_method="PUE" (no hay parcialidades en un traslado) y
  // payment_form="99" (Por definir, no aplica forma de pago).
  // CFDI Tipo I (Factura): aplicamos el blindaje habitual PPD/PUE.
  const isTraslado = parentType === "T";

  let paymentMethod: string;
  let paymentForm:   string;

  if (isTraslado) {
    paymentMethod = "PUE";
    paymentForm   = "99";
  } else {
    paymentMethod = cfdi.payment_method ?? "PUE";
    paymentForm   = cfdi.payment_form   ?? "03";
    if (paymentMethod === "PPD") {
      paymentForm = "99";
    } else if (paymentMethod === "PUE" && paymentForm === "99") {
      paymentForm = "03";
    }
  }

  const cfdiUse = isTraslado
    ? "S01"
    : (cfdi.receiver_cfdi_use ?? "G03");

  // ── Payload final ──
  return {
    type:           parentType,
    customer,
    items,
    use:            cfdiUse,
    payment_method: paymentMethod,
    payment_form:   paymentForm,
    currency:       cfdi.currency ?? "MXN",
    exchange:       Number(cfdi.exchange_rate ?? 1),
    series:         serie,
    folio_number:   folio,
    complements: [
      { type: "carta_porte", data: cartaPorteData },
    ],
  };
}

// ─── Helpers ───
function buildItemFromConcept(c: any): any {
  const taxes: any[] = [];
  if (c.tax_rate !== null && c.tax_rate !== undefined) {
    taxes.push({ type: "IVA", rate: Number(c.tax_rate), withholding: false });
  }
  if (c.retention_rate && Number(c.retention_rate) > 0) {
    taxes.push({ type: "IVA", rate: Number(c.retention_rate), withholding: true });
  }
  return {
    product: {
      description: c.description,
      product_key: c.product_key,
      unit_key:    c.unit_key,
      unit_name:   c.unit ?? undefined,
      price:       Number(c.unit_price),
      taxes,
    },
    quantity: Number(c.quantity),
    discount: Number(c.discount ?? 0),
  };
}

function buildItemFromMercancia(m: any): any {
  return {
    product: {
      description: m.descripcion,
      product_key: m.bienes_transp,
      unit_key:    m.clave_unidad,
      unit_name:   m.unidad ?? "Servicio",
      price:       0,
      taxes:       [],
    },
    quantity: Number(m.cantidad),
  };
}
