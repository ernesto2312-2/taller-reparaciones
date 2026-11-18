# El Taller — Gestión de reparaciones

Aplicación web para registrar clientes, recibir equipos, controlar el avance de las reparaciones y consultar el historial de cada orden.

Trabajo práctico de **Segundo Parcial** — React + Vite + PocketBase.

---

## Funcionalidad

- **Panel** con totales por etapa, presupuesto registrado, últimas órdenes y atajos.
- **Clientes**: listar, buscar, crear, editar y eliminar. La eliminación se bloquea si el cliente tiene órdenes asociadas.
- **Órdenes**: crear, consultar, editar datos del equipo y adjuntar hasta 3 fotos.
- **Flujo de etapas** controlado: cada transición queda registrada automáticamente en el historial.
- **Presupuesto**: se registra una única vez al pasar a `presupuestada` y queda bloqueado. El total se calcula como mano de obra + piezas; no se almacena en la base de datos.
- **Estados de interfaz**: carga, vacío, error con reintento, confirmaciones, 404 y mensajes de validación.
- **Diseño responsive** para escritorio, tablet y móvil.

---

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19, JavaScript, Vite 8, React Router 8, CSS |
| Backend | PocketBase 0.41.1 (REST + JSVM) |
| Acceso a datos | `fetch` nativo, sin SDK de PocketBase |
| Persistencia | SQLite administrado por PocketBase |
| Fotos | Campo `file` de PocketBase |

No se utilizan librerías de componentes, manejo de estado global ni Node.js dentro de los hooks de React.

---

## Estructura del repositorio

```text
taller-reparaciones/
├── frontend/
│   ├── src/
│   │   ├── components/     Componentes reutilizables
│   │   ├── hooks/          Carga de datos y estado de la UI
│   │   ├── layouts/        Estructura visual de la aplicación
│   │   ├── pages/          Vistas por ruta
│   │   ├── services/       Acceso REST a PocketBase
│   │   └── utils/          Estados, filtros, formato y validaciones
│   └── .env.example
├── pb_hooks/
│   ├── taller.pb.js        Hooks, transiciones y rutas propias
│   └── lib/taller.js       Reglas de negocio compartidas
├── pb_migrations/
│   ├── 1794928657_created_clientes.js
│   └── 1794932000_create_ordenes_eventos.js
├── scripts/
│   ├── start-pocketbase.bat
│   ├── start-pocketbase.ps1
│   └── seed-demo.mjs
└── Poket Base/             Runtime local de PocketBase (no versionado)
```

`Poket Base/pb_data`, el ejecutable de PocketBase, `node_modules` y `dist` están excluidos por `.gitignore`: cada máquina genera sus propios datos locales.

---

## Requisitos

- **Node.js 20 o superior** (recomendado 22/24) y `npm`.
- **PocketBase 0.41.1**. La versión importa porque los hooks usan la API JSVM de PocketBase.
- Windows para los scripts `.bat`/`.ps1`. En Linux o macOS se puede arrancar PocketBase con el comando manual indicado abajo.

Descargue PocketBase desde <https://pocketbase.io/docs/> y coloque el binario en:

- Windows: `Poket Base\pocketbase.exe`
- Linux/macOS: `Poket Base/pocketbase`

La carpeta `Poket Base` no está en el repositorio (solo se versionan migraciones y hooks), así que créela si no existe.

---

## Puesta en marcha desde una máquina limpia

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repositorio>
cd taller-reparaciones
cd frontend
npm install
```

### 2. Configurar la URL de PocketBase

```bash
# Windows
copy .env.example .env

# Linux/macOS
cp .env.example .env
```

El valor por defecto es:

```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

### 3. Arrancar PocketBase

**Windows (cmd):**

```bat
scripts\start-pocketbase.bat
```

**Windows (PowerShell):**

```powershell
.\scripts\start-pocketbase.ps1
```

Si la política de ejecución bloquea el script `.ps1`, use el `.bat` o ejecute:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-pocketbase.ps1
```

**Comando manual (Windows):**

```bat
"Poket Base\pocketbase.exe" serve --http=127.0.0.1:8090 --dir="Poket Base\pb_data" --migrationsDir="pb_migrations" --hooksDir="pb_hooks"
```

**Linux/macOS:**

```bash
"Poket Base/pocketbase" serve --http=127.0.0.1:8090 \
  --dir="Poket Base/pb_data" \
  --migrationsDir="pb_migrations" \
  --hooksDir="pb_hooks"
```

En el primer arranque, PocketBase crea `Poket Base/pb_data` y aplica automáticamente las migraciones del repositorio. Si ya existía una base de datos, solo aplica las migraciones pendientes y **no borra los datos**.

Panel de administración de PocketBase: <http://127.0.0.1:8090/_/>. La aplicación no necesita autenticación para funcionar. Si desea entrar al panel, cree un superusuario con la CLI de PocketBase.

### 4. Arrancar el frontend

```bash
cd frontend
npm run dev
```

Abra <http://localhost:5173>.

### 5. Compilar para producción

```bash
cd frontend
npm run build
npm run preview
```

El resultado queda en `frontend/dist`.

---

## Datos de prueba

El enunciado pide **2 clientes** y **al menos 3 órdenes en etapas diferentes**. El repositorio incluye un cargador idempotente que crea datos de demostración sin eliminar información existente.

Con PocketBase iniciado:

```bash
node scripts/seed-demo.mjs
```

También se puede indicar otra URL:

```bash
POCKETBASE_URL=http://127.0.0.1:8090 node scripts/seed-demo.mjs
```

El script crea o reutiliza:

| Cliente | Equipo | Etapa |
| --- | --- | --- |
| María González | Laptop Lenovo IdeaPad 3 | `presupuestada` |
| Carlos Rodríguez | Licuadora Oster 4655 | `en_reparacion` |
| María González | Televisor LG 43UM7100 | `lista` |
| Carlos Rodríguez | Impresora HP DeskJet 2135 | `en_diagnostico` |
| Carlos Rodríguez | Microondas Samsung ME9114 | `entregada` |

Las órdenes de demostración incluyen presupuesto e historial en las etapas que lo requieren. Si la base ya tiene otros clientes, como `Juan Perez`, se conservan y el total de clientes será mayor.

El script no duplica registros: busca al cliente por nombre y la orden por cliente + equipo. Si una orden ya existe pero está en otra etapa, la conserva y lo informa.

> Las órdenes no se pueden eliminar desde la API por diseño. Para reiniciar una demostración sin datos reales, detenga PocketBase, haga copia de `Poket Base/pb_data` si la necesita y elimine esa carpeta. **No haga esto si la base contiene información que desea conservar.**

---

## Reglas de negocio

### Estados

```text
solicitada
en_diagnostico
presupuestada
aprobada
rechazada
en_reparacion
lista
entregada
cancelada
```

### Transiciones permitidas

```text
solicitada      → en_diagnostico | cancelada
en_diagnostico  → presupuestada
presupuestada   → aprobada | rechazada
aprobada        → en_reparacion
en_reparacion   → lista
lista           → entregada
```

Estados finales: `rechazada`, `cancelada` y `entregada`.

### Presupuesto

- Solo se registra al pasar de `en_diagnostico` a `presupuestada`.
- Requiere diagnóstico técnico.
- Incluye mano de obra y una lista de piezas (`descripcion`, `cantidad`, `precio`).
- Después de registrarse no se puede modificar.
- El total **no se almacena**: se calcula como `manoObra + Σ(cantidad × precio)`.

### Historial

Cada transición genera un registro en `eventos` con:

```text
orden, de, a, created
```

La creación de la orden se muestra en la interfaz a partir de `orden.created`; no se inserta un evento inicial duplicado.

### Reglas de acceso y validación

- Sin autenticación de usuarios: la interfaz está pensada para el personal del taller.
- Clientes y órdenes: listar, ver y crear permitido; actualizar permitido con validaciones.
- Eventos: solo lectura pública. Crear, editar o eliminar eventos está bloqueado.
- Borrar órdenes está bloqueado.
- Una orden entregada, rechazada o cancelada no se puede editar.
- Cambiar `estado` o el presupuesto mediante `PATCH` directo devuelve error; debe usarse la ruta de transición.
- El backend valida todo aunque la petición no venga de la interfaz.

### Rutas propias del backend

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/taller/resumen` | Totales por etapa y presupuesto registrado |
| `POST` | `/api/taller/ordenes/{id}/transicion` | Cambia de etapa y escribe el evento en una transacción |

Ejemplo de transición a presupuesto:

```bash
curl -X POST http://127.0.0.1:8090/api/taller/ordenes/ID/transicion \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "presupuestada",
    "diagnostico": "Fuente de alimentación dañada.",
    "manoObra": 35,
    "piezas": [
      { "descripcion": "Cargador 65 W", "cantidad": 1, "precio": 28.5 }
    ]
  }'
```

---

## Verificación

```bash
cd frontend
npm run lint
npm run build
```

Comprobación rápida del backend:

```bash
curl http://127.0.0.1:8090/api/health
curl http://127.0.0.1:8090/api/taller/resumen
```

Checklist manual recomendado:

1. Abrir el panel y comprobar los contadores.
2. Crear un cliente, editarlo y eliminar uno sin órdenes.
3. Intentar eliminar un cliente con órdenes: debe bloquearse.
4. Crear una orden con foto y comprobar el detalle.
5. Avanzar hasta `presupuestada`, registrar el presupuesto y verificar que queda bloqueado.
6. Recorrer el flujo hasta `entregada` y comprobar que desaparecen las acciones de edición.
7. Probar búsqueda, filtros por etapa, 404 y el estado de error deteniendo PocketBase.

---

## Solución de problemas

**`npm.ps1 cannot be loaded` en PowerShell**  
Use `npm.cmd run dev`, `npm.cmd run lint` o `npm.cmd run build`.

**“No se pudo conectar con PocketBase”**  
Verifique que PocketBase esté iniciado en `http://127.0.0.1:8090` y que `frontend/.env` apunte a esa URL.

**Las migraciones no se aplican**  
Arranque PocketBase con los scripts del repositorio o con los parámetros `--migrationsDir` y `--hooksDir` apuntando a las carpetas raíz. No copie los hooks dentro de `pb_data`.

**El puerto 8090 está ocupado**  
Detenga el proceso que lo usa o arranque PocketBase en otro puerto y actualice `VITE_POCKETBASE_URL` y `scripts/seed-demo.mjs` con `POCKETBASE_URL`.

**No aparecen las fotos**  
No elimine `Poket Base/pb_data/storage`. Las imágenes se sirven desde PocketBase y dependen de que el servidor esté iniciado.

**El script de PowerShell está bloqueado**  
Use `scripts\start-pocketbase.bat` o ejecute PowerShell con `-ExecutionPolicy Bypass`.

---

## Notas de seguridad

La aplicación no implementa login ni roles porque el enunciado no los solicita. Las reglas públicas están pensadas para un entorno local o de aula. Para un despliegue real habría que añadir autenticación, permisos por usuario y restringir las reglas de PocketBase.
