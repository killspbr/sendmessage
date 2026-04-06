import { useState, useEffect, useCallback } from 'react'

const APP_VERSION = '1.2.0'

export function useAppVersion() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)

  // Check version and force update if needed
  useEffect(() => {
    const checkVersion = () => {
      try {
        const storedVersion = localStorage.getItem('app_version')
        if (storedVersion && storedVersion !== APP_VERSION) {
          setForceUpdate(true)
        } else {
          localStorage.setItem('app_version', APP_VERSION)
        }
      } catch (e) {
        console.error('Erro ao verificar versão:', e)
      }
    }

    checkVersion()

    const interval = setInterval(() => {
      fetch('/version.json', { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
          if (data.version && data.version !== APP_VERSION) {
            setForceUpdate(true)
            localStorage.setItem('app_version', data.version)
            window.location.reload()
          }
        })
        .catch(() => {})
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // If forceUpdate, redirect immediately
  useEffect(() => {
    if (forceUpdate) {
      localStorage.setItem('app_version', APP_VERSION)
      window.location.href = window.location.pathname + '?v=' + Date.now()
    }
  }, [forceUpdate])

  // Listen for SW new version event
  useEffect(() => {
    const handler = () => {
      setUpdateAvailable(true)
      window.location.reload()
    }

    window.addEventListener('app:new-version-available', handler as EventListener)
    return () => {
      window.removeEventListener('app:new-version-available', handler as EventListener)
    }
  }, [])

  const handleForceUpdate = useCallback(() => {
    localStorage.setItem('app_version', APP_VERSION)
    window.location.href = window.location.pathname + '?v=' + Date.now()
  }, [])

  return {
    APP_VERSION,
    updateAvailable,
    setUpdateAvailable,
    forceUpdate,
    handleForceUpdate,
  }
}
