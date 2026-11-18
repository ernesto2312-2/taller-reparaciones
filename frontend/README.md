# Frontend — El Taller

Interfaz React + Vite del sistema de gestión de reparaciones.

La documentación completa (instalación, PocketBase, datos de prueba y reglas de negocio) está en el [README principal](../README.md).

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Variables de entorno

Copie `.env.example` como `.env`:

```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

## Organización

```text
src/
├── components/   Componentes reutilizables
├── hooks/        Carga de datos y estado
├── layouts/      Estructura visual
├── pages/        Vistas por ruta
├── services/     Acceso REST a PocketBase
└── utils/        Estados, filtros, formatos y validaciones
```
