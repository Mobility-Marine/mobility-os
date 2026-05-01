// ═══════════════════════════════════════════════════════════════════════
// Tipos TypeScript del Complemento Carta Porte 3.1 (SAT)
// 
// Estos tipos reflejan EXACTAMENTE la estructura SAT del XML del complemento
// para que la conversión a Facturapi/SAT sea directa.
// 
// Referencia oficial: Anexo 20 + Estándar Carta Porte 3.1
// ═══════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// 1) DATOS GENERALES DEL CCP (cabecera)
// ─────────────────────────────────────────────────────────────

export type SiNo = "Sí" | "No";
export type EntradaSalida = "Entrada" | "Salida";
export type ModoTransporteCode = "01" | "02" | "03" | "04"; // 01=Marítimo, 02=Aéreo, 03=Ferroviario, 04=Autotransporte

export interface CartaPorteHeader {
  /** Versión del complemento. Siempre "3.1" en esta versión del SaaS. */
  version: "3.1";

  /** UUID del CCP (lo asigna SAT al timbrar; antes está vacío). */
  id_ccp?: string;

  /** ¿El traslado cruza fronteras? */
  transp_internac: SiNo;

  /** Si transp_internac="Sí": indica si la mercancía entra o sale del país. */
  entrada_salida_merc?: EntradaSalida;

  /** Si transp_internac="Sí": código país ISO 3 letras. */
  pais_origen_destino?: string;

  /** Si transp_internac="Sí": vía de entrada/salida (catálogo vias_transporte). */
  via_entrada_salida?: string;

  /** Distancia total recorrida en km (suma de todas las distancias entre ubicaciones). */
  total_dist_rec: number;

  /** Si pasa por la zona ISTMO de Tehuantepec. */
  registro_istmo?: SiNo;
  ubicacion_polo_origen?: string;
  ubicacion_polo_destino?: string;

  /** Modos de transporte usados en este viaje (puede ser multimodal). */
  modos_transporte: ModoTransporteCode[];
}

// ─────────────────────────────────────────────────────────────
// 2) MERCANCÍAS AGREGADAS (totales)
// ─────────────────────────────────────────────────────────────

export interface CartaPorteMercanciasAgregado {
  peso_bruto_total: number;
  unidad_peso: string;       // catálogo unidad_peso (KGM, TNE, etc.)
  peso_neto_total?: number;
  num_total_mercancias: number;
  cargo_por_tasacion?: number;
  logistica_inversa_recoleccion_devolucion?: SiNo;
}

// ─────────────────────────────────────────────────────────────
// 3) UBICACIONES (1 origen + N destinos)
// ─────────────────────────────────────────────────────────────

export type TipoUbicacion = "Origen" | "Destino";

export interface CartaPorteDomicilio {
  calle?: string;
  numero_exterior?: string;
  numero_interior?: string;
  colonia?: string;
  localidad?: string;
  referencia?: string;
  municipio?: string;
  estado: string;          // catálogo estados_mexico (si pais=MEX) o texto libre
  pais: string;            // catálogo paises_comunes (default "MEX")
  codigo_postal: string;
}

export interface CartaPorteUbicacion {
  /** ID temporal del frontend. NO se manda al SAT (se reemplaza por id real). */
  _temp_id: string;

  tipo_ubicacion: TipoUbicacion;
  /** ID que verá el SAT: OR000001 / DE000001 (auto-generado al timbrar). */
  id_ubicacion?: string;

  rfc_remitente_destinatario: string;
  num_reg_id_trib?: string;
  residencia_fiscal?: string;
  nombre_remitente_destinatario?: string;

  // Solo aplican a marítimo / aéreo / ferroviario
  num_estacion?: string;
  nombre_estacion?: string;
  navegacion_trafico?: string;
  tipo_estacion?: string;

  /** Fecha y hora de salida (si Origen) o llegada (si Destino). ISO string. */
  fecha_hora_salida_llegada: string;

  /** Solo en destinos: km recorridos desde la ubicación anterior. */
  distancia_recorrida?: number;

  domicilio: CartaPorteDomicilio;
}

// ─────────────────────────────────────────────────────────────
// 4) MERCANCÍAS DETALLADAS (líneas)
// ─────────────────────────────────────────────────────────────

export interface CartaPorteMercancia {
  _temp_id: string;

  /** Clave SAT del bien transportado (catálogo c_ClaveProdServCP). */
  bienes_transp: string;
  clave_sti?: string;
  descripcion: string;
  cantidad: number;
  clave_unidad: string;          // catálogo c_ClaveUnidad
  unidad?: string;
  dimensiones?: string;          // ej: "30/40/30plg"

  // Material peligroso
  material_peligroso: boolean;
  cve_material_peligroso?: string;
  embalaje?: string;
  desc_embalaje?: string;

  // COFEPRIS (medicamentos / sustancias controladas) — opcional
  sector_cofepris?: string;
  nombre_ingrediente_activo?: string;
  nom_quimico?: string;
  denominacion_generica_prod?: string;
  denominacion_distintiva_prod?: string;
  fabricante?: string;
  fecha_caducidad?: string;
  lote_medicamento?: string;
  forma_farmaceutica?: string;
  condiciones_esp_transp?: string;
  registro_sanitario_folio_autorizacion?: string;
  permiso_importacion?: string;
  folio_impo_vucem?: string;
  num_cas?: string;
  razon_social_emp_imp?: string;
  num_registro_sanitario_pl_imp?: string;

  // Peso y valor
  peso_en_kg: number;
  valor_mercancia?: number;
  moneda?: string;

  // Comercio exterior (solo si transp_internac="Sí")
  fraccion_arancelaria?: string;
  uuid_comercio_ext?: string;
  tipo_materia?: string;
  descripcion_materia?: string;

  // Estructuras flexibles (arrays)
  documentacion_aduanera?: DocumentacionAduanera[];
  guias_identificacion?: GuiaIdentificacion[];
  cantidad_transporta?: CantidadTransporta[];
  pedimentos?: Pedimento[];
}

export interface DocumentacionAduanera {
  tipo_documento: string;     // 01=Pedimento, 02=Distinto al Pedimento
  num_pedimento?: string;
  rfc_impo?: string;
  ident_doc_aduanero?: string;
}

export interface GuiaIdentificacion {
  numero_guia: string;
  descripcion: string;
  peso: number;
}

export interface CantidadTransporta {
  cantidad: number;
  id_origen: string;
  id_destino: string;
  cves_transporte?: string;
}

export interface Pedimento {
  pedimento: string;
}

// ─────────────────────────────────────────────────────────────
// 5) MODOS DE TRANSPORTE
// Cada uno guarda su propia estructura de datos. Solo se llena
// el modo que aplica al viaje (o varios si es multimodal).
// ─────────────────────────────────────────────────────────────

// 5a) AUTOTRANSPORTE (carretera)
export interface Autotransporte {
  perm_sct: string;                  // catálogo tipo_permiso_sct (TPAF01...)
  num_permiso_sct: string;
  identificacion_vehicular: IdentVehicular;
  seguros: SegurosAutotransporte;
  remolques?: Remolque[];
}

export interface IdentVehicular {
  config_vehicular: string;          // catálogo config_autotransporte (C2, T3S2...)
  peso_bruto_vehicular: number;
  placa_vm: string;                  // placa motriz
  anio_modelo_vm: number;
}

export interface SegurosAutotransporte {
  asegura_resp_civil: string;
  poliza_resp_civil: string;
  asegura_med_ambiente?: string;
  poliza_med_ambiente?: string;
  asegura_carga?: string;
  poliza_carga?: string;
  prima_seguro?: number;
}

export interface Remolque {
  subtipo_rem: string;               // catálogo subtipo_remolque (CTR001...)
  placa: string;
}

// 5b) MARÍTIMO
export interface TransporteMaritimo {
  perm_sct?: string;
  num_permiso_sct?: string;
  nombre_aseg?: string;
  num_poliza_seguro?: string;
  tipo_embarcacion: string;          // catálogo tipo_embarcacion
  matricula: string;
  numero_omi: string;
  anio_embarcacion: number;
  nombre_embarc: string;
  nacionalidad_embarc: string;
  unidades_de_arq_bruto: number;
  tipo_carga: string;                // catálogo tipo_carga
  num_cert_itc?: string;
  eslora: number;
  manga: number;
  calado: number;
  linea_naviera?: string;
  nombre_agente_naviero?: string;
  num_autorizacion_naviero?: string;
  num_viaje?: string;
  num_conoc_embarc?: string;
  /** Contenedores (lista). */
  contenedores?: ContenedorMaritimo[];
}

export interface ContenedorMaritimo {
  matricula_contenedor: string;
  tipo_contenedor: string;
  num_precinto?: string;
}

// 5c) AÉREO
export interface TransporteAereo {
  perm_sct: string;
  num_permiso_sct: string;
  matricula_aeronave: string;
  nombre_aseg: string;
  num_poliza_seguro: string;
  numero_guia: string;
  lugar_contrato: string;
  codigo_transportista: string;      // catálogo codigo_transporte_aereo (AAL, AMX...)
  rfc_embarcador?: string;
  num_reg_id_trib_embarc?: string;
  residencia_fiscal_embarc?: string;
  nombre_embarcador?: string;
}

// 5d) FERROVIARIO
export interface TransporteFerroviario {
  tipo_de_servicio: string;          // catálogo tipo_servicio_ferroviario (TS01...)
  tipo_de_trafico: string;           // catálogo tipo_trafico_ferroviario (TT01...)
  nombre_aseg?: string;
  num_poliza_seguro?: string;
  /** Derechos de paso (lista). */
  derechos_de_paso?: DerechoDePaso[];
  /** Carros del tren (lista). */
  carros: CarroFerroviario[];
}

export interface DerechoDePaso {
  tipo_derecho_de_paso: string;      // catálogo derechos_de_paso (CDP001/CDP002)
  kilometraje_pagado: number;
}

export interface CarroFerroviario {
  tipo_carro: string;                // catálogo tipo_carro (TC01...)
  matricula_carro: string;
  guia_carro: string;
  toneladas_netas_carro: number;
  /** Contenedores transportados en el carro. */
  contenedores?: ContenedorFerroviario[];
}

export interface ContenedorFerroviario {
  tipo_contenedor: string;
  placa_vm?: string;
  guia_contenedor: string;
}

// ─────────────────────────────────────────────────────────────
// 6) FIGURA TRANSPORTE
// ─────────────────────────────────────────────────────────────

export type TipoFiguraCode = "01" | "02" | "03" | "04";
// 01=Operador (chofer), 02=Propietario, 03=Arrendatario, 04=Notificado

export interface CartaPorteFigura {
  _temp_id: string;
  tipo_figura: TipoFiguraCode;

  rfc_figura?: string;
  num_licencia?: string;             // solo si tipo_figura=01 (Operador)
  nombre_figura?: string;
  num_reg_id_trib?: string;
  residencia_fiscal?: string;

  domicilio?: CartaPorteDomicilio;

  /** Solo para 02/03 (Propietario/Arrendatario): IDs de ubicaciones donde participa. */
  partes_transporte?: string[];
}

// ─────────────────────────────────────────────────────────────
// 7) RÉGIMEN ADUANERO (solo internacional)
// ─────────────────────────────────────────────────────────────

export interface RegimenAduaneroLine {
  _temp_id: string;
  regimen_aduanero: string;          // catálogo regimen_aduanero (IMD, EXD...)
}

// ─────────────────────────────────────────────────────────────
// 8) ESTRUCTURA COMPLETA: Carta Porte (lo que vive en el state del drawer)
// ─────────────────────────────────────────────────────────────

export interface CartaPorteData {
  header: CartaPorteHeader;
  mercancias_agregado: CartaPorteMercanciasAgregado;
  ubicaciones: CartaPorteUbicacion[];
  mercancias: CartaPorteMercancia[];

  autotransporte?: Autotransporte;
  transporte_maritimo?: TransporteMaritimo;
  transporte_aereo?: TransporteAereo;
  transporte_ferroviario?: TransporteFerroviario;

  figuras: CartaPorteFigura[];
  regimenes_aduaneros?: RegimenAduaneroLine[];
}

// ─────────────────────────────────────────────────────────────
// 9) TIPO RAÍZ: lo que se guarda en BD (CFDI base + Carta Porte)
// ─────────────────────────────────────────────────────────────

/** Indica si la Carta Porte va sobre un CFDI tipo I (Factura) o T (Traslado). */
export type CartaPorteParentType = "factura_carta_porte" | "traslado_carta_porte";

/** Status local del drawer (antes de enviar a BD). */
export type CartaPorteDraftStatus = "draft" | "ready" | "stamped";

// ═══════════════════════════════════════════════════════════════════════
// 10) DATOS DEL CFDI BASE (Cliente + Conceptos + datos fiscales)
// 
// Esto es la información que va FUERA del complemento Carta Porte.
// Junto con CartaPorteData forma el CFDI completo timbrado al SAT.
// ═══════════════════════════════════════════════════════════════════════

export interface CFDIClienteData {
  /** ID del cliente en BD (si se seleccionó de la lista). */
  client_id?: string;

  /** RFC del receptor. Para genéricos: XAXX010101000 (público) o XEXX010101000 (extranjero). */
  receiver_rfc: string;

  /** Razón social / nombre completo. */
  receiver_name: string;

  /** Régimen fiscal del receptor (catálogo SAT c_RegimenFiscal). Ej: "601", "612". */
  receiver_fiscal_regime: string;

  /** Código postal del domicilio fiscal (5 dígitos). */
  receiver_zip: string;

  /** Email del receptor (opcional, para enviar el CFDI). */
  receiver_email?: string;

  /** Uso del CFDI (catálogo SAT c_UsoCFDI). Ej: "G03", "S01". */
  receiver_cfdi_use: string;
}

export interface CFDIConceptoLine {
  _temp_id: string;

  /** Clave SAT del producto/servicio (catálogo c_ClaveProdServ). */
  product_key: string;

  /** Clave SAT de la unidad (catálogo c_ClaveUnidad). */
  unit_key: string;

  /** Descripción libre del concepto. */
  description: string;

  /** Unidad descriptiva (ej: "Servicio", "Pieza"). */
  unit?: string;

  /** Cantidad. */
  quantity: number;

  /** Precio unitario antes de impuestos. */
  unit_price: number;

  /** % de descuento sobre el subtotal. */
  discount_pct: number;

  /** Tasa de IVA traslado (0.16, 0, etc). 0 = exento. */
  tax_rate: number;

  /** Tasa de IVA retenido (típicamente 0.04 o 0). */
  retention_rate: number;

  /** ID del producto en BD (si vino de un producto registrado). */
  product_id?: string | null;
}

export interface CFDIBaseData {
  cliente: CFDIClienteData;
  conceptos: CFDIConceptoLine[];

  /** Moneda del CFDI: MXN, USD, etc. */
  currency: string;

  /** Tipo de cambio si moneda != MXN. */
  exchange_rate: number;

  /** Método de pago SAT: PUE (una sola exhibición) o PPD (parcialidades). */
  payment_method: "PUE" | "PPD";

  /** Forma de pago SAT (catálogo c_FormaPago). Ej: "03", "99". */
  payment_form: string;

  /** Notas internas (no fiscales). */
  notes?: string;
}

/** Estructura RAÍZ que combina CFDI base + Complemento Carta Porte. */
export interface CFDIConCartaPorteData {
  base: CFDIBaseData;
  carta_porte: CartaPorteData;
}
