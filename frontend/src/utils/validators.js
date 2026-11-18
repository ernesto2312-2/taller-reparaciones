export function hasErrors(errors) {
  return Object.keys(errors).length > 0
}

export function validateCliente(values) {
  const errors = {}
  const nombre = String(values.nombre ?? '').trim()
  const telefono = String(values.telefono ?? '').trim()
  const direccion = String(values.direccion ?? '').trim()

  if (nombre.length < 2) {
    errors.nombre = 'Indique el nombre del cliente (mínimo 2 caracteres).'
  } else if (nombre.length > 120) {
    errors.nombre = 'El nombre no puede superar los 120 caracteres.'
  }

  const digitos = telefono.replace(/\D/g, '')
  if (digitos.length < 6) {
    errors.telefono = 'El teléfono debe contener al menos 6 dígitos.'
  } else if (telefono.length > 40) {
    errors.telefono = 'El teléfono no puede superar los 40 caracteres.'
  }

  if (direccion.length > 200) {
    errors.direccion = 'La dirección no puede superar los 200 caracteres.'
  }

  return errors
}

export function validateOrden(values) {
  const errors = {}
  const cliente = String(values.cliente ?? '').trim()
  const equipo = String(values.equipo ?? '').trim()
  const problema = String(values.problema ?? '').trim()

  if (!cliente) {
    errors.cliente = 'Seleccione el cliente de la orden.'
  }
  if (equipo.length < 2) {
    errors.equipo = 'Indique el equipo recibido (mínimo 2 caracteres).'
  } else if (equipo.length > 160) {
    errors.equipo = 'El equipo no puede superar los 160 caracteres.'
  }
  if (problema.length < 5) {
    errors.problema = 'Describa el problema con al menos 5 caracteres.'
  } else if (problema.length > 2000) {
    errors.problema = 'La descripción no puede superar los 2000 caracteres.'
  }

  return errors
}

/**
 * Valida y normaliza el presupuesto antes de enviarlo a la ruta de transición.
 * El total NO se envía: el servidor y la interfaz lo calculan a partir de
 * manoObra + cantidad × precio de cada pieza.
 */
export function prepararPresupuesto(values) {
  const errors = {}
  const diagnostico = String(values.diagnostico ?? '').trim()

  if (diagnostico.length < 3) {
    errors.diagnostico = 'Registre el diagnóstico técnico (mínimo 3 caracteres).'
  } else if (diagnostico.length > 2000) {
    errors.diagnostico = 'El diagnóstico no puede superar los 2000 caracteres.'
  }

  const manoObraRaw = String(values.manoObra ?? '').trim()
  let manoObra = 0
  if (manoObraRaw !== '') {
    manoObra = Number(manoObraRaw.replace(',', '.'))
    if (!Number.isFinite(manoObra) || manoObra < 0) {
      errors.manoObra = 'La mano de obra debe ser un número mayor o igual a 0.'
      manoObra = 0
    }
  }

  const rows = Array.isArray(values.piezas) ? values.piezas : []
  const piezas = []

  rows.forEach((row, index) => {
    const descripcion = String(row.descripcion ?? '').trim()
    const cantidadRaw = String(row.cantidad ?? '').trim()
    const precioRaw = String(row.precio ?? '').trim()

    // Las filas totalmente vacías se ignoran (la última fila suele estar vacía).
    if (!descripcion && !cantidadRaw && !precioRaw) return

    let cantidad = Number(cantidadRaw.replace(',', '.'))
    let precio = Number(precioRaw.replace(',', '.'))

    if (descripcion.length < 2) {
      errors[`pieza-${index}-descripcion`] = 'Describa la pieza.'
    }
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      errors[`pieza-${index}-cantidad`] = 'Cantidad entera ≥ 1.'
      cantidad = 1
    }
    if (!Number.isFinite(precio) || precio < 0) {
      errors[`pieza-${index}-precio`] = 'Precio ≥ 0.'
      precio = 0
    }

    piezas.push({ descripcion, cantidad, precio })
  })

  return {
    errors,
    values: {
      diagnostico,
      manoObra,
      piezas,
    },
  }
}
