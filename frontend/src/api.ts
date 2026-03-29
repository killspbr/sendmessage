/**
 * Utilitario para chamadas API ao backend proprio.
 */

const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://sendmessage-backend.claudio-rodrigues-seconci.workers.dev'
    : 'http://localhost:4000')

function clearAuthStorage() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
}

function createAuthExpiredError(status: number) {
  const authError = new Error('AUTH_EXPIRED')
  ;(authError as any).status = status
  return authError
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 12000) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

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
  const token = localStorage.getItem('auth_token')
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const method = String(options.method || 'GET').toUpperCase()
  const canRetry = method === 'GET' || endpoint === '/api/auth/presence'

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
      })

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
    throw fetchError instanceof Error ? fetchError : new Error(String(fetchError || 'Falha de rede'))
  }

  if (response.status === 401 || response.status === 403) {
    clearAuthStorage()
    throw createAuthExpiredError(response.status)
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Erro na requisicao: ${response.status}`)
  }

  return response.json()
}

type ApiUploadOptions = {
  method?: string
  headers?: Record<string, string>
  onProgress?: (progress: { loaded: number; total: number; percent: number }) => void
}

export function apiUpload(endpoint: string, body: FormData, options: ApiUploadOptions = {}) {
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
      reject(new Error('Falha de rede durante o upload.'))
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
        reject(createAuthExpiredError(xhr.status))
        return
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        const errorMessage =
          parsedResponse?.error ||
          parsedResponse?.message ||
          `Erro na requisicao: ${xhr.status}`
        reject(
          new Error(
            typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)
          )
        )
        return
      }

      resolve(parsedResponse)
    }

    xhr.send(body)
  })
}
