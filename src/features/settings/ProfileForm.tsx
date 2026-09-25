"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import { TIMEZONE_LIST } from "@/shared/validations/common";
import { profileSchema, type ProfileInput } from "@/shared/validations/settings";

/**
 * Phase 18 — `/settings/profile` (§11.14). React Hook Form + the shared `profileSchema`, so the
 * client validates instantly and the router validates authoritatively; the only server-side
 * rule the client cannot know (email uniqueness) is checked in the settings service.
 */
export function ProfileForm() {
  const utils = api.useUtils();
  const profile = api.settings.profile.useQuery();
  const update = api.settings.updateProfile.useMutation({
    onSuccess: (saved) => {
      toast.success("Profile saved");
      void utils.settings.profile.invalidate();
      // Name/email appear in the shell header, and the timezone re-buckets every calendar day.
      void utils.settings.reminders.invalidate();
      void utils.settings.dataOverview.invalidate();
      void utils.adherence.summary.invalidate();
      form.reset({ name: saved.name, email: saved.email, timezone: saved.timezone });
    },
    onError: (error) => toast.error(error.message),
  });

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema) as unknown as Resolver<ProfileInput>,
    defaultValues: { name: "", email: "", timezone: "UTC" },
  });
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (profile.data) {
      form.reset({
        name: profile.data.name,
        email: profile.data.email,
        timezone: profile.data.timezone,
      });
    }
  }, [profile.data, form]);

  if (profile.isLoading) {
    return (
      <div className="grid gap-5" aria-busy="true">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <ErrorState
        title="Couldn't load your profile"
        description="Your account details could not be loaded right now."
        action={
          <Button variant="outline" onClick={() => void profile.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const submit = form.handleSubmit((values) => {
    setServerError(null);
    update.mutate(values, {
      onError: (error) => setServerError(error.message),
    });
  });

  return (
    <Card className="shadow-card-sm">
      <CardHeader>
        <CardTitle className="text-ink-900">Your details</CardTitle>
        <CardDescription>
          Your timezone decides which calendar day each dose belongs to — changing it re-buckets your history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-5" noValidate>
          <FormField label="Name" error={form.formState.errors.name?.message} required>
            <Input id="profile-name" autoComplete="name" {...form.register("name")} />
          </FormField>

          <FormField label="Email" error={form.formState.errors.email?.message} required>
            <Input id="profile-email" type="email" autoComplete="email" {...form.register("email")} />
          </FormField>

          <FormField
            label="Timezone"
            error={form.formState.errors.timezone?.message}
            hint="Used for daily schedules, streaks and reports."
            required
          >
            <Select
              value={form.watch("timezone")}
              onValueChange={(value) => form.setValue("timezone", value ?? "UTC", { shouldDirty: true })}
            >
              <SelectTrigger id="profile-timezone" className="w-full" aria-label="Timezone">
                <SelectValue placeholder="Choose a timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_LIST.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {serverError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={update.isPending || !form.formState.isDirty}>
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
            {form.formState.isDirty && (
              <Button type="button" variant="ghost" onClick={() => form.reset()}>
                Discard
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
