import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-calm-100 rounded-xl animate-pulse', className)} />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-5">
      <Skeleton className="h-28 rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="col-span-2 h-20 rounded-3xl" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    </div>
  )
}

export function SoundsSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-14 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-44 rounded-3xl" />)}
      </div>
    </div>
  )
}

export function ParentsSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-3xl" />)}
      </div>
      <Skeleton className="h-40 rounded-3xl" />
      <Skeleton className="h-48 rounded-3xl" />
    </div>
  )
}
