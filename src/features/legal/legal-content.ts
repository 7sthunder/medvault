import { BRAND } from "@/shared/brand";

export interface InfoSection {
  id: string;
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
}

export const PRIVACY_CONTENT = {
  eyebrow: "Privacy",
  title: `Privacy at ${BRAND.name}`,
  description: `A clear overview of how ${BRAND.name} handles the information you choose to share.`,
  sections: [
    {
      id: "what-we-store",
      title: "What we store",
      paragraphs: [
        `${BRAND.name} stores the account and medication information needed to provide reminders, history, adherence summaries, and caregiver features. The demo workspace uses a separate sample account.`,
        "Do not enter emergency information or anything you need to access immediately. Contact your clinician or local emergency service for urgent care.",
      ],
    },
    {
      id: "ai-insights",
      title: "AI insights",
      paragraphs: [
        `${BRAND.ai.name} receives only the adherence snapshot needed to describe patterns when an AI provider is configured. It does not diagnose conditions or recommend treatment.`,
        "When an AI provider is not configured, the built-in rules engine generates the same kind of summary locally without sending data to that provider.",
      ],
    },
    {
      id: "your-controls",
      title: "Your controls",
      paragraphs: [
        "You can review, export, or delete the data associated with your account from Settings.",
      ],
      bullets: [
        "Export medications, history, or both as CSV.",
        "Delete all vault data while keeping your login.",
        "Delete your account and its data permanently.",
      ],
    },
    {
      id: "questions",
      title: "Questions",
      paragraphs: [
        "For privacy questions about this build, start with the Help Centre and describe the question without including medication or account secrets.",
      ],
    },
  ] as const satisfies readonly InfoSection[],
};

export const TERMS_CONTENT = {
  eyebrow: "Terms",
  title: `Using ${BRAND.name}`,
  description: `The practical terms for this medication adherence and tracking application.`,
  sections: [
    {
      id: "not-medical-advice",
      title: "Not medical advice",
      paragraphs: [
        `${BRAND.name} helps you record and review a medication routine. It does not diagnose, prescribe, or replace a clinician, pharmacist, or emergency service.`,
        "Follow the instructions provided by your healthcare professional. If you think you may have taken the wrong medicine or need urgent help, contact the appropriate service immediately.",
      ],
    },
    {
      id: "your-account",
      title: "Your account",
      paragraphs: [
        "Keep your sign-in details private and tell us through the support route if you believe someone else has accessed your account.",
      ],
    },
    {
      id: "demo-workspace",
      title: "Demo workspace",
      paragraphs: [
        "The demo is shared sample data. It is provided for exploration and can be reset; it is not a medical record and does not belong to you.",
      ],
    },
    {
      id: "changes",
      title: "Changes",
      paragraphs: [
        "These pages describe the current build. Product behavior and policies may change as the application develops.",
      ],
    },
  ] as const satisfies readonly InfoSection[],
};

export const ACCESSIBILITY_CONTENT = {
  eyebrow: "Accessibility",
  title: `Accessibility at ${BRAND.name}`,
  description: "How we approach inclusive, usable medication tracking.",
  sections: [
    {
      id: "our-approach",
      title: "Our approach",
      paragraphs: [
        `${BRAND.name} is designed to be usable with keyboard navigation, assistive technology, reduced motion settings, and both small and large screens.`,
        "Accessibility is an ongoing product practice. If a screen or interaction does not work for you, tell us what happened and which page you were using.",
      ],
    },
    {
      id: "supporting-use",
      title: "Supporting use",
      paragraphs: [
        "Use your browser's zoom, keyboard controls, reduced-motion preference, and screen reader alongside the app settings.",
      ],
      bullets: [
        "Use Tab and Shift+Tab to move through controls.",
        "Use Enter or Space to activate buttons and disclosures.",
        "Use the appearance settings to select contrast, density, and motion preferences.",
      ],
    },
    {
      id: "feedback",
      title: "Feedback",
      paragraphs: [
        "The Help Centre includes instructions for common flows. When reporting an accessibility barrier, include the page, the action you tried, and the assistive technology or browser you used if you are comfortable sharing it.",
      ],
    },
  ] as const satisfies readonly InfoSection[],
};

export const STATUS_CONTENT = {
  eyebrow: "Status",
  title: `${BRAND.name} service status`,
  description: "A transparent view of what this build can tell you about availability.",
  sections: [
    {
      id: "current-state",
      title: "Current state",
      paragraphs: [
        "The application is running normally in this environment. The demo is ready to explore, and the help pages are available.",
      ],
    },
    {
      id: "monitoring",
      title: "Monitoring",
      paragraphs: [
        "This development build does not connect to an external uptime provider. A production deployment should publish incident updates here when live monitoring is connected.",
      ],
    },
    {
      id: "what-to-do",
      title: "If something is unavailable",
      paragraphs: [
        "Refresh the page, try the action again, and use the Help Centre if the problem continues. Never delay urgent medical care while checking a status page.",
      ],
    },
  ] as const satisfies readonly InfoSection[],
};

export const REPORT_CONTENT = {
  eyebrow: "Support",
  title: `Report an issue`,
  description: `Help us reproduce problems in ${BRAND.name} without sharing sensitive health information.`,
  sections: [
    {
      id: "include",
      title: "What to include",
      paragraphs: [
        "Share the page or action, the expected result, the actual result, and your browser or device. Remove names, email addresses, medication details, and access tokens before sharing.",
      ],
      bullets: [
        "The route or screen you were using.",
        "Steps to reproduce the issue.",
        "The error wording or a screenshot with personal data removed.",
      ],
    },
    {
      id: "urgent",
      title: "Urgent health concerns",
      paragraphs: [
        "This page is not monitored for emergencies. Contact your clinician, pharmacist, or local emergency service when you need immediate medical help.",
      ],
    },
  ] as const satisfies readonly InfoSection[],
};
