import { TopBar } from '@/components/layout/TopBar'
import { ParentsSkeleton } from '@/components/ui/Skeleton'

export default function ParentsLoading() {
  return (
    <div>
      <TopBar title="Panel de Padres 📊" />
      <ParentsSkeleton />
    </div>
  )
}
