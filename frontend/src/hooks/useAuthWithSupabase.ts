import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { logError } from '../utils'

export type AuthMode = 'login' | 'signup'

export type UseAuthResult = {
  authLoading: boolean
  authError: string | null
  currentUser: any | null
}

export function useAuthWithSupabase(): UseAuthResult {
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any | null>(null)

  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!isMounted) return

        if (error) {
          logError('auth.init', 'Erro ao obter sessão do Supabase', error)
          setAuthError('Falha ao carregar sessão de autenticação.')
        }

        setCurrentUser(data?.session?.user ?? null)

        supabase.auth.onAuthStateChange((_event, session) => {
          if (!isMounted) return
          setCurrentUser(session?.user ?? null)
        })
      } catch (e) {
        logError('auth.init', 'Erro ao inicializar autenticação Supabase', e)
        if (isMounted) {
          setAuthError('Falha ao conectar na autenticação. Verifique a URL e chave do Supabase.')
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false)
        }
      }
    }

    void initAuth()

    return () => {
      isMounted = false
    }
  }, [])

  return { authLoading, authError, currentUser }
}
