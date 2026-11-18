/// <reference path="../pb_data/types.d.ts" />

// Esquema del taller según el enunciado del Segundo Parcial.
// - clientes: nombre, telefono (+ direccion opcional heredada del avance inicial)
// - ordenes: cliente, equipo, problema, estado, diagnostico, manoObra, piezas, fotos
// - eventos: orden, de, a + created (fecha automática)
//
// Como la aplicación no tiene autenticación, las reglas públicas permiten
// listar/crear/actualizar lo que el taller necesita. Lo que nunca debe ocurrir
// queda bloqueado en las reglas (borrar órdenes, editar/borrar/crear eventos
// desde la API) y las validaciones de negocio viven en pb_hooks/taller.pb.js.
migrate((app) => {
  const clientes = app.findCollectionByNameOrId("clientes");

  clientes.listRule = "";
  clientes.viewRule = "";
  clientes.createRule = "";
  clientes.updateRule = "";
  clientes.deleteRule = "";
  app.save(clientes);

  const ordenes = new Collection({
    "id": "pbc_6154942387",
    "name": "ordenes",
    "type": "base",
    "system": false,
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "help": "",
        "hidden": false,
        "id": "text3208210257",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_279994318",
        "help": "Cliente que trae el equipo al taller.",
        "hidden": false,
        "id": "relation5287162841",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "cliente",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "help": "Equipo recibido (teléfono, laptop, televisor...).",
        "hidden": false,
        "id": "text2831547092",
        "max": 160,
        "min": 1,
        "name": "equipo",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "help": "Descripción del problema reportado por el cliente.",
        "hidden": false,
        "id": "text3648201759",
        "max": 2000,
        "min": 1,
        "name": "problema",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "help": "",
        "hidden": false,
        "id": "select7152840936",
        "maxSelect": 1,
        "name": "estado",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "solicitada",
          "en_diagnostico",
          "presupuestada",
          "aprobada",
          "rechazada",
          "en_reparacion",
          "lista",
          "entregada",
          "cancelada"
        ]
      },
      {
        "autogeneratePattern": "",
        "help": "Diagnóstico técnico. Se registra al presupuestar y no se modifica después.",
        "hidden": false,
        "id": "text5728193046",
        "max": 2000,
        "min": 0,
        "name": "diagnostico",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "help": "Mano de obra del presupuesto. Se registra al presupuestar y no se modifica después.",
        "hidden": false,
        "id": "number4918273650",
        "max": null,
        "min": 0,
        "name": "manoObra",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "help": "Lista JSON de piezas: [{descripcion, cantidad, precio}]. El total se calcula, no se guarda.",
        "hidden": false,
        "id": "json7182936450",
        "maxSize": 0,
        "name": "piezas",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "help": "Hasta 3 imágenes del equipo.",
        "hidden": false,
        "id": "file8137294056",
        "maxSelect": 3,
        "maxSize": 5242880,
        "mimeTypes": [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif"
        ],
        "name": "fotos",
        "presentable": false,
        "required": false,
        "system": false,
        "thumbs": [
          "320x240",
          "640x480"
        ],
        "type": "file"
      },
      {
        "hidden": false,
        "id": "autodate2990389177",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085496",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_ordenes_cliente` ON `ordenes` (`cliente`)",
      "CREATE INDEX `idx_ordenes_estado` ON `ordenes` (`estado`)"
    ]
  });
  app.save(ordenes);

  const eventos = new Collection({
    "id": "pbc_3264198552",
    "name": "eventos",
    "type": "base",
    "system": false,
    "listRule": "",
    "viewRule": "",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "help": "",
        "hidden": false,
        "id": "text3208210258",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": true,
        "collectionId": "pbc_6154942387",
        "help": "Orden a la que pertenece el cambio de etapa.",
        "hidden": false,
        "id": "relation6192835470",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "orden",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "help": "Estado anterior. Vacío en el evento inicial (no se usa: la creación no es un cambio).",
        "hidden": false,
        "id": "text3092847156",
        "max": 40,
        "min": 0,
        "name": "de",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "help": "Estado nuevo.",
        "hidden": false,
        "id": "text7482910365",
        "max": 40,
        "min": 1,
        "name": "a",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "autodate2990389178",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_eventos_orden` ON `eventos` (`orden`)",
      "CREATE INDEX `idx_eventos_created` ON `eventos` (`created`)"
    ]
  });
  app.save(eventos);
}, (app) => {
  const eventos = app.findCollectionByNameOrId("eventos");
  app.delete(eventos);

  const ordenes = app.findCollectionByNameOrId("ordenes");
  app.delete(ordenes);

  const clientes = app.findCollectionByNameOrId("clientes");
  clientes.listRule = null;
  clientes.viewRule = null;
  clientes.createRule = null;
  clientes.updateRule = null;
  clientes.deleteRule = null;
  app.save(clientes);
});
