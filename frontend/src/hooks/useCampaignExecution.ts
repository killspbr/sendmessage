import { useState } from 'react'
import type { Campaign, CampaignChannel, Contact, ContactList, ContactSendHistoryItem } from '../types'
import { apiFetch } from '../api'
import { BACKEND_URL, normalizePhone, logError } from '../utils'
import { htmlToText, htmlToWhatsapp } from '../utils/htmlTransform'

export type UseCampaignExecutionProps = {
    effectiveUserId: string | null
    lists: ContactList[]
    contactsByList: Record<string, Contact[]>
    contactSendHistory: ContactSendHistoryItem[]
    userSettings: any
    globalSettings: any
    onSetCampaigns: (updater: (prev: Campaign[]) => Campaign[]) => void
    onShowToast: (msg: string) => void
    onReloadContactSendHistory: () => Promise<void>
    onSetContactsByList: (updater: (prev: Record<string, Contact[]>) => Record<string, Contact[]>) => void
    onSetContactSendHistory: (updater: (prev: ContactSendHistoryItem[]) => ContactSendHistoryItem[]) => void
}

export type UseCampaignExecutionResult = {
    sendingCampaignId: string | null
    setSendingCampaignId: (id: string | null) => void
    sendingCurrentIndex: number
    sendingTotal: number
    sendingErrors: number
    sendingNextDelaySeconds: number | null
    sendConfirmCampaignId: string | null
    setSendConfirmCampaignId: (id: string | null) => void
    continueCampaign: (camp: Campaign) => Promise<void>
    sendCampaign: (camp: Campaign) => Promise<void>
    getPendingContacts: (camp: Campaign) => {
        pendingContacts: Contact[]
        contactsForList: Contact[]
        effectiveChannels: CampaignChannel[]
        list: ContactList | undefined
        listId: string
    }
}

export function useCampaignExecution({
    effectiveUserId,
    lists,
    contactsByList,
    contactSendHistory,
    userSettings,
    globalSettings,
    onSetCampaigns,
    onShowToast,
    onReloadContactSendHistory,
    onSetContactsByList,
    onSetContactSendHistory,
}: UseCampaignExecutionProps): UseCampaignExecutionResult {
    const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null)
    const [sendingCurrentIndex, setSendingCurrentIndex] = useState<number>(0)
    const [sendingTotal, setSendingTotal] = useState<number>(0)
    const [sendingErrors, setSendingErrors] = useState<number>(0)
    const [sendingNextDelaySeconds, setSendingNextDelaySeconds] = useState<number | null>(null)
    const [sendConfirmCampaignId, setSendConfirmCampaignId] = useState<string | null>(null)

    const getPendingContacts = (camp: Campaign) => {
        const list = lists.find(l => l.name === camp.listName) || lists[0]
        const listId = list?.id ?? 'default'
        const contactsForList = contactsByList[listId] ?? []

        const hasEvolutionConfigured = (!!userSettings?.evolution_url || !!globalSettings?.evolution_api_url) && 
                                      (!!userSettings?.evolution_instance || !!globalSettings?.evolution_shared_instance)
        
        const effectiveChannels: CampaignChannel[] = camp.channels.filter(ch => 
            ch === 'whatsapp' ? hasEvolutionConfigured : false
        )

        const pendingContacts = contactsForList.filter(contact => {
            const phoneKey = normalizePhone(contact.phone)
            for (const channel of effectiveChannels) {
                if (channel === 'whatsapp' && !phoneKey) continue
                const alreadySent = contactSendHistory.some(h => 
                    h.campaignId === camp.id && h.phoneKey === phoneKey && h.channel === channel && h.ok
                )
                if (!alreadySent) return true
            }
            return false
        })

        return { pendingContacts, contactsForList, effectiveChannels, list, listId }
    }

    const continueCampaign = async (camp: Campaign) => {
        const { pendingContacts, effectiveChannels, listId } = getPendingContacts(camp)

        if (!pendingContacts.length) {
            onShowToast('Todos os contatos já receberam esta campanha.')
            return
        }

        if (sendingCampaignId && sendingCampaignId !== camp.id) {
            onShowToast('Já existe uma campanha sendo enviada.')
            return
        }

        setSendingCampaignId(camp.id)
        setSendingCurrentIndex(0)
        setSendingTotal(pendingContacts.length)
        setSendingErrors(0)

        let localErrorCount = 0

        for (let i = 0; i < pendingContacts.length; i++) {
            const contact = pendingContacts[i]
            setSendingCurrentIndex(i + 1)

            const messageHtml = (camp.message || '').trim().startsWith('<') ? camp.message : `<p>${camp.message}</p>`
            const phoneKey = normalizePhone(contact.phone)

            const promises = effectiveChannels.map(async (channel) => {
                const payload = {
                    meta: { campaignId: camp.id, campaignName: camp.name, listId, channels: [channel] },
                    message: channel === 'whatsapp' ? htmlToWhatsapp(messageHtml) : messageHtml,
                    contacts: [{ id: contact.id, name: contact.name, phone: phoneKey }]
                }

                try {
                    const endpoint = channel === 'whatsapp' ? `${BACKEND_URL}/api/campaigns/${camp.id}/send` : `${BACKEND_URL}/api/n8n/trigger`
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    })
                    const result = await response.json().catch(() => ({}))
                    const ok = response.ok && result.ok !== false

                    const historyItem: ContactSendHistoryItem = {
                        id: `${camp.id}-${contact.id}-${Date.now()}`,
                        contactId: contact.id,
                        contactName: contact.name,
                        phoneKey,
                        campaignId: camp.id,
                        campaignName: camp.name,
                        channel,
                        status: response.status,
                        ok,
                        runAt: new Date().toLocaleTimeString('pt-BR')
                    }

                    onSetContactSendHistory(prev => [historyItem, ...prev].slice(0, 1000))
                    if (!ok) {
                        localErrorCount++
                        setSendingErrors(prev => prev + 1)
                    }
                } catch {
                    localErrorCount++
                    setSendingErrors(prev => prev + 1)
                }
            })

            await Promise.all(promises)

            if (i < pendingContacts.length - 1) {
                const delay = (camp.intervalMinSeconds ?? 30) + Math.random() * ((camp.intervalMaxSeconds ?? 90) - (camp.intervalMinSeconds ?? 30))
                setSendingNextDelaySeconds(Math.round(delay))
                await new Promise(r => setTimeout(r, delay * 1000))
            }
        }

        const nextStatus = localErrorCount === 0 ? 'enviada' : 'enviada_com_erros'
        onSetCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, status: nextStatus } : c))
        onShowToast(`Campanha finalizada com ${localErrorCount} erros.`)
        setSendingCampaignId(null)
        setSendingNextDelaySeconds(null)
        onReloadContactSendHistory()
    }

    const sendCampaign = async (camp: Campaign) => {
        if (!effectiveUserId) return
        setSendingCampaignId(camp.id)
        try {
            const res = await apiFetch(`/api/campaigns/${camp.id}/send`, { method: 'POST' })
            if (res?.accepted) {
                onShowToast('Disparo iniciado em background.')
                onSetCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, status: 'enviando' } : c))
            }
        } catch { onShowToast('Erro ao disparar campanha.') }
        finally { setSendingCampaignId(null); onReloadContactSendHistory() }
    }

    return {
        sendingCampaignId, setSendingCampaignId,
        sendingCurrentIndex, sendingTotal, sendingErrors, sendingNextDelaySeconds,
        sendConfirmCampaignId, setSendConfirmCampaignId,
        continueCampaign, sendCampaign, getPendingContacts
    }
}
