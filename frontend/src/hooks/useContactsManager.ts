import { useState, useCallback } from 'react'
import type { Contact, ImportConflict } from '../types'
import { apiFetch } from '../api'
import { logError, normalizePhone } from '../utils'

export function useContactsManager(effectiveUserId: string | null, currentListId: string) {
  // 1. Form State
  const [showContactForm, setShowContactForm] = useState(false)
  const [editingContactId, setEditingContactId] = useState<number | null>(null)
  const [contactFormName, setContactFormName] = useState('')
  const [contactFormPhone, setContactFormPhone] = useState('')
  const [contactFormCategory, setContactFormCategory] = useState('')
  const [contactFormEmail, setContactFormEmail] = useState('')
  const [contactFormCep, setContactFormCep] = useState('')
  const [contactFormAddress, setContactFormAddress] = useState('')
  const [contactFormCity, setContactFormCity] = useState('')
  const [contactFormRating, setContactFormRating] = useState('3')
  const [contactFormLabels, setContactFormLabels] = useState<string[]>([])

  // 2. Import State
  const [importNewContacts, setImportNewContacts] = useState<Contact[] | null>(null)
  const [importConflicts, setImportConflicts] = useState<ImportConflict[] | null>(null)

  // 3. IA / Enrichment State
  const [isBackfillingAddress, setIsBackfillingAddress] = useState(false)
  const [payloadPreview, setPayloadPreview] = useState<string | null>(null)

  const resetContactForm = useCallback(() => {
    setEditingContactId(null)
    setContactFormName('')
    setContactFormPhone('')
    setContactFormCategory('')
    setContactFormEmail('')
    setContactFormCep('')
    setContactFormAddress('')
    setContactFormCity('')
    setContactFormRating('3')
    setContactFormLabels([])
    setShowContactForm(false)
  }, [])

  const startEditContact = useCallback((contact: Contact) => {
    setEditingContactId(contact.id)
    setContactFormName(contact.name || '')
    setContactFormPhone(contact.phone || '')
    setContactFormCategory(contact.category || '')
    setContactFormEmail(contact.email || '')
    setContactFormCep(contact.cep || '')
    setContactFormAddress(contact.address || '')
    setContactFormCity(contact.city || '')
    setContactFormRating(String(contact.rating || 3))
    setContactFormLabels(Array.isArray(contact.labels) ? contact.labels : [])
    setShowContactForm(true)
    
    // Scroll to form
    setTimeout(() => {
       document.getElementById('contact-form-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [])

  const handleBackfillAddressFromCep = async (contacts: Contact[], onUpdate: (updated: Contact[]) => void) => {
    if (!contacts.length) return
    setIsBackfillingAddress(true)
    try {
      const response = await apiFetch('/api/contacts/backfill-address', {
        method: 'POST',
        body: JSON.stringify({ contactIds: contacts.map(c => c.id) })
      })
      if (response.updated) {
        onUpdate(response.updated)
      }
    } catch (e) {
      logError('contacts.backfill', 'Erro ao processar endereços via IA', e)
    } finally {
      setIsBackfillingAddress(false)
    }
  }

  return {
    // Form
    showContactForm, setShowContactForm,
    editingContactId, setEditingContactId,
    contactFormName, setContactFormName,
    contactFormPhone, setContactFormPhone,
    contactFormCategory, setContactFormCategory,
    contactFormEmail, setContactFormEmail,
    contactFormCep, setContactFormCep,
    contactFormAddress, setContactFormAddress,
    contactFormCity, setContactFormCity,
    contactFormRating, setContactFormRating,
    contactFormLabels, setContactFormLabels,
    resetContactForm,
    startEditContact,

    // Import
    importNewContacts, setImportNewContacts,
    importConflicts, setImportConflicts,

    // IA
    isBackfillingAddress, setIsBackfillingAddress,
    payloadPreview, setPayloadPreview,
    handleBackfillAddressFromCep
  }
}
