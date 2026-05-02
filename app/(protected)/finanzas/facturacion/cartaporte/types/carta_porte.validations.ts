// ═══════════════════════════════════════════════════════════════════════
// Validador de Carta Porte 3.1
// 
// Valida que los datos cumplan las reglas mínimas SAT antes de timbrar.
// Retorna lista de errores legibles para mostrar al usuario.
// ═══════════════════════════════════════════════════════════════════════

import type { CartaPorteData, CFDIBaseData, CFDIConCartaPorteData, CartaPorteParentType } from "./carta_porte.types";

export type ValidationError = {
  section:
    | "header"
    | "ubicaciones"
    | "mercancias"
    | "modo_transporte"
    | "figuras"
    | "regimen_aduanero"
    | "cliente"
    | "conceptos";
  field: string;
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  errors: ValidationError[];
};

/** Validación principal del CCP. */
export function validateCartaPorte(data: CartaPorteData): ValidationResult {
  const errors: ValidationError[] = [];

  // ─── Header ───
  if (!data.header.modos_transporte || data.header.modos_transporte.length === 0) {
    errors.push({
      section: "header",
      field: "modos_transporte",
      message: "Selecciona al menos un modo de transporte (autotransporte, marítimo, aéreo o ferroviario).",
    });
  }

  if (data.header.transp_internac === "Sí") {
    if (!data.header.entrada_salida_merc) {
      errors.push({
        section: "header",
        field: "entrada_salida_merc",
        message: "Indica si la mercancía es de Entrada (importación) o Salida (exportación).",
      });
    }
    if (!data.header.pais_origen_destino) {
      errors.push({
        section: "header",
        field: "pais_origen_destino",
        message: "Indica el país de origen (si exportas) o destino (si importas).",
      });
    }
    if (!data.header.via_entrada_salida) {
      errors.push({
        section: "header",
        field: "via_entrada_salida",
        message: "Indica la vía de entrada/salida del país.",
      });
    }
  }

  if (!Number.isFinite(data.header.total_dist_rec) || data.header.total_dist_rec <= 0) {
    errors.push({
      section: "header",
      field: "total_dist_rec",
      message: "La distancia total recorrida debe ser mayor a 0 km.",
    });
  }

  // ─── Ubicaciones ───
  const origenes = data.ubicaciones.filter(u => u.tipo_ubicacion === "Origen");
  const destinos = data.ubicaciones.filter(u => u.tipo_ubicacion === "Destino");

  if (origenes.length < 1) {
    errors.push({
      section: "ubicaciones",
      field: "origen",
      message: "Debe haber al menos una ubicación tipo Origen.",
    });
  }
  if (destinos.length < 1) {
    errors.push({
      section: "ubicaciones",
      field: "destino",
      message: "Debe haber al menos una ubicación tipo Destino.",
    });
  }

  data.ubicaciones.forEach((u, idx) => {
    const prefix = `Ubicación ${idx + 1} (${u.tipo_ubicacion})`;

    if (!u.rfc_remitente_destinatario || u.rfc_remitente_destinatario.length < 12) {
      errors.push({
        section: "ubicaciones",
        field: `ubicaciones[${idx}].rfc`,
        message: `${prefix}: RFC del ${u.tipo_ubicacion === "Origen" ? "remitente" : "destinatario"} es obligatorio.`,
      });
    }
    if (!u.fecha_hora_salida_llegada) {
      errors.push({
        section: "ubicaciones",
        field: `ubicaciones[${idx}].fecha_hora_salida_llegada`,
        message: `${prefix}: fecha y hora son obligatorias.`,
      });
    }
    if (!u.domicilio.codigo_postal) {
      errors.push({
        section: "ubicaciones",
        field: `ubicaciones[${idx}].codigo_postal`,
        message: `${prefix}: código postal del domicilio es obligatorio.`,
      });
    }
    if (!u.domicilio.estado) {
      errors.push({
        section: "ubicaciones",
        field: `ubicaciones[${idx}].estado`,
        message: `${prefix}: estado del domicilio es obligatorio.`,
      });
    }
    if (u.tipo_ubicacion === "Destino" && (!u.distancia_recorrida || u.distancia_recorrida <= 0)) {
      errors.push({
        section: "ubicaciones",
        field: `ubicaciones[${idx}].distancia_recorrida`,
        message: `${prefix}: distancia recorrida debe ser mayor a 0.`,
      });
    }
  });

  // ─── Mercancías ───
  if (data.mercancias.length === 0) {
    errors.push({
      section: "mercancias",
      field: "mercancias",
      message: "Debe haber al menos una mercancía a transportar.",
    });
  }

  data.mercancias.forEach((m, idx) => {
    const prefix = `Mercancía ${idx + 1}`;
    if (!m.bienes_transp) {
      errors.push({
        section: "mercancias",
        field: `mercancias[${idx}].bienes_transp`,
        message: `${prefix}: clave SAT del producto es obligatoria.`,
      });
    }
    if (!m.descripcion) {
      errors.push({
        section: "mercancias",
        field: `mercancias[${idx}].descripcion`,
        message: `${prefix}: descripción es obligatoria.`,
      });
    }
    if (!Number.isFinite(m.cantidad) || m.cantidad <= 0) {
      errors.push({
        section: "mercancias",
        field: `mercancias[${idx}].cantidad`,
        message: `${prefix}: cantidad debe ser mayor a 0.`,
      });
    }
    if (!m.clave_unidad) {
      errors.push({
        section: "mercancias",
        field: `mercancias[${idx}].clave_unidad`,
        message: `${prefix}: clave de unidad es obligatoria.`,
      });
    }
    if (!Number.isFinite(m.peso_en_kg) || m.peso_en_kg <= 0) {
      errors.push({
        section: "mercancias",
        field: `mercancias[${idx}].peso_en_kg`,
        message: `${prefix}: peso en kg debe ser mayor a 0.`,
      });
    }
    if (m.material_peligroso && !m.cve_material_peligroso) {
      errors.push({
        section: "mercancias",
        field: `mercancias[${idx}].cve_material_peligroso`,
        message: `${prefix}: si es material peligroso, la clave SAT del material es obligatoria.`,
      });
    }
  });

  // Validar consistencia de pesos
  if (data.mercancias.length > 0) {
    const sumaPesos = data.mercancias.reduce((acc, m) => acc + (m.peso_en_kg || 0), 0);
    if (Math.abs(sumaPesos - data.mercancias_agregado.peso_bruto_total) > 0.01) {
      errors.push({
        section: "mercancias",
        field: "peso_bruto_total",
        message: `El peso bruto total (${data.mercancias_agregado.peso_bruto_total}) debe ser igual a la suma de pesos de mercancías (${sumaPesos.toFixed(3)}).`,
      });
    }
  }

  // ─── Modo de transporte ───
  for (const modo of data.header.modos_transporte) {
    if (modo === "04" && !data.autotransporte) {
      errors.push({
        section: "modo_transporte",
        field: "autotransporte",
        message: "Faltan datos de Autotransporte.",
      });
    }
    if (modo === "01" && !data.transporte_maritimo) {
      errors.push({
        section: "modo_transporte",
        field: "transporte_maritimo",
        message: "Faltan datos de Transporte Marítimo.",
      });
    }
    if (modo === "02" && !data.transporte_aereo) {
      errors.push({
        section: "modo_transporte",
        field: "transporte_aereo",
        message: "Faltan datos de Transporte Aéreo.",
      });
    }
    if (modo === "03" && !data.transporte_ferroviario) {
      errors.push({
        section: "modo_transporte",
        field: "transporte_ferroviario",
        message: "Faltan datos de Transporte Ferroviario.",
      });
    }
  }

  // Validaciones específicas por modo
  if (data.autotransporte) {
    const a = data.autotransporte;
    if (!a.perm_sct) errors.push({ section: "modo_transporte", field: "autotransporte.perm_sct", message: "Autotransporte: tipo de permiso SCT es obligatorio." });
    if (!a.num_permiso_sct) errors.push({ section: "modo_transporte", field: "autotransporte.num_permiso_sct", message: "Autotransporte: número de permiso SCT es obligatorio." });
    if (!a.identificacion_vehicular.config_vehicular) errors.push({ section: "modo_transporte", field: "autotransporte.config_vehicular", message: "Autotransporte: configuración vehicular es obligatoria." });
    if (!a.identificacion_vehicular.placa_vm) errors.push({ section: "modo_transporte", field: "autotransporte.placa_vm", message: "Autotransporte: placa del vehículo motriz es obligatoria." });
    if (!a.seguros.asegura_resp_civil || !a.seguros.poliza_resp_civil) errors.push({ section: "modo_transporte", field: "autotransporte.seguros", message: "Autotransporte: aseguradora y póliza de responsabilidad civil son obligatorias." });
  }

  if (data.transporte_maritimo) {
    const m = data.transporte_maritimo;
    if (!m.tipo_embarcacion) errors.push({ section: "modo_transporte", field: "maritimo.tipo_embarcacion", message: "Marítimo: tipo de embarcación es obligatorio." });
    if (!m.matricula) errors.push({ section: "modo_transporte", field: "maritimo.matricula", message: "Marítimo: matrícula de la embarcación es obligatoria." });
    if (!m.numero_omi) errors.push({ section: "modo_transporte", field: "maritimo.numero_omi", message: "Marítimo: número OMI es obligatorio." });
    if (!m.tipo_carga) errors.push({ section: "modo_transporte", field: "maritimo.tipo_carga", message: "Marítimo: tipo de carga es obligatorio." });
  }

  if (data.transporte_aereo) {
    const a = data.transporte_aereo;
    if (!a.matricula_aeronave) errors.push({ section: "modo_transporte", field: "aereo.matricula_aeronave", message: "Aéreo: matrícula de la aeronave es obligatoria." });
    if (!a.numero_guia) errors.push({ section: "modo_transporte", field: "aereo.numero_guia", message: "Aéreo: número de guía es obligatorio." });
    if (!a.codigo_transportista) errors.push({ section: "modo_transporte", field: "aereo.codigo_transportista", message: "Aéreo: código del transportista es obligatorio." });
  }

  if (data.transporte_ferroviario) {
    const f = data.transporte_ferroviario;
    if (!f.tipo_de_servicio) errors.push({ section: "modo_transporte", field: "ferroviario.tipo_de_servicio", message: "Ferroviario: tipo de servicio es obligatorio." });
    if (!f.tipo_de_trafico) errors.push({ section: "modo_transporte", field: "ferroviario.tipo_de_trafico", message: "Ferroviario: tipo de tráfico es obligatorio." });
    if (!f.carros || f.carros.length === 0) errors.push({ section: "modo_transporte", field: "ferroviario.carros", message: "Ferroviario: debe haber al menos un carro." });
  }

  // ─── Figuras ───
  if (data.figuras.length === 0) {
    errors.push({
      section: "figuras",
      field: "figuras",
      message: "Debe haber al menos una figura de transporte (operador, propietario, etc.).",
    });
  }

  data.figuras.forEach((f, idx) => {
    const prefix = `Figura ${idx + 1}`;
    if (!f.rfc_figura && !f.num_reg_id_trib) {
      errors.push({
        section: "figuras",
        field: `figuras[${idx}].rfc`,
        message: `${prefix}: RFC o ID de registro tributario es obligatorio.`,
      });
    }
    if (f.tipo_figura === "01" && !f.num_licencia) {
      errors.push({
        section: "figuras",
        field: `figuras[${idx}].num_licencia`,
        message: `${prefix} (Operador): número de licencia es obligatorio.`,
      });
    }
  });

  // ─── Régimen aduanero (solo si internacional) ───
  if (data.header.transp_internac === "Sí") {
    if (!data.regimenes_aduaneros || data.regimenes_aduaneros.length === 0) {
      errors.push({
        section: "regimen_aduanero",
        field: "regimenes_aduaneros",
        message: "Carta Porte internacional requiere al menos un régimen aduanero.",
      });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/** Agrupa errores por sección para mostrarlos en el drawer. */
export function groupErrorsBySection(errors: ValidationError[]): Record<string, ValidationError[]> {
  const grouped: Record<string, ValidationError[]> = {};
  for (const e of errors) {
    if (!grouped[e.section]) grouped[e.section] = [];
    grouped[e.section].push(e);
  }
  return grouped;
}

// ═══════════════════════════════════════════════════════════════════════
// Validador del CFDI completo (Base + Carta Porte)
// ═══════════════════════════════════════════════════════════════════════

import type {
  CFDIBaseData,
  CFDIConCartaPorteData,
} from "./carta_porte.types";

/**
 * Valida los datos del CFDI base (cliente + conceptos + pagos).
 * En modo Traslado (parentType="traslado_carta_porte") se skipean validaciones que no aplican:
 * conceptos, payment_method/payment_form (vienen forzados desde el mapper), y receiver_cfdi_use (forzado a S01).
 */
export function validateCFDIBase(
  base: CFDIBaseData,
  parentType: CartaPorteParentType = "factura_carta_porte"
): ValidationError[] {
  const errors: ValidationError[] = [];
  const isTraslado = parentType === "traslado_carta_porte";

  // ─── Cliente ───
  if (!base.cliente.receiver_rfc || base.cliente.receiver_rfc.length < 12) {
    errors.push({ section: "cliente", field: "receiver_rfc", message: "RFC del cliente es obligatorio (12-13 caracteres)." });
  }
  if (!base.cliente.receiver_name) {
    errors.push({ section: "cliente", field: "receiver_name", message: "Razón social del cliente es obligatoria." });
  }
  if (!base.cliente.receiver_fiscal_regime) {
    errors.push({ section: "cliente", field: "receiver_fiscal_regime", message: "Régimen fiscal del cliente es obligatorio." });
  }
  if (!base.cliente.receiver_zip || base.cliente.receiver_zip.length !== 5) {
    errors.push({ section: "cliente", field: "receiver_zip", message: "Código postal del cliente debe tener 5 dígitos." });
  }
  if (!isTraslado && !base.cliente.receiver_cfdi_use) {
    errors.push({ section: "cliente", field: "receiver_cfdi_use", message: "Uso de CFDI es obligatorio." });
  }

  if (!isTraslado) {
    // ─── Conceptos ───
    if (!base.conceptos || base.conceptos.length === 0) {
      errors.push({ section: "conceptos", field: "conceptos", message: "Debe haber al menos un concepto a facturar." });
    }
    base.conceptos.forEach((c, idx) => {
      const prefix = `Concepto ${idx + 1}`;
      if (!c.description) errors.push({ section: "conceptos", field: `conceptos[${idx}].description`, message: `${prefix}: descripción es obligatoria.` });
      if (!c.product_key) errors.push({ section: "conceptos", field: `conceptos[${idx}].product_key`, message: `${prefix}: clave SAT del producto es obligatoria.` });
      if (!c.unit_key)    errors.push({ section: "conceptos", field: `conceptos[${idx}].unit_key`,    message: `${prefix}: clave SAT de unidad es obligatoria.` });
      if (!Number.isFinite(c.quantity)   || c.quantity   <= 0) errors.push({ section: "conceptos", field: `conceptos[${idx}].quantity`,   message: `${prefix}: cantidad debe ser mayor a 0.` });
      if (!Number.isFinite(c.unit_price) || c.unit_price < 0)  errors.push({ section: "conceptos", field: `conceptos[${idx}].unit_price`, message: `${prefix}: precio unitario debe ser mayor o igual a 0.` });
    });
  }

  if (!isTraslado) {
    // ─── Pagos ───
    if (base.payment_method === "PPD" && base.payment_form !== "99") {
      errors.push({ section: "conceptos", field: "payment_form", message: "Para pago PPD la forma de pago debe ser 99 (Por definir)." });
    }
  }

  return errors;
}

/**
 * Valida un CFDI completo (Carta Porte + base CFDI).
 * @param parentType "factura_carta_porte" (default) o "traslado_carta_porte" — controla qué validaciones aplican al base CFDI.
 */
export function validateCFDIConCartaPorte(
  data: CFDIConCartaPorteData,
  parentType: CartaPorteParentType = "factura_carta_porte"
): ValidationResult {
  const baseErrors = validateCFDIBase(data.base, parentType);
  const ccpResult  = validateCartaPorte(data.carta_porte);
  const allErrors  = [...baseErrors, ...ccpResult.errors];
  return { ok: allErrors.length === 0, errors: allErrors };
}
