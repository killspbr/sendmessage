import { useEffect, useState } from 'react'

export function useToast() {
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    if (!message) return
    const timeout = setTimeout(() => {
      setMessage('')
    }, 3500)
    return () => clearTimeout(timeout)
  }, [message])

  return {
    toastMessage: message,
    showToast: setMessage,
  }
}
