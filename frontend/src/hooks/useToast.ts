import { useEffect, useState } from 'react'
export function useToast() {
  const [toast, setToast] = useState('')
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer) }, [toast])
  return { toast, setToast }
}
