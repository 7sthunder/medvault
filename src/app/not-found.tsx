import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function RootNotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl">
        <EmptyState
          icon={FileQuestion}
          title="Page not found"
          description="The page or medical record you requested could not be located. It may have been moved or removed."
          action={
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button variant="default" className="w-full sm:w-auto gap-2" render={<Link href="/dashboard" />}>
                <ArrowLeft className="size-4" />
                <span>Go to Dashboard</span>
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" render={<Link href="/" />}>
                Home
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
}
