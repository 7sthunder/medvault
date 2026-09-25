/* @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

describe("ConfirmationDialog", () => {
  it("renders title + description and only fires onConfirm from the confirm button", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmationDialog
        open
        onOpenChange={onOpenChange}
        title="Delete this medication?"
        description="Its history stays in the archive."
        confirmLabel="Delete"
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText("Delete this medication?")).toBeTruthy();
    expect(screen.getByText("Its history stays in the archive.")).toBeTruthy();

    // Cancel closes without confirming.
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();

    // Confirm fires the dangerous action.
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("uses the destructive tone for the confirm action by default", () => {
    render(<ConfirmationDialog open onOpenChange={() => {}} title="Danger" onConfirm={() => {}} />);
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm.className).toContain("text-destructive");
  });
});
