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
        const checkAuth = async () => {
            const token = localStorage.getItem('auth_token')
            const storedUser = localStorage.getItem('auth_user')

            if (token && storedUser) {
                try {
                    // Valida se o token ainda é aceito pelo backend
                    const user = await apiFetch('/api/auth/me')
                    setCurrentUser(user)
                } catch (e: any) {
                    if (e.message === 'AUTH_EXPIRED') {
                        // Token inválido ou expirado — estado já limpo pelo apiFetch
                        console.warn('[useAuth] Token expirado, redirecionando ao login.')
                        setCurrentUser(null)
                    } else {
                        // Erro de rede ou outro problema temporário — mantém sessão usando cache local
                        console.warn('[useAuth] Falha ao validar token (rede?), usando cache local.', e.message)
                        try {
                            setCurrentUser(JSON.parse(storedUser))
                        } catch {
                            setCurrentUser(null)
                        }
                    }
                }
            }
            setAuthLoading(false)
        }

        void checkAuth()
    }, [])


    const login = async (credentials: any) => {
        setAuthLoading(true)
        setAuthError(null)
        try {
            const data = await apiFetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
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
                body: JSON.stringify(userData)
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
