import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

import { Brand } from "@/components/brand/Brand";
import { Card, CardContent } from "@/components/ui/card";
import type { InfoSection } from "@/features/legal/legal-content";
import { BRAND } from "@/shared/brand";

export function InfoPage({
  eyebrow,
  title,
  description,
  sections,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: readonly InfoSection[];
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Brand size={34} />
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-dark hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back home
          </Link>
        </div>

        <header className="mt-14 max-w-3xl">
          <p className="text-sm font-bold tracking-[0.12em] text-primary-dark uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">{description}</p>
        </header>

        <div className="mt-10 grid gap-8">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="font-heading text-2xl font-bold text-ink-900">{section.title}</h2>
              <div className="mt-3 grid gap-3 text-base leading-7 text-muted-foreground">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {section.bullets && (
                <ul className="mt-4 grid gap-3">
                  {section.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-2 text-sm leading-6 text-ink-700"
                    >
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {children}

        <Card className="mt-12 bg-primary-tint/50 shadow-none">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="font-semibold text-ink-900">Need a product answer?</p>
              <p className="mt-1 text-sm text-ink-700">
                The Help Centre covers the everyday flows and common questions.
              </p>
            </div>
            <Link
              href="/help"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-dark hover:underline"
            >
              Visit Help Centre
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </CardContent>
        </Card>

        <p className="mt-8 text-xs text-muted-foreground">Product name: {BRAND.name}</p>
      </div>
    </main>
  );
}
