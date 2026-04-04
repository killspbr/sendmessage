import { useEffect, useState } from 'react'
import type { Contact } from '../types'
import { formatRating } from '../utils'

export function useContactFilters() {
  const [searchName, setSearchName] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_contacts_searchName') || ''
    } catch {
      return ''
    }
  })
  const [searchPhone, setSearchPhone] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_contacts_searchPhone') || ''
    } catch {
      return ''
    }
  })
  const [filterCategory, setFilterCategory] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_contacts_filterCategory') || 'Todas'
    } catch {
      return 'Todas'
    }
  })
  const [searchEmail, setSearchEmail] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_contacts_searchEmail') || ''
    } catch {
      return ''
    }
  })
  const [filterCity, setFilterCity] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_contacts_filterCity') || ''
    } catch {
      return ''
    }
  })
  const [filterRating, setFilterRating] = useState<string>(() => {
    try {
      return localStorage.getItem('sendmessage_contacts_filterRating') || ''
    } catch {
      return ''
    }
  })

  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [moveTargetListId, setMoveTargetListId] = useState<string>('')

  // Persist filters
  useEffect(() => {
    try {
      localStorage.setItem('sendmessage_contacts_searchName', searchName)
      localStorage.setItem('sendmessage_contacts_searchPhone', searchPhone)
      localStorage.setItem('sendmessage_contacts_filterCategory', filterCategory)
      localStorage.setItem('sendmessage_contacts_searchEmail', searchEmail)
      localStorage.setItem('sendmessage_contacts_filterCity', filterCity)
      localStorage.setItem('sendmessage_contacts_filterRating', filterRating)
    } catch {
      // Ignora erros de acesso ao localStorage
    }
  }, [searchName, searchPhone, filterCategory, searchEmail, filterCity, filterRating])

  const filterContacts = (contacts: Contact[]): Contact[] => {
    return contacts.filter((contact) => {
      const name = (contact.name ?? '').toString()
      const phone = (contact.phone ?? '').toString()
      const category = (contact.category ?? '').toString()
      const email = (contact.email ?? '').toString()
      const city = (contact.city ?? '').toString()
      const ratingRaw = (contact.rating ?? '').toString()

      const matchesName = name.toLowerCase().includes(searchName.toLowerCase())
      const matchesPhone = phone.toLowerCase().includes(searchPhone.toLowerCase())
      const matchesCategory =
        filterCategory === 'Todas' || category.toLowerCase() === filterCategory.toLowerCase()
      const matchesEmail = email.toLowerCase().includes(searchEmail.toLowerCase())
      const matchesCity = filterCity ? city.toLowerCase().includes(filterCity.toLowerCase()) : true
      const ratingValue = formatRating(ratingRaw)
      const matchesRating = filterRating ? ratingValue.startsWith(filterRating) : true

      return matchesName && matchesPhone && matchesCategory && matchesEmail && matchesCity && matchesRating
    })
  }

  const handleClearFilters = () => {
    setSearchName('')
    setSearchPhone('')
    setFilterCategory('Todas')
    setSearchEmail('')
    setFilterCity('')
    setFilterRating('')
  }

  const handleToggleSelectAll = (checked: boolean, filteredContacts: Contact[]) => {
    if (checked) {
      setSelectedIds(filteredContacts.map((c) => c.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)))
  }

  return {
    searchName,
    setSearchName,
    searchPhone,
    setSearchPhone,
    filterCategory,
    setFilterCategory,
    searchEmail,
    setSearchEmail,
    filterCity,
    setFilterCity,
    filterRating,
    setFilterRating,
    selectedIds,
    setSelectedIds,
    moveTargetListId,
    setMoveTargetListId,
    filterContacts,
    handleClearFilters,
    handleToggleSelectAll,
    handleToggleSelectOne,
  }
}
