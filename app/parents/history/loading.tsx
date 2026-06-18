import { TopBar } from '@/components/layout/TopBar'
import { ParentsSkeleton } from '@/components/ui/Skeleton'

export default function HistoryLoading() {
  return (
    <div>
      <TopBar title="Historial completo" showBack backHref="/parents" />
      <ParentsSkeleton />
    </div>
  )
}
