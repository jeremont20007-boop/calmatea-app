'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { useToast } from '@/components/ui/Toast'

function Banner() {
  const params = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    if (params.get('success') === '1') {
      toast('¡Bienvenido a Premium! 🎉 Ya tienes acceso a todo.', 'success')
    }
    if (params.get('canceled') === '1') {
      toast('Pago cancelado. Puedes intentarlo cuando quieras.', 'info')
    }
  }, [])

  return null
}

export function SuccessBanner() {
  return <Suspense><Banner /></Suspense>
}
