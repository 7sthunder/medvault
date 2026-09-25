"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ReportForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card className="mt-10 border-primary/30 bg-primary-tint/50 shadow-none" role="status">
        <CardContent className="p-5">
          <h2 className="font-heading text-xl font-bold text-ink-900">Report ready to share</h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            This local build keeps the report in your browser. Copy the details you entered and
            share them through your team&apos;s usual support channel.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => setSubmitted(false)}>
            Edit report
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-10 shadow-card-sm">
      <CardContent className="p-5 sm:p-6">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-ink-800">
              Your name
              <Input name="name" autoComplete="name" required />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink-800">
              Contact email
              <Input name="email" type="email" autoComplete="email" required />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-ink-800">
            What happened?
            <Textarea name="issue" required minLength={10} className="min-h-32" />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-xs leading-5 text-muted-foreground">
              Do not include passwords, access tokens, medication details, or other private health
              information.
            </p>
            <Button type="submit">
              Prepare report
              <Send className="size-4" aria-hidden />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
