/// <reference path="../pb_data/types.d.ts" />

// ---------------------------------------------------------------------------
// Reglas de negocio del taller (PocketBase JSVM, no Node.js)
// ---------------------------------------------------------------------------
// La interfaz no es una medida de seguridad: estas comprobaciones se aplican
// también a cualquier petición directa a la API. Cada handler carga el módulo
// compartido porque PocketBase ejecuta los handlers en contextos aislados.
// ---------------------------------------------------------------------------

// ------------------------------- clientes ---------------------------------

onRecordCreateRequest((e) => {
  const t = require(`${__hooks}/lib/taller.js`);
  t.validateCliente(e.record);
  e.next();
}, "clientes");

onRecordUpdateRequest((e) => {
  const t = require(`${__hooks}/lib/taller.js`);
  t.validateCliente(e.record);
  e.next();
}, "clientes");

onRecordDeleteRequest((e) => {
  const t = require(`${__hooks}/lib/taller.js`);
  t.assertClienteSinOrdenes($app, e.record.id);
  e.next();
}, "clientes");

onRecordDelete((e) => {
  const t = require(`${__hooks}/lib/taller.js`);
  t.assertClienteSinOrdenes($app, e.record.id);
  e.next();
}, "clientes");

// ------------------------------- ordenes ----------------------------------

onRecordCreateRequest((e) => {
  const t = require(`${__hooks}/lib/taller.js`);

  // Una orden nace siempre en "solicitada": no se puede crear una orden ya
  // avanzada ni con un presupuesto cargado.
  e.record.set("estado", "solicitada");
  e.record.set("diagnostico", "");
  e.record.set("manoObra", 0);
  e.record.set("piezas", []);
  t.validateOrden($app, e.record);
  e.next();
}, "ordenes");

onRecordCreate((e) => {
  const t = require(`${__hooks}/lib/taller.js`);

  e.record.set("estado", "solicitada");
  e.record.set("diagnostico", "");
  e.record.set("manoObra", 0);
  e.record.set("piezas", []);
  t.validateOrden($app, e.record);
  e.next();
}, "ordenes");

onRecordUpdateRequest((e) => {
  const t = require(`${__hooks}/lib/taller.js`);
  const original = e.record.original();
  const anterior = original ? original.getString("estado") : "";
  const siguiente = e.record.getString("estado");

  if (anterior !== siguiente) {
    t.fail(
      "El estado de una orden solo se cambia mediante la transición del taller (POST /api/taller/ordenes/:id/transicion).",
    );
  }

  if (t.isFinal(anterior)) {
    t.fail("Una orden " + anterior + " es definitiva y no se puede modificar.");
  }

  t.CAMPOS_PRESUPUESTO.forEach(function (campo) {
    const antes = original ? original.get(campo) : null;
    if (!t.sameJson(antes, e.record.get(campo))) {
      t.fail("El presupuesto se registra una sola vez al pasar a presupuestada y no se modifica después.");
    }
  });

  t.validateOrden($app, e.record);
  e.next();
}, "ordenes");

onRecordUpdate((e) => {
  const t = require(`${__hooks}/lib/taller.js`);
  const original = e.record.original();
  const anterior = original ? original.getString("estado") : "";
  const siguiente = e.record.getString("estado");

  if (t.isFinal(anterior)) {
    t.fail("Una orden " + anterior + " es definitiva y no se puede modificar.");
  }

  if (anterior !== siguiente) {
    t.assertTransition(anterior, siguiente);
  }

  const esPresupuestacion = anterior === "en_diagnostico" && siguiente === "presupuestada";

  if (!esPresupuestacion) {
    t.CAMPOS_PRESUPUESTO.forEach(function (campo) {
      const antes = original ? original.get(campo) : null;
      if (!t.sameJson(antes, e.record.get(campo))) {
        t.fail("El presupuesto ya está cerrado y no se puede modificar.");
      }
    });
  } else {
    const diagnostico = t.asTrimmedString(e.record.get("diagnostico"));
    const manoObra = Number(e.record.get("manoObra") || 0);

    if (diagnostico.length < 3) {
      t.fail("Para presupuestar debe registrar un diagnóstico.");
    }
    if (!isFinite(manoObra) || manoObra < 0) {
      t.fail("La mano de obra debe ser un número mayor o igual a 0.");
    }

    e.record.set("diagnostico", diagnostico);
    e.record.set("manoObra", manoObra);
    e.record.set("piezas", t.normalizePiezas(e.record.get("piezas")));
  }

  t.validateOrden($app, e.record);
  e.next();
}, "ordenes");

// ---------------------------------------------------------------------------
// Rutas propias
// ---------------------------------------------------------------------------

// GET /api/taller/resumen → contadores por etapa + total presupuestado calculado.
routerAdd("GET", "/api/taller/resumen", (e) => {
  const t = require(`${__hooks}/lib/taller.js`);
  const porEstado = {};

  t.ESTADOS.forEach(function (estado) {
    porEstado[estado] = $app.countRecords("ordenes", $dbx.hashExp({ estado: estado }));
  });

  const ordenes = $app.findRecordsByFilter("ordenes", "", "-created", 2000, 0);
  let totalPresupuestado = 0;
  let ordenesPresupuestadas = 0;

  ordenes.forEach(function (orden) {
    const estado = orden.getString("estado");
    if (
      estado === "presupuestada" ||
      estado === "aprobada" ||
      estado === "en_reparacion" ||
      estado === "lista" ||
      estado === "entregada"
    ) {
      totalPresupuestado += t.calcularTotal(orden);
      ordenesPresupuestadas++;
    }
  });

  return e.json(200, {
    totalClientes: $app.countRecords("clientes"),
    totalOrdenes: $app.countRecords("ordenes"),
    porEstado: porEstado,
    ordenesPresupuestadas: ordenesPresupuestadas,
    totalPresupuestado: totalPresupuestado,
  });
});

// POST /api/taller/ordenes/{id}/transicion
// Body: { estado, diagnostico?, manoObra?, piezas? }
// Cambia la etapa y escribe el evento en una sola transacción.
routerAdd("POST", "/api/taller/ordenes/{id}/transicion", (e) => {
  const t = require(`${__hooks}/lib/taller.js`);
  const id = e.request.pathValue("id");
  const body = e.requestInfo().body || {};
  const siguiente = t.asTrimmedString(body.estado);

  if (t.ESTADOS.indexOf(siguiente) === -1) {
    t.fail("El estado solicitado no es válido.");
  }

  let estadoFinal = "";

  $app.runInTransaction((txApp) => {
    let orden;
    try {
      orden = txApp.findRecordById("ordenes", id);
    } catch (_) {
      throw new NotFoundError("La orden no existe.");
    }

    const actual = orden.getString("estado");
    t.assertTransition(actual, siguiente);

    if (siguiente === "presupuestada") {
      const diagnostico = t.asTrimmedString(body.diagnostico);
      const manoObra = Number(body.manoObra === undefined || body.manoObra === "" ? 0 : body.manoObra);
      const piezas = t.normalizePiezas(body.piezas);

      if (diagnostico.length < 3) {
        t.fail("Para presupuestar debe registrar un diagnóstico.");
      }
      if (!isFinite(manoObra) || manoObra < 0) {
        t.fail("La mano de obra debe ser un número mayor o igual a 0.");
      }

      orden.set("diagnostico", diagnostico);
      orden.set("manoObra", manoObra);
      orden.set("piezas", piezas);
    }

    orden.set("estado", siguiente);
    txApp.save(orden);

    const evento = new Record(txApp.findCollectionByNameOrId("eventos"), {
      orden: orden.id,
      de: actual,
      a: siguiente,
    });
    txApp.save(evento);

    estadoFinal = siguiente;
  });

  return e.json(200, {
    ok: true,
    id: id,
    estado: estadoFinal,
  });
});
