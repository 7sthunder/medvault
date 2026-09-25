import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <EmptyState
          icon={FileQuestion}
          title="Page not found"
          description="The section or record you are looking for doesn't exist or may have been moved."
          action={
            <div className="pt-4">
              <Button variant="default" className="gap-2" render={<Link href="/dashboard" />}>
                <ArrowLeft className="size-4" />
                <span>Return to Dashboard</span>
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
}
