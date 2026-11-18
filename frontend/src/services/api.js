const rawBaseUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'

export const POCKETBASE_URL = rawBaseUrl.replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = {}, payload = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.payload = payload
  }
}

function buildQuery(query) {
  if (!query) return ''
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    params.set(key, String(value))
  })
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

/**
 * Única puerta de salida HTTP hacia PocketBase. Centraliza:
 * - URL base configurable por entorno.
 * - Serialización JSON / multipart.
 * - AbortSignal para cancelar peticiones al desmontar componentes.
 * - Normalización de errores de PocketBase (incluidos los de validación).
 */
export async function request(path, { method = 'GET', body, query, signal, headers } = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const requestHeaders = { ...(headers || {}) }
  const options = { method, signal, headers: requestHeaders }

  if (body !== undefined) {
    if (isFormData) {
      options.body = body
    } else {
      requestHeaders['Content-Type'] = 'application/json'
      options.body = JSON.stringify(body)
    }
  }

  let response
  try {
    response = await fetch(`${POCKETBASE_URL}${path}${buildQuery(query)}`, options)
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError(
      'No se pudo conectar con PocketBase. Compruebe que el servidor esté iniciado en ' +
        POCKETBASE_URL +
        '.',
      { status: 0 },
    )
  }

  if (response.status === 204) return null

  const text = await response.text()
  let payload
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = text
  }

  if (!response.ok) {
    const fieldErrors = {}
    if (payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object') {
      Object.entries(payload.data).forEach(([field, detail]) => {
        if (detail && typeof detail === 'object' && detail.message) {
          fieldErrors[field] = detail.message
        }
      })
    }

    const firstFieldError = Object.values(fieldErrors)[0]
    const message =
      firstFieldError ||
      (payload && typeof payload === 'object' && payload.message) ||
      `Error ${response.status} al comunicarse con PocketBase.`

    throw new ApiError(message, {
      status: response.status,
      fieldErrors,
      payload,
    })
  }

  return payload
}
