/**
 * Phase 18 — `/help` static content (plan §11.15).
 *
 * Kept as plain data, deliberately React-free, so the marketing route and the in-shell route
 * render byte-identical copy from one source. If a claim here needs to change (a limit, a default,
 * a policy), it changes once.
 *
 * The AI note is not optional copy: the plan requires the "MediTrack AI" affordance to state that
 * insights are informational and not medical advice, and `/help` is where that belongs.
 */

import { BRAND } from "@/shared/brand";

export interface HelpCard {
  id: string;
  /** Explicit owning section — the ids do not share a derivable prefix, so it is stated, not guessed. */
  sectionId: HelpSection["id"];
  title: string;
  body: string;
  href?: string;
  /** Text of the link chip; defaults to the section label. */
  linkLabel?: string;
}

export interface HelpFaq {
  id: string;
  question: string;
  answer: string;
}

export interface HelpSection {
  id: string;
  title: string;
  summary: string;
}

export const HELP_INTRO = {
  title: "Help & how it works",
  lede: `Everything you need to get the most out of ${BRAND.name} — setting up, staying on track, and what the numbers actually mean.`,
  /** Rendered in a highlighted panel because it is the one thing users most often misread. */
  aiNote: `${BRAND.ai.name} reads your own adherence history and describes patterns. It does not diagnose, prescribe, or suggest changing a medication or dose. Talk to your clinician before changing anything.`,
} as const;

export const HELP_SECTIONS: readonly HelpSection[] = [
  {
    id: "getting-started",
    title: "Getting started",
    summary: "Add your first medication and get today's schedule in front of you.",
  },
  {
    id: "daily-use",
    title: "Every day",
    summary: "Taking, snoozing and skipping doses, and what each one means for your record.",
  },
  {
    id: "understanding",
    title: "Understanding your numbers",
    summary: "Adherence, streaks, buckets and insights — what is measured, and what is not.",
  },
  {
    id: "care",
    title: "Caregivers",
    summary: "Inviting someone, choosing what they can see, and the alerts they receive.",
  },
  {
    id: "privacy",
    title: "Your data",
    summary: "Exporting, deleting, and where everything lives.",
  },
];

export const HELP_CARDS: readonly HelpCard[] = [
  {
    id: "add-medication",
    sectionId: "getting-started",
    title: "Add a medication",
    body: "Name, dose and unit, then pick the times and days it applies to. The wizard checks for overlapping slots before it saves anything.",
    href: "/medications/new",
    linkLabel: "Add a medication",
  },
  {
    id: "reminder-settings",
    sectionId: "getting-started",
    title: "Tune your reminders",
    body: "Set the grace period before a dose is marked missed, how long a snooze lasts, and how many snoozes a dose gets. Silence one medication without pausing its whole schedule.",
    href: "/settings/reminders",
    linkLabel: "Open reminder settings",
  },
  {
    id: "appearance",
    sectionId: "getting-started",
    title: "Make it yours",
    body: "Light, dark or follow your device; comfortable or compact density; and reduced motion. Changes apply immediately and are remembered on this device.",
    href: "/settings/appearance",
    linkLabel: "Open appearance settings",
  },
  {
    id: "today-schedule",
    sectionId: "daily-use",
    title: "Work through today",
    body: "Today's schedule lists every due dose in order. Take it when you actually take it, snooze when you genuinely need more time, and skip only when you are not taking it — the record stays accurate either way.",
    href: "/schedule",
    linkLabel: "Open today's schedule",
  },
  {
    id: "correct-entry",
    sectionId: "daily-use",
    title: "Fix a mistake",
    body: "Recorded the wrong dose? History lets you correct or remove an entry. The charts recalculate on the spot, and a late 'taken' is still a 'taken'.",
    href: "/history",
    linkLabel: "Open history",
  },
  {
    id: "adherence-reports",
    sectionId: "understanding",
    title: "Read your charts",
    body: "Adherence rate, streaks, and a per-day heatmap of taken, missed and skipped doses over any period you choose — plus a CSV export for your records or your clinician.",
    href: "/adherence",
    linkLabel: "Open adherence",
  },
  {
    id: "insights-page",
    sectionId: "understanding",
    title: "Generate an insight",
    body: `Ask ${BRAND.ai.name} to summarise your recent history and describe the patterns it finds, such as which time of day you most often miss.`,

    href: "/insights",
    linkLabel: "Open AI insights",
  },
  {
    id: "caregiver-invite",
    sectionId: "care",
    title: "Invite a caregiver",
    body: "Send an invitation, then choose exactly what that person can see and which alerts they receive. You can change or revoke it at any time.",
    href: "/caregiver",
    linkLabel: "Open caregiver screen",
  },
  {
    id: "export-data",
    sectionId: "privacy",
    title: "Export your data",
    body: "Download medications, dose history, or both as CSV. The same file a clinician would ask for.",
    href: "/settings/data",
    linkLabel: "Open your data",
  },
  {
    id: "try-demo",
    sectionId: "getting-started",
    title: "See it with data already in it",
    body: "Explore a fully populated sample workspace and simulate doses, adherence patterns and caregiver alerts. Nothing touches your own account.",
    href: "/demo",
    linkLabel: "Enter the demo",
  },
];

export const HELP_FAQS: readonly HelpFaq[] = [
  {
    id: "adherence-percent",
    question: "How is my adherence percentage calculated?",
    answer:
      "Adherence is the share of resolved doses you actually took, over a period you choose. Doses marked taken count in your favour; missed and skipped doses do not. Snoozed doses are not resolved, so they are neither counted nor penalised until they settle. A dose that is still upcoming is never counted at all.",
  },
  {
    id: "streak",
    question: "What counts towards a streak?",
    answer:
      "A streak is consecutive calendar days where every resolved dose was taken. A day with an upcoming dose still to come does not break it, and neither does a snooze — but a single missed or skipped dose ends it. Streaks are computed in your own timezone, so the day boundary is the one you actually live by.",
  },
  {
    id: "timezone",
    question: "Why does my timezone matter?",
    answer:
      "Every dose belongs to a calendar day, and which day that is depends on your timezone. Changing it in settings re-buckets your whole history so your charts stay honest — you may notice day boundaries move, but no dose is ever lost or double-counted.",
  },
  {
    id: "missed-grace",
    question: "When does a dose become 'missed'?",
    answer:
      "After the grace period you set in reminder settings, which defaults to 30 minutes past the scheduled time. Until then a dose stays 'due', so a short delay never damages your record. You can still take a dose after it is marked missed, and it will be recorded as taken late.",
  },
  {
    id: "snooze-limit",
    question: "Why can't I snooze a dose again?",
    answer:
      "Each dose has a snooze limit so a reminder cannot loop forever. Once you have used every allowed snooze, the dose either settles as taken or becomes missed on schedule. You can set the limit to zero to turn snoozing off entirely.",
  },
  {
    id: "ai-insights",
    question: `What does ${BRAND.ai.name} do with my data?`,

    answer:
      "It builds a summary of your recent history — daily totals, per-medication rates, time-of-day patterns and streaks — and describes what it sees in plain language. It never diagnoses a condition, never recommends a medication or dose change, and never sends your data anywhere except to the configured AI provider for that one summary. If no provider is configured, a built-in rules engine produces the same observations offline.",
  },
  {
    id: "caregiver-access",
    question: "What can a caregiver see?",
    answer:
      "Exactly what you grant, and nothing more. You choose, per person, whether they can see your adherence, your medications and your insights, whether they receive missed-dose alerts, and whether they can acknowledge them. Changing a permission takes effect immediately, and revoking access removes their view of your data entirely.",
  },
  {
    id: "delete-data",
    question: "What is the difference between deleting data and deleting my account?",
    answer:
      "'Delete all data' clears your medications, dose history, insights and notifications but keeps your login, so you can start again with a clean slate. 'Delete my account' removes the account itself along with everything in it, and signs you out. Both ask you to type a confirmation phrase, and neither can be undone.",
  },
  {
    id: "demo-data",
    question: "Is the demo data mine?",
    answer:
      "No. The demo runs on a shared sample account that is separate from every real user, and it is visible to anyone else exploring the demo at the same time. Nothing you do in the demo reaches your own account, and you can reset it to its starting state from the simulation dock at any time.",
  },
];
