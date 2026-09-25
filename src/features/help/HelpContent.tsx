"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HELP_CARDS,
  HELP_FAQS,
  HELP_INTRO,
  HELP_SECTIONS,
  type HelpCard,
} from "@/features/help/help-content";

/**
 * Phase 18 — shared `/help` body (plan §11.15).
 *
 * One component, two routes: `/help` in the marketing group for signed-out visitors, and
 * `/help` under the `(app)` shell for signed-in users, so the nav's Help link keeps the sidebar
 * and the footer link keeps the marketing chrome. Copy comes from `help-content.ts` for both.
 *
 * FAQs use native `<details>`/`<summary>`: the disclosure semantics, keyboard handling and
 * find-in-page behaviour come for free and stay correct without a JS accordion.
 */

function HelpCardTile({ card }: { card: HelpCard }) {
  return (
    <Card id={card.id} className="scroll-mt-20 shadow-card-sm">
      <CardHeader>
        <CardTitle className="text-ink-900">{card.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{card.body}</CardDescription>
        {card.href && (
          <Link
            href={card.href}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-dark transition-colors hover:underline"
          >
            {card.linkLabel ?? card.title}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function HelpContent() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <header>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink-900">
          {HELP_INTRO.title}
        </h1>
        <p className="mt-2 max-w-2xl text-base text-muted-foreground">{HELP_INTRO.lede}</p>
      </header>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-tint px-4 py-3 text-sm text-violet-900">
        <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          <span className="font-semibold">About MedVault AI.</span> {HELP_INTRO.aiNote}
        </p>
      </div>

      <nav aria-label="Help sections" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          {HELP_SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#section-${section.id}`}
                className="inline-block rounded-full border border-border px-3 py-1.5 text-sm font-medium text-ink-800 transition-colors hover:border-primary/40 hover:bg-primary-tint"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8 grid gap-8">
        {HELP_SECTIONS.map((section) => (
          <section key={section.id} id={`section-${section.id}`} className="scroll-mt-20">
            <h2 className="font-heading text-xl font-bold text-ink-900">{section.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{section.summary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {HELP_CARDS.filter((card) => card.sectionId === section.id).map((card) => (
                <HelpCardTile key={card.id} card={card} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <section id="faq" className="mt-10 scroll-mt-20">
        <h2 className="font-heading text-xl font-bold text-ink-900">Common questions</h2>
        <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-white">
          {HELP_FAQS.map((faq) => (
            <details key={faq.id} id={faq.id} className="group scroll-mt-20 px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink-900 marker:content-none">
                {faq.question}
                <span
                  aria-hidden
                  className="shrink-0 text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
