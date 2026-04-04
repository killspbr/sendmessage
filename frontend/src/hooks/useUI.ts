import { useState, useEffect } from 'react'
import type { SidebarPage } from '../components/layout/Sidebar'
import { logError } from '../utils'

export type UseUIResult = {
    currentPage: SidebarPage
    setCurrentPage: (page: SidebarPage) => void
    isMobileMenuOpen: boolean
    setIsMobileMenuOpen: (open: boolean) => void
    debugEnabled: boolean
    setDebugEnabled: (enabled: boolean) => void
    impersonatedUserId: string | null
    setImpersonatedUserId: (id: string | null) => void
}

export function useUI(): UseUIResult {
    const [currentPage, setCurrentPage] = useState<SidebarPage>(() => {
        try {
            const stored = localStorage.getItem('sendmessage_currentPage') as SidebarPage
            const validPages: SidebarPage[] = [
                'dashboard', 'contacts', 'campaigns', 'schedules', 
                'settings', 'reports', 'admin', 'warmer', 'profile', 'security'
            ]
            if (validPages.includes(stored)) return stored
        } catch (e) {
            logError('ui.loadCurrentPage', 'Erro ao ler página atual do localStorage', e)
        }
        return 'contacts'
    })

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const [debugEnabled, setDebugEnabled] = useState<boolean>(() => {
        try {
            return localStorage.getItem('sendmessage_debugEnabled') === 'true'
        } catch {
            return false
        }
    })

    const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null)

    useEffect(() => {
        try {
            localStorage.setItem('sendmessage_currentPage', currentPage)
        } catch { /* ignore */ }
    }, [currentPage])

    useEffect(() => {
        try {
            localStorage.setItem('sendmessage_debugEnabled', debugEnabled ? 'true' : 'false')
        } catch { /* ignore */ }
    }, [debugEnabled])

    return {
        currentPage,
        setCurrentPage,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        debugEnabled,
        setDebugEnabled,
        impersonatedUserId,
        setImpersonatedUserId,
    }
}
