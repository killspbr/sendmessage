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
}

export function useContacts({ effectiveUserId, currentListId }: UseContactsOptions): UseContactsResult {
    const [contactsByList, setContactsByList] = useState<Record<string, Contact[]>>({})

    const loadContacts = async () => {
        if (!effectiveUserId || !currentListId) return

        try {
            const data = await apiFetch(`/api/contacts?listId=${currentListId}`)

            const mapped: Contact[] = (data ?? []).map((row: any, index: number) => ({
                id: index + 1,
                supabaseId: row.id.toString(), // Mantendo compatibilidade com código que usa supabaseId para o id real do DB
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
            logError('contacts.load', 'Erro ao carregar contatos do backend', e)
        }
    }

    useEffect(() => {
        void loadContacts()
    }, [effectiveUserId, currentListId])

    return {
        contactsByList,
        setContactsByList,
        reloadContacts: loadContacts,
    }
}
