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
    createList: (name: string) => Promise<ContactList>
    renameList: (id: string, name: string) => Promise<void>
    deleteList: (id: string) => Promise<void>
}

export function useLists({ effectiveUserId }: UseListsOptions): UseListsResult {
    const [lists, setLists] = useState<ContactList[]>([])
    const [currentListId, setCurrentListId] = useState<string>(() => {
        try {
            return localStorage.getItem('sendmessage_contacts_currentListId') || ''
        } catch {
            return ''
        }
    })

    const loadLists = async () => {
        if (!effectiveUserId) {
            setLists([])
            setCurrentListId('')
            return
        }

        try {
            const data = await apiFetch('/api/lists')

            if (!data || data.length === 0) {
                const inserted = await apiFetch('/api/lists', {
                    method: 'POST',
                    body: JSON.stringify({ name: 'Lista padrão' }),
                })

                const nextLists: ContactList[] = [{ id: inserted.id, name: inserted.name }]
                setLists(nextLists)
                setCurrentListId(inserted.id)
                return
            }

            setLists(data)

            const stored = localStorage.getItem('sendmessage_contacts_currentListId')
            const exists = data.some((l: any) => l.id === stored)
            if (exists && stored) {
                setCurrentListId(stored)
            } else if (data.length > 0) {
                setCurrentListId(data[0].id)
            }
        } catch (e) {
            if (e instanceof Error && e.message === 'AUTH_EXPIRED') return
            logError('lists.load', 'Erro ao carregar listas do backend', e)
        }
    }

    const createList = async (name: string): Promise<ContactList> => {
        try {
            const data = await apiFetch('/api/lists', {
                method: 'POST',
                body: JSON.stringify({ name }),
            })
            const newList = { id: data.id, name: data.name }
            setLists((prev) => [...prev, newList])
            return newList
        } catch (e) {
            logError('lists.create', 'Erro ao criar lista', e)
            throw e
        }
    }

    const renameList = async (id: string, name: string) => {
        try {
            await apiFetch(`/api/lists/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ name }),
            })
            setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)))
        } catch (e) {
            logError('lists.rename', 'Erro ao renomear lista', e)
            throw e
        }
    }

    const deleteList = async (id: string) => {
        try {
            await apiFetch(`/api/lists/${id}`, {
                method: 'DELETE',
            })
            setLists((prev) => prev.filter((l) => l.id !== id))
        } catch (e) {
            logError('lists.delete', 'Erro ao excluir lista', e)
            throw e
        }
    }

    useEffect(() => {
        try {
            if (currentListId) {
                localStorage.setItem('sendmessage_contacts_currentListId', currentListId)
            }
        } catch {
            // ignore
        }
    }, [currentListId])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadLists()
        }, 350)

        return () => {
            window.clearTimeout(timer)
        }
    }, [effectiveUserId])

    return {
        lists,
        currentListId,
        setCurrentListId,
        reloadLists: loadLists,
        setLists,
        createList,
        renameList,
        deleteList,
    }
}
