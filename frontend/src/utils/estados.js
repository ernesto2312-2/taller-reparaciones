export const ESTADOS = [
  'solicitada',
  'en_diagnostico',
  'presupuestada',
  'aprobada',
  'rechazada',
  'en_reparacion',
  'lista',
  'entregada',
  'cancelada',
]

export const ESTADO_LABELS = {
  solicitada: 'Solicitada',
  en_diagnostico: 'En diagnóstico',
  presupuestada: 'Presupuestada',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  en_reparacion: 'En reparación',
  lista: 'Lista para entregar',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
}

export const ESTADO_TONOS = {
  solicitada: 'blue',
  en_diagnostico: 'amber',
  presupuestada: 'purple',
  aprobada: 'cyan',
  rechazada: 'red',
  en_reparacion: 'orange',
  lista: 'teal',
  entregada: 'green',
  cancelada: 'slate',
}

export const ESTADO_DESCRIPCIONES = {
  solicitada: 'El equipo fue recibido y está en espera de revisión.',
  en_diagnostico: 'Se está revisando el equipo para preparar el presupuesto.',
  presupuestada: 'El presupuesto está registrado y se espera la decisión del cliente.',
  aprobada: 'El cliente aprobó el presupuesto; falta iniciar la reparación.',
  rechazada: 'El cliente rechazó el presupuesto. La orden está cerrada.',
  en_reparacion: 'La reparación está en curso.',
  lista: 'La reparación terminó y el equipo espera ser entregado.',
  entregada: 'El equipo fue entregado al cliente. La orden está cerrada.',
  cancelada: 'La orden se canceló antes de iniciar la revisión.',
}

// Cambios permitidos exactamente como en el enunciado del parcial.
export const TRANSICIONES = {
  solicitada: ['en_diagnostico', 'cancelada'],
  en_diagnostico: ['presupuestada'],
  presupuestada: ['aprobada', 'rechazada'],
  aprobada: ['en_reparacion'],
  en_reparacion: ['lista'],
  lista: ['entregada'],
  entregada: [],
  rechazada: [],
  cancelada: [],
}

export const ESTADOS_FINALES = ['entregada', 'rechazada', 'cancelada']
export const ESTADOS_FILTRO = ESTADOS

export const FLUJO_PRINCIPAL = [
  'solicitada',
  'en_diagnostico',
  'presupuestada',
  'aprobada',
  'en_reparacion',
  'lista',
  'entregada',
]

export const ACCIONES_TRANSICION = {
  en_diagnostico: {
    label: 'Iniciar diagnóstico',
    description: 'El equipo pasa a revisión técnica.',
  },
  presupuestada: {
    label: 'Registrar presupuesto',
    description: 'Se guardan el diagnóstico, la mano de obra y las piezas. Después no se pueden modificar.',
  },
  aprobada: {
    label: 'Cliente aprobó',
    description: 'El cliente aceptó el presupuesto.',
  },
  rechazada: {
    label: 'Cliente rechazó',
    description: 'La orden se cierra sin reparar.',
  },
  en_reparacion: {
    label: 'Iniciar reparación',
    description: 'Comienza el trabajo técnico sobre el equipo.',
  },
  lista: {
    label: 'Marcar como lista',
    description: 'La reparación terminó y el equipo queda listo para entregar.',
  },
  entregada: {
    label: 'Entregar equipo',
    description: 'El equipo vuelve al cliente y la orden se cierra.',
  },
  cancelada: {
    label: 'Cancelar orden',
    description: 'Solo se puede cancelar antes de iniciar el diagnóstico.',
  },
}

export function transicionesPermitidas(estado) {
  return TRANSICIONES[estado] ?? []
}

export function esEstadoFinal(estado) {
  return ESTADOS_FINALES.includes(estado)
}

export function construirFlujo(estado) {
  if (estado === 'rechazada') {
    return ['solicitada', 'en_diagnostico', 'presupuestada', 'rechazada']
  }
  if (estado === 'cancelada') {
    return ['solicitada', 'cancelada']
  }
  return FLUJO_PRINCIPAL
}
