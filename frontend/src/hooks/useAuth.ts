import { useEffect, useState } from 'react'
import { apiFetch } from '../api'

export type AuthMode = 'login' | 'signup'

export type UseAuthResult = {
  authLoading: boolean
  authError: string | null
  currentUser: any | null
  login: (credentials: any) => Promise<void>
  signup: (userData: any) => Promise<void>
  logout: () => void
}

export function useAuth(): UseAuthResult {
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any | null>(null)

  useEffect(() => {
    let isMounted = true
    const hardStopTimer = window.setTimeout(() => {
      if (isMounted) setAuthLoading(false)
    }, 15000)

    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('auth_user')

      if (token && storedUser) {
        try {
          const user = await apiFetch('/api/auth/me')
          setCurrentUser(user)
        } catch (e: any) {
          if (e?.message === 'AUTH_EXPIRED') {
            console.warn('[useAuth] Token expirado, redirecionando ao login.')
            setCurrentUser(null)
          } else {
            console.warn(
              '[useAuth] Falha transitoria ao validar token. Mantendo cache local de sessao.',
              e?.message
            )
            try {
              setCurrentUser(JSON.parse(storedUser))
            } catch {
              setCurrentUser(null)
            }
          }
        }
      }

      if (isMounted) setAuthLoading(false)
    }

    void checkAuth()
    return () => {
      isMounted = false
      window.clearTimeout(hardStopTimer)
    }
  }, [])

  const login = async (credentials: any) => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      setCurrentUser(data.user)
    } catch (e: any) {
      setAuthError(e.message)
      throw e
    } finally {
      setAuthLoading(false)
    }
  }

  const signup = async (userData: any) => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      const data = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      setCurrentUser(data.user)
    } catch (e: any) {
      setAuthError(e.message)
      throw e
    } finally {
      setAuthLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setCurrentUser(null)
  }

  return { authLoading, authError, currentUser, login, signup, logout }
}
