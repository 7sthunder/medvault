"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { signOut } from "@/lib/auth-client";
import { api } from "@/lib/trpc";

export function DeleteFlow() {
  const router = useRouter();
  const utils = api.useUtils();

  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [dataConfirmText, setDataConfirmText] = useState("");
  const [accountConfirmText, setAccountConfirmText] = useState("");

  const deleteDataMutation = api.settings.deleteAllData.useMutation({
    onSuccess: () => {
      setDataModalOpen(false);
      setDataConfirmText("");
      toast.success("All clinical logs, medications, and schedules have been cleared.");
      void utils.settings.getDataOverview.invalidate();
      void utils.dashboard.get.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to clear vault records.");
    },
  });

  const deleteAccountMutation = api.settings.deleteAccount.useMutation({
    onSuccess: async () => {
      setAccountModalOpen(false);
      setAccountConfirmText("");
      toast.success("Your account and all associated data have been permanently deleted.");
      await signOut();
      router.push("/login");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete account.");
    },
  });

  const handleDeleteData = () => {
    if (dataConfirmText !== "DELETE ALL DATA") return;
    deleteDataMutation.mutate({ confirmPhrase: "DELETE ALL DATA" });
  };

  const handleDeleteAccount = () => {
    if (accountConfirmText !== "DELETE MY ACCOUNT") return;
    deleteAccountMutation.mutate({ confirmPhrase: "DELETE MY ACCOUNT" });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-destructive">
          Danger Zone
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Destructive actions cannot be undone. Please proceed with caution.
        </p>
      </div>

      <div className="rounded-xl border border-destructive/30 bg-destructive/5 divide-y divide-destructive/15">
        {/* 1. Wipe All Data */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Trash2 className="size-3.5 text-destructive" />
              Clear Clinical Records & Logs
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Deletes all medications, dose logs, schedules, and insights. Your account login remains active.
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              setDataConfirmText("");
              setDataModalOpen(true);
            }}
            className="shrink-0 text-xs"
            data-testid="open-delete-data-modal"
          >
            Clear All Data
          </Button>
        </div>

        {/* 2. Permanent Account Deletion */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-destructive flex items-center gap-1.5">
              <UserX className="size-3.5 text-destructive" />
              Permanently Delete Account
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Permanently purges your user profile, active sessions, and all encrypted medical data.
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              setAccountConfirmText("");
              setAccountModalOpen(true);
            }}
            className="shrink-0 text-xs"
            data-testid="open-delete-account-modal"
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Delete All Data Modal */}
      <Dialog open={dataModalOpen} onOpenChange={setDataModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle className="text-base font-bold">Clear All Clinical Records?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This will permanently delete all your registered medications, schedules, dose compliance logs, and AI insights. Your account login credentials will not be deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-semibold text-foreground">
              Type <span className="font-mono text-destructive select-all font-bold">DELETE ALL DATA</span> to confirm:
            </label>
            <input
              type="text"
              value={dataConfirmText}
              onChange={(e) => setDataConfirmText(e.target.value)}
              placeholder="DELETE ALL DATA"
              className="w-full rounded-xl border border-destructive/40 bg-background px-3 py-2 text-xs font-mono outline-none focus:ring-1 focus:ring-destructive"
              data-testid="confirm-delete-data-input"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose render={<Button variant="outline" size="sm" type="button">Cancel</Button>} />
            <Button
              variant="destructive"
              size="sm"
              disabled={dataConfirmText !== "DELETE ALL DATA" || deleteDataMutation.isPending}
              onClick={handleDeleteData}
              data-testid="confirm-delete-data-button"
            >
              {deleteDataMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Clearing Data...</span>
                </>
              ) : (
                "Confirm Data Deletion"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Modal */}
      <Dialog open={accountModalOpen} onOpenChange={setAccountModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2">
              <UserX className="size-5" />
            </div>
            <DialogTitle className="text-base font-bold">Permanently Delete Account?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This action is irreversible. All profile data, authentication sessions, medications, and caregiver relationships will be permanently erased from MedVault.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-semibold text-foreground">
              Type <span className="font-mono text-destructive select-all font-bold">DELETE MY ACCOUNT</span> to confirm:
            </label>
            <input
              type="text"
              value={accountConfirmText}
              onChange={(e) => setAccountConfirmText(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="w-full rounded-xl border border-destructive/40 bg-background px-3 py-2 text-xs font-mono outline-none focus:ring-1 focus:ring-destructive"
              data-testid="confirm-delete-account-input"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose render={<Button variant="outline" size="sm" type="button">Cancel</Button>} />
            <Button
              variant="destructive"
              size="sm"
              disabled={accountConfirmText !== "DELETE MY ACCOUNT" || deleteAccountMutation.isPending}
              onClick={handleDeleteAccount}
              data-testid="confirm-delete-account-button"
            >
              {deleteAccountMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Deleting Account...</span>
                </>
              ) : (
                "Permanently Delete Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
