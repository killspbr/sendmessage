/**
 * Utilitario para chamadas API ao backend proprio.
 */

export const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://sendmessage-backend.claudio-rodrigues-seconci.workers.dev'
    : 'http://localhost:4000')

const MAX_CONCURRENT_API_REQUESTS = 4
let activeApiRequests = 0
const apiRequestQueue: Array<() => void> = []

async function acquireApiSlot() {
  if (activeApiRequests < MAX_CONCURRENT_API_REQUESTS) {
    activeApiRequests += 1
    return
  }

  await new Promise<void>((resolve) => {
    apiRequestQueue.push(() => {
      activeApiRequests += 1
      resolve()
    })
  })
}

function releaseApiSlot() {
  activeApiRequests = Math.max(0, activeApiRequests - 1)
  const next = apiRequestQueue.shift()
  if (next) next()
}

function clearAuthStorage() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
}

function createAuthExpiredError(status: number) {
  const authError = new Error('AUTH_EXPIRED')
  ;(authError as any).status = status
  return authError
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 0) {
  if (!timeoutMs || timeoutMs <= 0) {
    return fetch(url, init)
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort('REQUEST_TIMEOUT'), timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  await acquireApiSlot()
  try {
  const token = localStorage.getItem('auth_token')
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const method = String(options.method || 'GET').toUpperCase()
  const isLoginEndpoint = endpoint === '/api/auth/login'
  const canRetry =
    method === 'GET' ||
    endpoint === '/api/auth/presence' ||
    endpoint === '/api/auth/me' ||
    isLoginEndpoint
  const isAuthCriticalEndpoint =
    endpoint === '/api/auth/login' ||
    endpoint === '/api/auth/signup' ||
    endpoint === '/api/auth/me'

  const timeoutMs = isAuthCriticalEndpoint
    ? 0
    : endpoint === '/api/auth/presence'
      ? 20000
      : 45000

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as any) || {}),
  }

  if (!isFormData && !(headers as any)['Content-Type']) {
    ;(headers as any)['Content-Type'] = 'application/json'
  }

    let response: Response | null = null
    let fetchError: unknown = null

    for (let attempt = 1; attempt <= (canRetry ? 2 : 1); attempt += 1) {
      try {
        response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
          ...options,
          headers,
        }, timeoutMs)

        if (response.status >= 500 && attempt < (canRetry ? 2 : 1)) {
          await new Promise((resolve) => setTimeout(resolve, 350 * attempt))
          continue
        }
        break
      } catch (error) {
        fetchError = error
        if (attempt < (canRetry ? 2 : 1)) {
          await new Promise((resolve) => setTimeout(resolve, 350 * attempt))
          continue
        }
      }
    }

    if (!response) {
      if (fetchError && typeof fetchError === 'object' && (fetchError as any).name === 'AbortError') {
        throw new Error('Tempo limite de resposta excedido. Tente novamente.')
      }
      throw fetchError instanceof Error ? fetchError : new Error(String(fetchError || 'Falha de rede'))
    }

    if (response.status === 401) {
      clearAuthStorage()
      throw createAuthExpiredError(response.status)
    }

    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Acesso negado.')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as any))
      const combinedMsg = errorData.technical || errorData.error || `Erro na requisicao: ${response.status}`
      const apiError = new Error(combinedMsg)
      ;(apiError as any).status = response.status
      ;(apiError as any).error = errorData.error
      ;(apiError as any).technical = errorData.technical
      ;(apiError as any).details = errorData.details
      throw apiError
    }

    return response.json()
  } finally {
    releaseApiSlot()
  }
}

type ApiUploadOptions = {
  method?: string
  headers?: Record<string, string>
  onProgress?: (progress: { loaded: number; total: number; percent: number }) => void
}

export async function apiUpload(endpoint: string, body: FormData, options: ApiUploadOptions = {}, maxRetries = 2) {
  let attempt = 0
  
  const execute = () => {
    const token = localStorage.getItem('auth_token')
    return new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open(options.method || 'POST', `${API_URL}${endpoint}`)
      xhr.responseType = 'text'

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

      Object.entries(options.headers || {}).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value)
      })

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable || !options.onProgress) return

        options.onProgress({
          loaded: event.loaded,
          total: event.total,
          percent: Math.min(100, Math.round((event.loaded / event.total) * 100)),
        })
      }

      xhr.onerror = () => {
        reject({ type: 'network', error: new Error('Falha de rede durante o upload.') })
      }

      xhr.onload = () => {
        const rawResponse = xhr.responseText || ''
        let parsedResponse: any = null

        if (rawResponse) {
          try {
            parsedResponse = JSON.parse(rawResponse)
          } catch {
            parsedResponse = null
          }
        }

        if (xhr.status === 401 || xhr.status === 403) {
          clearAuthStorage()
          reject({ type: 'auth', status: xhr.status, error: createAuthExpiredError(xhr.status) })
          return
        }

        if (xhr.status < 200 || xhr.status >= 300) {
          const errorMessage =
            parsedResponse?.error ||
            parsedResponse?.message ||
            `Erro na requisicao: ${xhr.status}`
          const err: any = new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage))
          err.status = xhr.status
          reject({ type: 'http', status: xhr.status, error: err })
          return
        }

        resolve(parsedResponse)
      }

      xhr.send(body)
    })
  }

  while (attempt <= maxRetries) {
    try {
      return await execute()
    } catch (err: any) {
      const isRetryable = err.type === 'network' || (err.type === 'http' && err.status >= 500)
      if (isRetryable && attempt < maxRetries) {
        attempt += 1
        console.warn(`[apiUpload] Tentando novamente (${attempt}/${maxRetries})...`)
        await new Promise(r => setTimeout(r, 1000 * attempt))
        continue
      }
      throw err.error || err
    }
  }
}
