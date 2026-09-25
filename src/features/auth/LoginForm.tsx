"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, HeartHandshake, Loader2, User } from "lucide-react";
import { useController, useForm } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { loginSchema, type LoginInput } from "@/shared/validations/auth";

import { authErrorMessage } from "./auth-error";
import { getUserRole, hasOnboarded, safeNext } from "./flow";
import { PasswordInput } from "./PasswordInput";

export default function LoginForm({ next }: { next: string | null }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [portalTab, setPortalTab] = useState<"patient" | "caregiver">("patient");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const rememberMe = useController({ control, name: "rememberMe" });

  const onSubmit = async ({ email, password, rememberMe: remember }: LoginInput) => {
    setServerError(null);
    const res = await authClient.signIn.email({ email, password, rememberMe: remember });
    if (res.error) {
      setServerError(authErrorMessage(res.error.code, res.error.message));
      return;
    }
    const session = await authClient.getSession();
    const role = getUserRole(session.data?.user);
    router.push(safeNext(next, { onboardingCompleted: hasOnboarded(session.data?.user), role }));
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {serverError && (
        <Alert variant="destructive">
          <AlertTitle>Sign-in failed</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {/* Portal Selection Tabs */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-ink-500">
          Sign In Portal
        </label>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-ink-100/70 p-1 dark:bg-ink-900/70 border border-ink-200/50 dark:border-ink-800/50">
          <button
            type="button"
            onClick={() => setPortalTab("patient")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-semibold transition-all ${
              portalTab === "patient"
                ? "bg-white dark:bg-ink-800 text-primary dark:text-primary-tint shadow-xs ring-1 ring-primary/20"
                : "text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Patient Vault</span>
          </button>
          <button
            type="button"
            onClick={() => setPortalTab("caregiver")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-semibold transition-all ${
              portalTab === "caregiver"
                ? "bg-white dark:bg-ink-800 text-secondary dark:text-secondary-tint shadow-xs ring-1 ring-secondary/20"
                : "text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100"
            }`}
          >
            <HeartHandshake className="h-4 w-4" />
            <span>Caregiver Portal</span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {portalTab === "patient"
            ? "Sign in to manage your prescriptions, track daily doses, and view health insights."
            : "Sign in to monitor patients, schedule appointments, and coordinate family care."}
        </p>
      </div>

      <FormField label="Email Address" error={errors.email?.message} required>
        <Input
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          inputMode="email"
          disabled={isSubmitting}
          {...register("email")}
        />
      </FormField>

      <FormField label="Password" error={errors.password?.message} required>
        <PasswordInput
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={isSubmitting}
          {...register("password")}
        />
      </FormField>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink-700 dark:text-ink-300">
        <Checkbox
          checked={rememberMe.field.value}
          onCheckedChange={(checked) => rememberMe.field.onChange(checked === true)}
          onBlur={rememberMe.field.onBlur}
        />
        Remember me
      </label>

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className={`mt-1 ${
          portalTab === "caregiver"
            ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            : ""
        }`}
      >
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
        {portalTab === "caregiver" ? "Access Caregiver Portal" : "Access Vault"}
        {!isSubmitting && <ArrowRight aria-hidden="true" />}
      </Button>
    </form>
  );
}