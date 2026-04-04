import { useEffect, useState } from 'react'
import type { Contact } from '../types'
import { apiFetch } from '../api'
import { logError } from '../utils'

export type UseContactsOptions = {
    effectiveUserId: string | null
    currentListId: string | null
}

export type UseContactsResult = {
    contactsByList: Record<string, Contact[]>
    setContactsByList: React.Dispatch<React.SetStateAction<Record<string, Contact[]>>>
    reloadContacts: () => Promise<void>
    deleteContact: (databaseId: string) => Promise<void>
    saveContact: (contact: Partial<Contact>) => Promise<void>
    duplicateContact: (contact: Contact) => Promise<void>
}

export function useContacts({ effectiveUserId, currentListId }: UseContactsOptions): UseContactsResult {
    const [contactsByList, setContactsByList] = useState<Record<string, Contact[]>>({})

    const loadContacts = async () => {
        if (!effectiveUserId || !currentListId) return

        try {
            const data = await apiFetch(`/api/contacts?listId=${currentListId}`)

            const mapped: Contact[] = (data ?? []).map((row: any, index: number) => ({
                id: index + 1,
                databaseId: row.id.toString(),
                name: row.name ?? '',
                phone: row.phone ?? '',
                category: row.category ?? '',
                cep: row.cep ?? '',
                rating: row.rating ?? '',
                email: row.email ?? '',
                address: row.address ?? undefined,
                city: row.city ?? undefined,
            }))

            setContactsByList((prev) => ({
                ...prev,
                [currentListId]: mapped,
            }))
        } catch (e) {
            if (e instanceof Error && e.message === 'AUTH_EXPIRED') return
            logError('contacts.load', 'Erro ao carregar contatos do backend', e)
        }
    }

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

            const saved = await apiFetch(endpoint, {
                method,
                body: JSON.stringify(payload),
            })

            await loadContacts() // Recarrega para garantir consistência (especialmente IDs locais)
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
        void loadContacts()
    }, [effectiveUserId, currentListId])

    return {
        contactsByList,
        setContactsByList,
        reloadContacts: loadContacts,
        deleteContact,
        saveContact,
        duplicateContact,
    }
}
