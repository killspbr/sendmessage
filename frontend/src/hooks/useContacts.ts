import { useEffect, useState, useCallback } from 'react'
import type { Contact, PaginationMeta } from '../types'
import { apiFetch } from '../api'
import { logError } from '../utils'
import { DEFAULT_LIMITS } from '../config/pagination'

export type UseContactsOptions = {
    effectiveUserId: string | null
    currentListId: string | null
    page?: number
    limit?: number
}

export type UseContactsResult = {
    contactsByList: Record<string, Contact[]>
    setContactsByList: React.Dispatch<React.SetStateAction<Record<string, Contact[]>>>
    pagination: PaginationMeta | null
    reloadContacts: (p?: number, l?: number) => Promise<void>
    deleteContact: (databaseId: string) => Promise<void>
    saveContact: (contact: Partial<Contact>) => Promise<void>
    duplicateContact: (contact: Contact) => Promise<void>
}

export function useContacts({ 
  effectiveUserId, 
  currentListId, 
  page: initialPage = 1, 
  limit: initialLimit = DEFAULT_LIMITS.contacts 
}: UseContactsOptions): UseContactsResult {
    const [contactsByList, setContactsByList] = useState<Record<string, Contact[]>>({})
    const [pagination, setPagination] = useState<PaginationMeta | null>(null)
    const [currentPage, setCurrentPage] = useState(initialPage)
    const [currentLimit, setCurrentLimit] = useState(initialLimit)

    const loadContacts = useCallback(async (p?: number, l?: number) => {
        if (!effectiveUserId || !currentListId) return

        const pageToLoad = p ?? currentPage
        const limitToLoad = l ?? currentLimit

        try {
            const response = await apiFetch(`/api/contacts?listId=${currentListId}&page=${pageToLoad}&limit=${limitToLoad}`)
            
            // O backend retorna { rows: [], meta: { ... } }
            const rows = response.rows || []
            const meta = response.meta || null

            const mapped: Contact[] = rows.map((row: any, index: number) => ({
                id: (pageToLoad - 1) * limitToLoad + index + 1,
                databaseId: row.id.toString(),
                name: row.name ?? '',
                phone: row.phone ?? '',
                category: row.category ?? '',
                cep: row.cep ?? '',
                rating: row.rating ?? '',
                email: row.email ?? '',
                address: row.address ?? undefined,
                city: row.city ?? undefined,
                labels: Array.isArray(row.labels) ? row.labels : []
            }))

            setContactsByList((prev) => ({
                ...prev,
                [currentListId]: mapped,
            }))
            
            if (meta) {
              setPagination(meta)
              setCurrentPage(meta.page)
              setCurrentLimit(meta.limit)
            }
        } catch (e) {
            if (e instanceof Error && e.message === 'AUTH_EXPIRED') return
            logError('contacts.load', 'Erro ao carregar contatos do backend', e)
        }
    }, [effectiveUserId, currentListId, currentPage, currentLimit])

    const deleteContact = async (databaseId: string) => {
        if (!currentListId) return
        try {
            await apiFetch(`/api/contacts/${databaseId}`, { method: 'DELETE' })
            setContactsByList((prev) => {
                const list = prev[currentListId] || []
                return {
                    ...prev,
                    [currentListId]: list.filter((c) => c.databaseId !== databaseId),
                }
            })
        } catch (e) {
            logError('contacts.delete', 'Erro ao excluir contato', e)
            throw e
        }
    }

    const saveContact = async (contact: Partial<Contact>) => {
        if (!currentListId) return
        try {
            const isNew = !contact.databaseId
            const method = isNew ? 'POST' : 'PUT'
            const endpoint = isNew ? '/api/contacts' : `/api/contacts/${contact.databaseId}`

            const payload = {
                ...contact,
                list_id: currentListId,
            }

            await apiFetch(endpoint, {
                method,
                body: JSON.stringify(payload),
            })

            await loadContacts()
        } catch (e) {
            logError('contacts.save', 'Erro ao salvar contato', e)
            throw e
        }
    }

    const duplicateContact = async (contact: Contact) => {
        try {
            const { databaseId, id, ...rest } = contact
            await saveContact({
                ...rest,
                name: `${rest.name} (Cópia)`,
            })
        } catch (e) {
            logError('contacts.duplicate', 'Erro ao duplicar contato', e)
            throw e
        }
    }

    useEffect(() => {
        void loadContacts(initialPage, initialLimit)
    }, [effectiveUserId, currentListId, initialPage, initialLimit])

    return {
        contactsByList,
        setContactsByList,
        pagination,
        reloadContacts: loadContacts,
        deleteContact,
        saveContact,
        duplicateContact,
    }
}
