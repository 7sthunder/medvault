import { describe, expect, it } from "vitest";

import { actionLabel, actionableStatus } from "@/features/dose/types";

describe("dose feature models (phase 14)", () => {
  it("actionableStatus gates actions to due-now and snoozed doses", () => {
    expect(actionableStatus("due-now")).toBe("due");
    expect(actionableStatus("snoozed")).toBe("snoozed");
    expect(actionableStatus("upcoming")).toBe("none");
    expect(actionableStatus("taken")).toBe("none");
    expect(actionableStatus("missed")).toBe("none");
    expect(actionableStatus("skipped")).toBe("none");
    expect(actionableStatus("canceled")).toBe("none");
    expect(actionableStatus("paused")).toBe("none");
  });

  it("actionLabel maps every audit tag to a human label", () => {
    expect(actionLabel("take")).toBe("Taken");
    expect(actionLabel("skip")).toBe("Skipped");
    expect(actionLabel("snooze")).toBe("Snoozed");
    expect(actionLabel("missed_auto")).toContain("Missed");
    expect(actionLabel("restored")).toBe("Restored");
  });
});
