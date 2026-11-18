// Utilidades compartidas por los hooks del taller.
// PocketBase JSVM ejecuta cada handler en un contexto aislado, por eso este
// archivo se carga con require() dentro de cada hook.

const ESTADOS = [
  "solicitada",
  "en_diagnostico",
  "presupuestada",
  "aprobada",
  "rechazada",
  "en_reparacion",
  "lista",
  "entregada",
  "cancelada",
];

// Cambios permitidos, exactamente los de la tabla del enunciado.
const TRANSICIONES = {
  solicitada: ["en_diagnostico", "cancelada"],
  en_diagnostico: ["presupuestada"],
  presupuestada: ["aprobada", "rechazada"],
  aprobada: ["en_reparacion"],
  en_reparacion: ["lista"],
  lista: ["entregada"],
  entregada: [],
  rechazada: [],
  cancelada: [],
};

const ESTADOS_FINALES = ["entregada", "rechazada", "cancelada"];
const CAMPOS_PRESUPUESTO = ["diagnostico", "manoObra", "piezas"];

function fail(message) {
  throw new BadRequestError(message);
}

function asTrimmedString(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function isFinal(estado) {
  return ESTADOS_FINALES.indexOf(estado) !== -1;
}

function assertTransition(actual, siguiente) {
  const permitidos = TRANSICIONES[actual] || [];
  if (permitidos.indexOf(siguiente) === -1) {
    fail(
      "Cambio de etapa no permitido: " +
        (actual || "(sin estado)") +
        " → " +
        siguiente +
        ". Etapas permitidas: " +
        (permitidos.length ? permitidos.join(", ") : "ninguna (etapa final)") +
        ".",
    );
  }
}

function validateCliente(record) {
  const nombre = asTrimmedString(record.get("nombre"));
  const telefono = asTrimmedString(record.get("telefono"));
  const digitos = telefono.replace(/[^0-9]/g, "");

  if (nombre.length < 2) {
    fail("El nombre del cliente debe tener al menos 2 caracteres.");
  }
  if (nombre.length > 120) {
    fail("El nombre del cliente no puede superar los 120 caracteres.");
  }
  if (digitos.length < 6) {
    fail("El teléfono del cliente debe contener al menos 6 dígitos.");
  }
  if (telefono.length > 40) {
    fail("El teléfono del cliente no puede superar los 40 caracteres.");
  }

  record.set("nombre", nombre);
  record.set("telefono", telefono);
  record.set("direccion", asTrimmedString(record.get("direccion")));
}

function validateOrden(app, record) {
  const equipo = asTrimmedString(record.get("equipo"));
  const problema = asTrimmedString(record.get("problema"));
  const clienteId = asTrimmedString(record.get("cliente"));
  const estado = asTrimmedString(record.get("estado"));

  if (equipo.length < 2) {
    fail("El equipo debe tener al menos 2 caracteres.");
  }
  if (problema.length < 5) {
    fail("El problema debe describirse con al menos 5 caracteres.");
  }
  if (ESTADOS.indexOf(estado) === -1) {
    fail("El estado de la orden no es válido.");
  }
  if (!clienteId) {
    fail("La orden debe estar asociada a un cliente.");
  }

  let cliente = null;
  try {
    cliente = app.findRecordById("clientes", clienteId);
  } catch (_) {
    fail("El cliente seleccionado no existe.");
  }
  if (!cliente) {
    fail("El cliente seleccionado no existe.");
  }

  record.set("equipo", equipo);
  record.set("problema", problema);
}

function sameJson(a, b) {
  return JSON.stringify(a === undefined ? null : a) === JSON.stringify(b === undefined ? null : b);
}

function decodeJsonValue(value) {
  let list = value;

  if (typeof list === "string") {
    try {
      return JSON.parse(list);
    } catch (_) {
      return list;
    }
  }

  // En el JSVM, un campo JSON leído desde un Record puede llegar como una
  // lista de bytes UTF-8 ([]uint8) en lugar de como array de objetos.
  if (
    Array.isArray(list) &&
    list.length > 0 &&
    list.every(function (v) {
      return typeof v === "number" && v >= 0 && v <= 255;
    })
  ) {
    try {
      return JSON.parse(toString(list));
    } catch (_) {
      return list;
    }
  }

  return list;
}

function normalizePiezas(raw) {
  let list = raw;

  if (list === null || list === undefined || list === "") {
    return [];
  }

  list = decodeJsonValue(list);

  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch (_) {
      fail("La lista de piezas no es un JSON válido.");
    }
  }
  if (!Array.isArray(list)) {
    fail("Las piezas deben ser una lista.");
  }
  if (list.length > 50) {
    fail("La lista de piezas no puede superar las 50 filas.");
  }

  return list.map(function (item, index) {
    const descripcion = asTrimmedString(item && item.descripcion);
    const cantidad = Number(item && item.cantidad);
    const precio = Number(item && item.precio);

    if (descripcion.length < 2) {
      fail("La pieza #" + (index + 1) + " necesita una descripción.");
    }
    if (!isFinite(cantidad) || cantidad < 1 || Math.floor(cantidad) !== cantidad) {
      fail("La cantidad de la pieza #" + (index + 1) + " debe ser un entero mayor o igual a 1.");
    }
    if (!isFinite(precio) || precio < 0) {
      fail("El precio de la pieza #" + (index + 1) + " debe ser un número mayor o igual a 0.");
    }

    return {
      descripcion: descripcion,
      cantidad: cantidad,
      precio: precio,
    };
  });
}

function calcularTotal(record) {
  const manoObra = Number(record.get("manoObra") || 0);
  let piezas = decodeJsonValue(record.get("piezas"));

  if (!Array.isArray(piezas)) {
    piezas = [];
  }

  let total = isFinite(manoObra) && manoObra > 0 ? manoObra : 0;
  piezas.forEach(function (item) {
    const cantidad = Number(item && item.cantidad);
    const precio = Number(item && item.precio);
    if (isFinite(cantidad) && isFinite(precio)) {
      total += cantidad * precio;
    }
  });
  return total;
}

function assertClienteSinOrdenes(app, clienteId) {
  const ordenes = app.findRecordsByFilter(
    "ordenes",
    "cliente = {:cliente}",
    "",
    1,
    0,
    { cliente: clienteId },
  );

  if (ordenes.length > 0) {
    fail(
      "No se puede eliminar el cliente porque tiene órdenes asociadas. Elimine primero las órdenes o conserve el cliente.",
    );
  }
}

module.exports = {
  ESTADOS: ESTADOS,
  TRANSICIONES: TRANSICIONES,
  ESTADOS_FINALES: ESTADOS_FINALES,
  CAMPOS_PRESUPUESTO: CAMPOS_PRESUPUESTO,
  fail: fail,
  asTrimmedString: asTrimmedString,
  isFinal: isFinal,
  assertTransition: assertTransition,
  validateCliente: validateCliente,
  validateOrden: validateOrden,
  sameJson: sameJson,
  normalizePiezas: normalizePiezas,
  calcularTotal: calcularTotal,
  assertClienteSinOrdenes: assertClienteSinOrdenes,
};
