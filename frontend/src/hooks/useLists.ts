import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ContactList } from '../types'
import { apiFetch } from '../api'
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

export function useLists({ effectiveUserId }: UseListsOptions): UseListsResult {
    const [lists, setLists] = useState<ContactList[]>([])
    const [currentListId, setCurrentListId] = useState<string>('')

    const loadLists = async () => {
        if (!effectiveUserId) {
            setLists([])
            setCurrentListId('')
            return
        }

        try {
            const data = await apiFetch('/api/lists')

            if (!data || data.length === 0) {
                // Cria lista padrão se não houver nenhuma
                const inserted = await apiFetch('/api/lists', {
                    method: 'POST',
                    body: JSON.stringify({ name: 'Lista padrão' })
                })

                const nextLists: ContactList[] = [{ id: inserted.id, name: inserted.name }]
                setLists(nextLists)
                setCurrentListId(inserted.id)
                return
            }

            setLists(data)

            const exists = data.some((l: any) => l.id === currentListId)
            if (!exists && data.length > 0) {
                setCurrentListId(data[0].id)
            }
        } catch (e) {
            logError('lists.load', 'Erro ao carregar listas do backend', e)
        }
    }

    useEffect(() => {
        void loadLists()
    }, [effectiveUserId])

    return {
        lists,
        currentListId,
        setCurrentListId,
        reloadLists: loadLists,
        setLists,
    }
}
