import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { assistantService, detectLanguage } from "./service";
import { emptyDraft } from "@/shared/validations/assistant";
import type { Db } from "@/server/db/helpers";

/**
 * The write path is what matters here: a draft may only become a medication when the client
 * explicitly confirms, and only after it validates. `fetch` is stubbed, so nothing here
 * touches the network or the database — the confirm branch is asserted by verifying that a
 * write is refused before the draft is complete.
 */

const db = {} as Db;
const TZ = "Asia/Kolkata";

let fetchMock: ReturnType<typeof vi.fn>;

function textResponse(text: string): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
    text: async () => text,
  } as unknown as Response;
}

const PATCH_JSON = JSON.stringify({
  understood: true,
  offTopic: false,
  name: null,
  dosageAmount: null,
  dosageUnit: null,
  instructions: null,
  condition: "diabetes",
  startInDays: 0,
  repeatForDays: 5,
  endInDays: null,
  times: [{ hour: 22, minute: 0, daysOfWeek: [] }],
});

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  process.env.AI_GEMINI_API_KEY = "test-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.AI_GEMINI_API_KEY;
});

describe("assistantService.turn", () => {
  it("asks for the name and dose rather than inventing them", async () => {
    fetchMock.mockResolvedValue(textResponse(PATCH_JSON));

    const turn = await assistantService.turn(db, "user-1", TZ, {
      utterance: "I need to take this tablet daily at 10 pm, for 5 days",
    });

    expect(turn.status).toBe("collecting");
    // The model returned null for both, and the server did not fill them in.
    expect(turn.draft.name).toBeNull();
    expect(turn.draft.dosageAmount).toBeNull();
    expect(turn.draft.slots).toEqual([{ timeOfDay: "22:00", daysOfWeek: [0, 1, 2, 3, 4, 5, 6] }]);
    expect(turn.draft.endDate).not.toBeNull();
    expect(turn.missing).toEqual(["name", "dosageAmount", "dosageUnit"]);
    expect(turn.question).toMatch(/name of the medicine/i);
    // Nothing is written before confirmation.
    expect(turn.medicationId).toBeNull();
  });

  it("refuses to confirm an incomplete draft instead of writing", async () => {
    fetchMock.mockResolvedValue(textResponse(PATCH_JSON));
    const partial = await assistantService.turn(db, "user-1", TZ, {
      utterance: "this tablet at 10 pm",
    });

    fetchMock.mockClear();
    const confirm = await assistantService.turn(db, "user-1", TZ, {
      draft: partial.draft,
      confirm: true,
    });

    expect(confirm.status).toBe("collecting");
    expect(confirm.medicationId).toBeNull();
    // An incomplete draft must not reach the database.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("moves to confirm once every required slot is present", async () => {
    fetchMock.mockResolvedValue(
      textResponse(
        JSON.stringify({
          understood: true,
          offTopic: false,
          name: "Metformin",
          dosageAmount: 500,
          dosageUnit: "mg",
          instructions: "with dinner",
          condition: null,
          startInDays: 0,
          repeatForDays: null,
          endInDays: null,
          times: [{ hour: 22, minute: 0, daysOfWeek: [] }],
        }),
      ),
    );

    const turn = await assistantService.turn(db, "user-1", TZ, {
      utterance: "Metformin 500 mg at 10 pm",
    });

    expect(turn.status).toBe("confirm");
    expect(turn.missing).toEqual([]);
    expect(turn.question).toMatch(/shall i save/i);
    expect(turn.medicationId).toBeNull();
  });

  it("keeps the draft and re-asks when the utterance is off topic", async () => {
    fetchMock.mockResolvedValue(
      textResponse(JSON.stringify({ understood: false, offTopic: true, times: [] })),
    );

    const turn = await assistantService.turn(db, "user-1", TZ, {
      utterance: "what is the weather?",
    });

    expect(turn.status).toBe("unclear");
    expect(turn.draft).toEqual(emptyDraft());
    expect(turn.missing).toEqual(["name", "dosageAmount", "dosageUnit", "startDate", "timeOfDay"]);
  });

  it("speaks the model's own reply, in the language the model reported", async () => {
    fetchMock.mockResolvedValue(
      textResponse(
        JSON.stringify({
          understood: true,
          offTopic: false,
          name: "Metformin",
          dosageAmount: 500,
          dosageUnit: "mg",
          startInDays: 0,
          times: [{ hour: 9, minute: 0, daysOfWeek: [] }],
          language: "Hindi",
          reply: "क्या यह सही है? कृपया पुष्टि करें।",
        }),
      ),
    );

    const turn = await assistantService.turn(db, "user-1", TZ, {
      utterance: "मुझे सुबह 9 बजे मेटफॉर्मिन 500 मिलीग्राम लेना है",
    });

    // The model's question wins over the deterministic English fallback...
    expect(turn.question).toBe("क्या यह सही है? कृपया पुष्टि करें।");
    // ...and its language tag wins over the script heuristic, so TTS picks the right voice.
    expect(turn.language).toBe("Hindi");
    expect(turn.status).toBe("confirm");
  });

  it("falls back to the deterministic question when the model sends no reply", async () => {
    fetchMock.mockResolvedValue(
      textResponse(JSON.stringify({ understood: true, offTopic: false, name: "Metformin" })),
    );

    const turn = await assistantService.turn(db, "user-1", TZ, { utterance: "Metformin" });

    expect(turn.language).toBe("English");
    expect(turn.question).toMatch(/how much/i);
  });

  it("answers a question about their own data without touching the draft", async () => {
    fetchMock.mockResolvedValue(
      textResponse(
        JSON.stringify({
          understood: true,
          offTopic: false,
          intent: "question",
          // A hostile model might still fill fields while answering; they must be ignored.
          name: "Metformin",
          dosageAmount: 500,
          dosageUnit: "mg",
          startInDays: 0,
          times: [{ hour: 9, minute: 0, daysOfWeek: [] }],
          language: "English",
          reply: "You are taking Metformin 500 mg.",
        }),
      ),
    );

    const turn = await assistantService.turn(db, "user-1", TZ, {
      utterance: "what medicines am I taking?",
    });

    expect(turn.status).toBe("answered");
    expect(turn.question).toBe("You are taking Metformin 500 mg.");
    // The draft is untouched, so answering a question can never half-fill a medication.
    expect(turn.draft).toEqual(emptyDraft());
    expect(turn.draft.name).toBeNull();
    expect(turn.draft.slots).toEqual([]);
  });

  it("puts the patient's own facts in the prompt, and only the extraction call", async () => {
    fetchMock.mockResolvedValue(
      textResponse(JSON.stringify({ understood: false, offTopic: false, intent: "intake" })),
    );

    await assistantService.turn(db, "user-1", TZ, { utterance: "hello" });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body ?? "{}")) as {
      contents: { parts: { text: string }[] }[];
    };
    const prompt = (body.contents?.[0]?.parts ?? []).map((p) => p.text).join("");

    expect(prompt).toContain("FACTS about this patient");
    expect(prompt).toContain('Patient says: "hello"');
    // Exactly one model call: answering a question must not cost a second round trip.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("assistantService.transcribe", () => {
  it("reads the transcript out of the audioTranscription field", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          { content: { parts: [{ audioTranscription: { text: "I need this tablet at 10 pm" } }] } },
        ],
      }),
      text: async () => "",
    } as unknown as Response);

    const heard = await assistantService.transcribe("BASE64AUDIO", "audio/webm");

    expect(heard.text).toBe("I need this tablet at 10 pm");
    // The clip is sent as inline audio, not as text.
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string) as {
      contents: { parts: { inlineData?: { data: string } }[] }[];
    };
    expect(body.contents[0]!.parts[0]!.inlineData?.data).toBe("BASE64AUDIO");
  });
});

describe("detectLanguage", () => {
  it("recognises non-Latin scripts so the reply is spoken in kind", () => {
    expect(detectLanguage("मुझे यह गोली रोज़ शाम सात बजे लेनी है")).toBe("Hindi");
    expect(detectLanguage("أحتاج إلى هذا الدواء")).toBe("Arabic");
    expect(detectLanguage("I need this tablet")).toBe("English");
  });
});
