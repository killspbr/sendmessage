import { useEffect, useState } from 'react'

const APP_VERSION = '1.1.4'

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
      fetch('/index.html', { cache: 'no-store' })
        .then(() => {
          const currentStoredVersion = localStorage.getItem('app_version')
          if (currentStoredVersion !== APP_VERSION) {
            setForceUpdate(true)
          }
        })
        .catch(() => {})
    }, 300000)

    return () => clearInterval(interval)
  }, [])

  // Listen for SW new version event
  useEffect(() => {
    const handler = () => {
      setUpdateAvailable(true)
    }

    window.addEventListener('app:new-version-available', handler as EventListener)
    return () => {
      window.removeEventListener('app:new-version-available', handler as EventListener)
    }
  }, [])

  const handleForceUpdate = () => {
    localStorage.setItem('app_version', APP_VERSION)
    window.location.reload()
  }

  return {
    APP_VERSION,
    updateAvailable,
    setUpdateAvailable,
    forceUpdate,
    handleForceUpdate,
  }
}
