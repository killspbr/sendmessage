import { useState, useCallback } from 'react'
import type { Campaign, CampaignChannel, CampaignMediaItem, CampaignSharedContact, ContactList } from '../types'
import { apiFetch } from '../api'
import { logError } from '../utils'

export type SaveCampaignParams = {
    lists: ContactList[]
    sendIntervalMinSeconds?: number
    sendIntervalMaxSeconds?: number
    onSuccess?: (campaign: Campaign, isEdit: boolean) => void
    onError?: (msg: string) => void
}

export function useCampaignComposer() {
    const [campaignEditorOpen, setCampaignEditorOpen] = useState(false)
    const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)
    const [newCampaignName, setNewCampaignName] = useState('')
    const [newCampaignListId, setNewCampaignListId] = useState('')
    const [newCampaignChannels, setNewCampaignChannels] = useState<CampaignChannel[]>(['whatsapp'])
    const [newCampaignMessage, setNewCampaignMessage] = useState('')
    const [newCampaignMediaItems, setNewCampaignMediaItems] = useState<CampaignMediaItem[]>([])
    const [newCampaignSharedContact, setNewCampaignSharedContact] = useState<CampaignSharedContact | null>(null)

    const resetComposer = useCallback(() => {
        setEditingCampaignId(null)
        setNewCampaignName('')
        setNewCampaignListId('')
        setNewCampaignChannels(['whatsapp'])
        setNewCampaignMessage('')
        setNewCampaignMediaItems([])
        setNewCampaignSharedContact(null)
        setCampaignEditorOpen(false)
    }, [])

    const startEditCampaign = useCallback((campaign: Campaign, lists: ContactList[]) => {
        setEditingCampaignId(campaign.id)
        setNewCampaignName(campaign.name)
        const list = lists.find(l => l.name === campaign.listName) || lists[0]
        setNewCampaignListId(list?.id || '')
        setNewCampaignChannels(campaign.channels || ['whatsapp'])
        setNewCampaignMessage(campaign.message || '')
        setNewCampaignMediaItems(campaign.mediaItems || [])
        setNewCampaignSharedContact(campaign.sharedContact || null)
        setCampaignEditorOpen(true)
    }, [])

    const duplicateCampaign = useCallback((campaign: Campaign, lists: ContactList[]) => {
        setEditingCampaignId(null)
        setNewCampaignName(`${campaign.name} (Cópia)`)
        const list = lists.find(l => l.name === campaign.listName) || lists[0]
        setNewCampaignListId(list?.id || '')
        setNewCampaignChannels(campaign.channels || ['whatsapp'])
        setNewCampaignMessage(campaign.message || '')
        setNewCampaignMediaItems(campaign.mediaItems || [])
        setNewCampaignSharedContact(campaign.sharedContact || null)
        setCampaignEditorOpen(true)
    }, [])

    const saveCampaign = async ({ lists, sendIntervalMinSeconds = 30, sendIntervalMaxSeconds = 90, onSuccess, onError }: SaveCampaignParams) => {
        if (!newCampaignName.trim()) {
            onError?.('A campanha precisa de um nome.')
            return
        }
        const list = lists.find(l => l.id === newCampaignListId) || lists[0]
        if (!list) {
            onError?.('Selecione uma lista válida.')
            return
        }

        const isEdit = !!editingCampaignId
        const method = isEdit ? 'PUT' : 'POST'
        const url = isEdit ? `/api/campaigns/${editingCampaignId}` : '/api/campaigns'

        try {
            const result = await apiFetch(url, {
                method,
                body: JSON.stringify({
                    name: newCampaignName,
                    listName: list.name,
                    channels: newCampaignChannels,
                    message: newCampaignMessage,
                    mediaItems: newCampaignMediaItems,
                    sharedContact: newCampaignSharedContact,
                    intervalMinSeconds: sendIntervalMinSeconds,
                    intervalMaxSeconds: sendIntervalMaxSeconds,
                })
            })
            onSuccess?.(result, isEdit)
            resetComposer()
        } catch (e) {
            logError('campaigns.save', 'Erro ao salvar campanha', e)
            onError?.('Erro ao salvar a campanha.')
        }
    }

    return {
        campaignEditorOpen, setCampaignEditorOpen,
        editingCampaignId, setEditingCampaignId,
        newCampaignName, setNewCampaignName,
        newCampaignListId, setNewCampaignListId,
        newCampaignChannels, setNewCampaignChannels,
        newCampaignMessage, setNewCampaignMessage,
        newCampaignMediaItems, setNewCampaignMediaItems,
        newCampaignSharedContact, setNewCampaignSharedContact,
        resetComposer,
        startEditCampaign,
        duplicateCampaign,
        saveCampaign
    }
}
