// ═══════════════════════════════════════════════════════════════════════
// Builders de valores default para Carta Porte 3.1
// 
// Cada función retorna una estructura vacía pero válida en términos de
// shape (TypeScript). El usuario la llena en el drawer.
// ═══════════════════════════════════════════════════════════════════════

import type {
  CartaPorteData,
  CartaPorteHeader,
  CartaPorteMercanciasAgregado,
  CartaPorteUbicacion,
  CartaPorteMercancia,
  CartaPorteFigura,
  CartaPorteDomicilio,
  Autotransporte,
  TransporteMaritimo,
  TransporteAereo,
  TransporteFerroviario,
  RegimenAduaneroLine,
  TipoFiguraCode,
  TipoUbicacion,
} from "./carta_porte.types";

// Generador de IDs temporales (para keys de React, NO se mandan al SAT)
let _tempIdCounter = 0;
function tempId(prefix = "tmp"): string {
  _tempIdCounter += 1;
  return `${prefix}_${Date.now()}_${_tempIdCounter}`;
}

// ─── Domicilio vacío (México por default) ───
export function defaultDomicilio(): CartaPorteDomicilio {
  return {
    calle: "",
    numero_exterior: "",
    numero_interior: "",
    colonia: "",
    localidad: "",
    referencia: "",
    municipio: "",
    estado: "",
    pais: "MEX",
    codigo_postal: "",
  };
}

// ─── Cabecera vacía (no internacional, sin modos) ───
export function defaultHeader(): CartaPorteHeader {
  return {
    version: "3.1",
    transp_internac: "No",
    total_dist_rec: 0,
    modos_transporte: [],
  };
}

// ─── Totales de mercancías ───
export function defaultMercanciasAgregado(): CartaPorteMercanciasAgregado {
  return {
    peso_bruto_total: 0,
    unidad_peso: "KGM",
    num_total_mercancias: 0,
  };
}

// ─── Nueva ubicación (Origen o Destino) ───
export function newUbicacion(tipo: TipoUbicacion): CartaPorteUbicacion {
  return {
    _temp_id: tempId(tipo === "Origen" ? "or" : "de"),
    tipo_ubicacion: tipo,
    rfc_remitente_destinatario: "",
    fecha_hora_salida_llegada: new Date().toISOString().slice(0, 16),
    distancia_recorrida: tipo === "Destino" ? 0 : undefined,
    domicilio: defaultDomicilio(),
  };
}

// ─── Nueva mercancía ───
export function newMercancia(): CartaPorteMercancia {
  return {
    _temp_id: tempId("mer"),
    bienes_transp: "",
    descripcion: "",
    cantidad: 1,
    clave_unidad: "KGM",
    material_peligroso: false,
    peso_en_kg: 0,
  };
}

// ─── Nueva figura (Operador, Propietario, etc.) ───
export function newFigura(tipo: TipoFiguraCode = "01"): CartaPorteFigura {
  return {
    _temp_id: tempId("fig"),
    tipo_figura: tipo,
    rfc_figura: "",
    nombre_figura: "",
    domicilio: defaultDomicilio(),
  };
}

// ─── Nuevo régimen aduanero ───
export function newRegimenAduanero(): RegimenAduaneroLine {
  return {
    _temp_id: tempId("reg"),
    regimen_aduanero: "",
  };
}

// ─── Autotransporte vacío ───
export function defaultAutotransporte(): Autotransporte {
  return {
    perm_sct: "",
    num_permiso_sct: "",
    identificacion_vehicular: {
      config_vehicular: "",
      peso_bruto_vehicular: 0,
      placa_vm: "",
      anio_modelo_vm: new Date().getFullYear(),
    },
    seguros: {
      asegura_resp_civil: "",
      poliza_resp_civil: "",
    },
    remolques: [],
  };
}

// ─── Marítimo vacío ───
export function defaultMaritimo(): TransporteMaritimo {
  return {
    tipo_embarcacion: "",
    matricula: "",
    numero_omi: "",
    anio_embarcacion: new Date().getFullYear(),
    nombre_embarc: "",
    nacionalidad_embarc: "MEX",
    unidades_de_arq_bruto: 0,
    tipo_carga: "",
    eslora: 0,
    manga: 0,
    calado: 0,
    contenedores: [],
  };
}

// ─── Aéreo vacío ───
export function defaultAereo(): TransporteAereo {
  return {
    perm_sct: "",
    num_permiso_sct: "",
    matricula_aeronave: "",
    nombre_aseg: "",
    num_poliza_seguro: "",
    numero_guia: "",
    lugar_contrato: "",
    codigo_transportista: "",
  };
}

// ─── Ferroviario vacío ───
export function defaultFerroviario(): TransporteFerroviario {
  return {
    tipo_de_servicio: "",
    tipo_de_trafico: "",
    derechos_de_paso: [],
    carros: [],
  };
}

// ─── Carta Porte completa vacía ───
export function defaultCartaPorteData(): CartaPorteData {
  return {
    header: defaultHeader(),
    mercancias_agregado: defaultMercanciasAgregado(),
    ubicaciones: [
      newUbicacion("Origen"),
      newUbicacion("Destino"),
    ],
    mercancias: [],
    figuras: [],
  };
}
