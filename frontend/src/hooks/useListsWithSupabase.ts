import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ContactList, SupabaseListRow } from '../types'
import { supabase } from '../supabaseClient'
import { logError } from '../utils'

export type UseListsOptions = {
  effectiveUserId: string | null
}

export type UseListsResult = {
  lists: ContactList[]
  currentListId: string
  setCurrentListId: (id: string) => void
  reloadLists: () => Promise<void>
  setLists: Dispatch<SetStateAction<ContactList[]>>
}

export function useListsWithSupabase({ effectiveUserId }: UseListsOptions): UseListsResult {
  const [lists, setLists] = useState<ContactList[]>([])
  const [currentListId, setCurrentListId] = useState<string>('')

  const loadLists = async () => {
    if (!effectiveUserId) {
      setLists([])
      setCurrentListId('')
      return
    }

    try {
      const { data, error } = await supabase
        .from('lists')
        .select('id, name')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: true })

      if (error) {
        logError('lists.load', 'Erro ao carregar listas do Supabase', error)
        return
      }

      if (!data || data.length === 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('lists')
          .insert({ user_id: effectiveUserId, name: 'Lista padrão' })
          .select('id, name')
          .single()

        if (insertError) {
          logError('lists.createDefault', 'Erro ao criar lista padrão no Supabase', insertError)
          return
        }

        if (!inserted) return

        const nextLists: ContactList[] = [{ id: inserted.id, name: inserted.name }]
        setLists(nextLists)
        setCurrentListId(inserted.id)
        return
      }

      const nextLists: ContactList[] = (data as SupabaseListRow[]).map((row) => ({
        id: row.id,
        name: row.name,
      }))
      setLists(nextLists)

      const exists = nextLists.some((l) => l.id === currentListId)
      if (!exists && nextLists.length > 0) {
        setCurrentListId(nextLists[0].id)
      }
    } catch (e) {
      logError('lists.load', 'Erro inesperado ao carregar listas do Supabase', e)
    }
  }

  useEffect(() => {
    void loadLists()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId])

  return {
    lists,
    currentListId,
    setCurrentListId,
    reloadLists: loadLists,
    setLists,
  }
}
