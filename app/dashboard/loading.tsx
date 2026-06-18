import { TopBar } from '@/components/layout/TopBar'
import { DashboardSkeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div>
      <TopBar title="CalmaTEA 🌊" />
      <DashboardSkeleton />
    </div>
  )
}
