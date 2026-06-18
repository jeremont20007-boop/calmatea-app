import { TopBar } from '@/components/layout/TopBar'
import { ParentsSkeleton } from '@/components/ui/Skeleton'

export default function ReportsLoading() {
  return (
    <div>
      <TopBar title="Reportes" showBack backHref="/parents" />
      <ParentsSkeleton />
    </div>
  )
}
