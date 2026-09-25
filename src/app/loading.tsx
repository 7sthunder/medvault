import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div
      role="status"
      aria-label="Loading MedVault"
      className="min-h-screen bg-background text-foreground flex flex-col p-4 sm:p-8 space-y-6"
    >
      <span className="sr-only">Loading MedVault application...</span>

      {/* Top Navigation Skeleton */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <Skeleton className="h-8 w-36 rounded-xl" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>

      {/* Main Body Skeleton */}
      <div className="max-w-7xl w-full mx-auto space-y-6 pt-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          <Skeleton className="lg:col-span-2 h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
