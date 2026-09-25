import { useEffect, useState } from "react";
import { SKIP_REASON_MAX } from "@shared/constants";

import { TextArea } from "@/components/ui/form";
import { Field } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/ui/overlays";

export interface SkipTarget {
  id: string;
  name: string;
}

/**
 * Port of the web `SkipDialog`.
 *
 * Skipping is destructive to the day — the scheduled dose does not happen and it stops
 * counting toward adherence — so it always confirms first. The reason is optional
 * (`§13 skipReason` ≤ `SKIP_REASON_MAX`) but worth asking for, since it feeds the
 * missed-dose analysis the AI insights read.
 */
export function SkipSheet({
  visible,
  target,
  onCancel,
  onConfirm,
  loading,
}: {
  visible: boolean;
  target: SkipTarget | null;
  onCancel: () => void;
  onConfirm: (reason?: string) => void;
  loading?: boolean;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!visible) setReason("");
  }, [visible]);

  return (
    <ConfirmDialog
      visible={visible}
      onCancel={onCancel}
      loading={loading}
      title={target ? `Skip ${target.name}?` : "Skip dose?"}
      message="This dose will be recorded as skipped and won't count toward your daily adherence. You can optionally tell us why."
      confirmLabel="Skip dose"
      onConfirm={() => onConfirm(reason.trim() || undefined)}
    >
      <Field label="Reason (optional)">
        <TextArea
          value={reason}
          onChangeText={setReason}
          maxLength={SKIP_REASON_MAX}
          rows={2}
          placeholder="e.g. took at work, feeling unwell"
        />
      </Field>
    </ConfirmDialog>
  );
}
