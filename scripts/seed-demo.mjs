/**
 * Carga datos de demostración sin borrar información existente.
 *
 * Uso:
 *   node scripts/seed-demo.mjs
 *   POCKETBASE_URL=http://127.0.0.1:8090 node scripts/seed-demo.mjs
 *
 * Requisitos:
 *   - PocketBase iniciado con las migraciones y hooks del repositorio.
 *   - Node.js 18 o superior (usa fetch nativo).
 *
 * El script es idempotente: si ya existe un cliente con el mismo nombre y
 * teléfono, o una orden con el mismo cliente y equipo, no la duplica.
 */

const BASE_URL = (process.env.POCKETBASE_URL || 'http://127.0.0.1:8090').replace(/\/+$/, '')

const CLIENTES_DEMO = [
  {
    nombre: 'María González',
    telefono: '+53 5555 1234',
    direccion: 'Calle 12 #34, Vedado, La Habana',
  },
  {
    nombre: 'Carlos Rodríguez',
    telefono: '+53 5555 9876',
    direccion: 'Avenida 23 #456, Centro Habana',
  },
]

const ORDENES_DEMO = [
  {
    cliente: 'María González',
    equipo: 'Laptop Lenovo IdeaPad 3',
    problema:
      'No enciende después de un corte de corriente. El cliente reporta un olor a quemado.',
    estadoFinal: 'presupuestada',
    presupuesto: {
      diagnostico:
        'Fuente de alimentación dañada y conector DC flojo. Se recomienda sustituir ambos.',
      manoObra: 35,
      piezas: [
        { descripcion: 'Cargador Lenovo 65 W', cantidad: 1, precio: 28.5 },
        { descripcion: 'Conector DC', cantidad: 1, precio: 6 },
      ],
    },
  },
  {
    cliente: 'Carlos Rodríguez',
    equipo: 'Licuadora Oster 4655',
    problema: 'El motor no gira; hace un zumbido al enchufarla.',
    estadoFinal: 'en_reparacion',
    presupuesto: {
      diagnostico: 'Fusible térmico abierto y acople del vaso desgastado.',
      manoObra: 12,
      piezas: [{ descripcion: 'Fusible térmico', cantidad: 1, precio: 2.5 }],
    },
  },
  {
    cliente: 'María González',
    equipo: 'Televisor LG 43UM7100',
    problema: 'La pantalla se apaga a los pocos minutos y vuelve a encender sola.',
    estadoFinal: 'lista',
    presupuesto: {
      diagnostico:
        'Falla en la tarjeta de alimentación. Se reemplazaron capacitores electrolíticos.',
      manoObra: 40,
      piezas: [
        { descripcion: 'Kit de capacitores', cantidad: 1, precio: 10 },
        { descripcion: 'Pasta térmica', cantidad: 1, precio: 3 },
      ],
    },
  },
  {
    cliente: 'Carlos Rodríguez',
    equipo: 'Impresora HP DeskJet 2135',
    problema: 'No imprime en color y el carro se traba al mover el cabezal.',
    estadoFinal: 'en_diagnostico',
  },
  {
    cliente: 'Carlos Rodríguez',
    equipo: 'Microondas Samsung ME9114',
    problema: 'No calienta; la luz y el plato giratorio funcionan con normalidad.',
    estadoFinal: 'entregada',
    presupuesto: {
      diagnostico:
        'Magnetrón con filamento abierto. Se reemplazó el magnetrón y se revisó el capacitor.',
      manoObra: 30,
      piezas: [{ descripcion: 'Magnetrón universal', cantidad: 1, precio: 45 }],
    },
  },
]

const RUTA_HASTA = {
  solicitada: [],
  en_diagnostico: ['en_diagnostico'],
  presupuestada: ['en_diagnostico', 'presupuestada'],
  aprobada: ['en_diagnostico', 'presupuestada', 'aprobada'],
  en_reparacion: ['en_diagnostico', 'presupuestada', 'aprobada', 'en_reparacion'],
  lista: ['en_diagnostico', 'presupuestada', 'aprobada', 'en_reparacion', 'lista'],
  entregada: [
    'en_diagnostico',
    'presupuestada',
    'aprobada',
    'en_reparacion',
    'lista',
    'entregada',
  ],
}

function escapeFilter(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(
      `${method} ${path} → ${response.status}: ${payload?.message || response.statusText}`,
    )
  }

  return payload
}

async function buscarCliente(nombre) {
  const filter = `nombre = "${escapeFilter(nombre)}"`
  const query = new URLSearchParams({ filter, perPage: '1' })
  const result = await request(`/api/collections/clientes/records?${query}`)
  return result.items?.[0] || null
}

async function asegurarCliente(cliente) {
  const existente = await buscarCliente(cliente.nombre)
  if (existente) {
    console.log(`  = Cliente existente: ${cliente.nombre} (${existente.id})`)
    return existente
  }

  const creado = await request('/api/collections/clientes/records', {
    method: 'POST',
    body: cliente,
  })
  console.log(`  + Cliente creado: ${cliente.nombre} (${creado.id})`)
  return creado
}

async function buscarOrden(clienteId, equipo) {
  const filter = `cliente = "${escapeFilter(clienteId)}" && equipo = "${escapeFilter(equipo)}"`
  const query = new URLSearchParams({ filter, perPage: '1' })
  const result = await request(`/api/collections/ordenes/records?${query}`)
  return result.items?.[0] || null
}

async function transicionar(ordenId, estado, presupuesto) {
  return request(`/api/taller/ordenes/${ordenId}/transicion`, {
    method: 'POST',
    body: {
      estado,
      ...(estado === 'presupuestada' ? presupuesto : {}),
    },
  })
}

async function asegurarOrden(spec, clientesPorNombre) {
  const cliente = clientesPorNombre.get(spec.cliente)
  if (!cliente) {
    throw new Error(`No se encontró el cliente demo "${spec.cliente}".`)
  }

  const existente = await buscarOrden(cliente.id, spec.equipo)
  if (existente) {
    const aviso =
      existente.estado === spec.estadoFinal
        ? 'ya está en la etapa esperada'
        : `está en "${existente.estado}", se conserva sin cambios`
    console.log(`  = Orden existente: ${spec.equipo} (${existente.id}); ${aviso}.`)
    return existente
  }

  const orden = await request('/api/collections/ordenes/records', {
    method: 'POST',
    body: {
      cliente: cliente.id,
      equipo: spec.equipo,
      problema: spec.problema,
    },
  })
  console.log(`  + Orden creada: ${spec.equipo} (${orden.id}) → solicitada`)

  for (const etapa of RUTA_HASTA[spec.estadoFinal]) {
    await transicionar(orden.id, etapa, spec.presupuesto)
    console.log(`      → ${etapa}`)
  }

  return orden
}

async function main() {
  console.log(`Cargando datos demo en ${BASE_URL}\n`)

  await request('/api/health')

  console.log('Clientes:')
  const clientesPorNombre = new Map()
  for (const cliente of CLIENTES_DEMO) {
    const creado = await asegurarCliente(cliente)
    clientesPorNombre.set(cliente.nombre, creado)
  }

  console.log('\nÓrdenes:')
  for (const spec of ORDENES_DEMO) {
    await asegurarOrden(spec, clientesPorNombre)
  }

  const resumen = await request('/api/taller/resumen')
  console.log('\nResumen final:')
  console.log(`  Clientes: ${resumen.totalClientes}`)
  console.log(`  Órdenes:  ${resumen.totalOrdenes}`)
  console.log(`  Por etapa: ${JSON.stringify(resumen.porEstado)}`)
  console.log(`  Presupuesto registrado: ${resumen.totalPresupuestado}`)
  console.log('\nListo. Abra el frontend con: cd frontend && npm run dev')
}

main().catch((error) => {
  console.error('\nNo se pudieron cargar los datos demo.')
  console.error(error.message)
  process.exitCode = 1
})
