import { describe, expect, it } from "vitest";

import { emptyDraft, type ExtractionPatch } from "@/shared/validations/assistant";
import {
  confirmationQuestion,
  describeDraft,
  mergePatch,
  missingSlots,
  nextQuestion,
  toTimeOfDay,
} from "./intake";

/**
 * The intake engine is where a spoken sentence becomes a medication record, so these tests
 * pin the two safety properties: a patch never erases what is already known, and nothing
 * missing is ever silently filled in.
 */

const TODAY = "2026-03-10";
const TZ = "Asia/Kolkata";

/** A patch with everything unsaid — what a correct model returns for a vague utterance. */
const nothing = (over: Partial<ExtractionPatch> = {}): ExtractionPatch => ({
  understood: true,
  offTopic: false,
  name: null,
  dosageAmount: null,
  dosageUnit: null,
  instructions: null,
  condition: null,
  startInDays: null,
  repeatForDays: null,
  endInDays: null,
  times: [],
  ...over,
});

describe("toTimeOfDay", () => {
  it("zero-pads to the HH:mm the schedule schema requires", () => {
    expect(toTimeOfDay(22, 0)).toBe("22:00");
    expect(toTimeOfDay(8, 5)).toBe("08:05");
    expect(toTimeOfDay(0, 30)).toBe("00:30");
  });
});

describe("mergePatch", () => {
  it("captures the user's example sentence across several turns", () => {
    // "I am suffering from diabetes"
    let draft = mergePatch(emptyDraft(), nothing({ condition: "diabetes" }), TODAY, TZ);
    expect(draft.condition).toBe("diabetes");
    // missing stays correct: the name is still unknown
    expect(missingSlots(draft)).toContain("name");

    // "I need to take this tablet daily at 10 pm"
    draft = mergePatch(
      draft,
      nothing({
        startInDays: 0,
        times: [{ hour: 22, minute: 0, daysOfWeek: [] }],
      }),
      TODAY,
      TZ,
    );
    expect(draft.startDate).toBe(TODAY);
    expect(draft.slots).toEqual([{ timeOfDay: "22:00", daysOfWeek: [0, 1, 2, 3, 4, 5, 6] }]);

    // "repeat for 5 days"
    draft = mergePatch(draft, nothing({ repeatForDays: 5 }), TODAY, TZ);
    expect(draft.endDate).toBe("2026-03-14");
  });

  it("never erases what is already known when the model returns null", () => {
    const known = mergePatch(
      emptyDraft(),
      nothing({ name: "Metformin", dosageAmount: 500, dosageUnit: "mg" }),
      TODAY,
      TZ,
    );
    const after = mergePatch(known, nothing({ condition: "diabetes" }), TODAY, TZ);

    expect(after.name).toBe("Metformin");
    expect(after.dosageAmount).toBe(500);
    expect(after.dosageUnit).toBe("mg");
  });

  it("counts the duration inclusively of the start day", () => {
    const draft = mergePatch(
      emptyDraft(),
      nothing({ startInDays: 0, repeatForDays: 1 }),
      TODAY,
      TZ,
    );
    expect(draft.endDate).toBe(TODAY);
  });

  it("resolves a future start before applying the duration", () => {
    const draft = mergePatch(
      emptyDraft(),
      nothing({ startInDays: 2, repeatForDays: 3 }),
      TODAY,
      TZ,
    );
    expect(draft.startDate).toBe("2026-03-12");
    expect(draft.endDate).toBe("2026-03-14");
  });

  it("keeps 12-hour phrasing out of string parsing", () => {
    // 10 pm must arrive as 22, never "10:00 pm" or 10.
    const draft = mergePatch(
      emptyDraft(),
      nothing({ times: [{ hour: 22, minute: 0, daysOfWeek: [] }] }),
      TODAY,
      TZ,
    );
    expect(draft.slots[0]!.timeOfDay).toBe("22:00");
  });

  it("merges weekday subsets onto an existing time", () => {
    let draft = mergePatch(
      emptyDraft(),
      nothing({ times: [{ hour: 9, minute: 0, daysOfWeek: [1] }] }),
      TODAY,
      TZ,
    );
    draft = mergePatch(
      draft,
      nothing({ times: [{ hour: 9, minute: 0, daysOfWeek: [3] }] }),
      TODAY,
      TZ,
    );
    expect(draft.slots).toHaveLength(1);
    expect(draft.slots[0]!.daysOfWeek).toEqual([1, 3]);
  });
});

describe("missingSlots", () => {
  it("lists every required slot on an empty draft", () => {
    expect(missingSlots(emptyDraft())).toEqual([
      "name",
      "dosageAmount",
      "dosageUnit",
      "startDate",
      "timeOfDay",
    ]);
  });

  it("asks about a dose when the user said 'this tablet' but gave no amount", () => {
    const draft = mergePatch(
      emptyDraft(),
      nothing({ times: [{ hour: 22, minute: 0, daysOfWeek: [] }], startInDays: 0 }),
      TODAY,
      TZ,
    );
    // The dosage must not be invented — it stays missing.
    expect(missingSlots(draft)).toEqual(["name", "dosageAmount", "dosageUnit"]);
  });

  it("is empty once every required slot is filled", () => {
    const draft = mergePatch(
      emptyDraft(),
      nothing({
        name: "Metformin",
        dosageAmount: 500,
        dosageUnit: "mg",
        startInDays: 0,
        times: [{ hour: 22, minute: 0, daysOfWeek: [] }],
      }),
      TODAY,
      TZ,
    );
    expect(missingSlots(draft)).toEqual([]);
  });
});

describe("nextQuestion", () => {
  it("asks one thing at a time, in dependency order", () => {
    expect(nextQuestion(["name", "dosageAmount"])).toMatch(/name of the medicine/i);
    expect(nextQuestion(["dosageAmount"])).toMatch(/how much/i);
    expect(nextQuestion(["dosageUnit"])).toMatch(/unit/i);
    expect(nextQuestion(["startDate"])).toMatch(/start/i);
    expect(nextQuestion(["timeOfDay"])).toMatch(/time of day/i);
  });

  it("returns null when nothing is missing", () => {
    expect(nextQuestion([])).toBeNull();
  });
});

describe("describeDraft", () => {
  it("shows the patient every field before they confirm", () => {
    const draft = mergePatch(
      emptyDraft(),
      nothing({
        name: "Metformin",
        dosageAmount: 1,
        dosageUnit: "tablet",
        startInDays: 0,
        repeatForDays: 5,
        condition: "diabetes",
        times: [{ hour: 22, minute: 0, daysOfWeek: [] }],
      }),
      TODAY,
      TZ,
    );
    const summary = describeDraft(draft, TODAY);
    expect(summary).toContain("Metformin");
    expect(summary).toContain("1 tablet");
    expect(summary).toContain("22:00");
    expect(summary).toContain("every day");
    expect(summary).toContain("diabetes");
    expect(confirmationQuestion(draft, TODAY)).toMatch(/shall i save/i);
  });
});
