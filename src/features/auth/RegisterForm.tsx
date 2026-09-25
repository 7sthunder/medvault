"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, HeartHandshake, Loader2, User } from "lucide-react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { registerSchema, type RegisterFormValues, type RegisterInput } from "@/shared/validations/auth";

import { authErrorMessage } from "./auth-error";
import { getUserRole, hasOnboarded, safeNext } from "./flow";
import { PasswordInput } from "./PasswordInput";

export default function RegisterForm({ next }: { next: string | null }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues, unknown, RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: "patient" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (values: RegisterInput) => {
    setServerError(null);
    const payload = {
      name: values.name,
      email: values.email,
      password: values.password,
      ...(values.role && values.role !== "patient" ? { role: values.role } : {}),
    };
    const res = await authClient.signUp.email(payload);
    if (res.error) {
      setServerError(authErrorMessage(res.error.code, res.error.message));
      return;
    }
    const session = await authClient.getSession();
    const role = getUserRole(session.data?.user) || values.role || "patient";
    router.push(safeNext(next, { onboardingCompleted: hasOnboarded(session.data?.user), role }));
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {serverError && (
        <Alert variant="destructive">
          <AlertTitle>Registration failed</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {/* Role Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-ink-500">
          I am registering as
        </label>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-ink-100/60 p-1 dark:bg-ink-900/60 border border-ink-200/50 dark:border-ink-800/50">
          <button
            type="button"
            onClick={() => setValue("role", "patient")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-medium transition-all ${
              selectedRole === "patient"
                ? "bg-white dark:bg-ink-800 text-teal-700 dark:text-teal-400 shadow-sm ring-1 ring-teal-500/20"
                : "text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Patient</span>
          </button>
          <button
            type="button"
            onClick={() => setValue("role", "caregiver")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-medium transition-all ${
              selectedRole === "caregiver"
                ? "bg-white dark:bg-ink-800 text-teal-700 dark:text-teal-400 shadow-sm ring-1 ring-teal-500/20"
                : "text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100"
            }`}
          >
            <HeartHandshake className="h-4 w-4" />
            <span>Caregiver</span>
          </button>
        </div>
      </div>

      <FormField label="Full Name" error={errors.name?.message} required>
        <Input
          type="text"
          placeholder="e.g. Sarah Jenkins"
          autoComplete="name"
          disabled={isSubmitting}
          {...register("name")}
        />
      </FormField>

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
          placeholder="At least 8 chars, letter + number"
          autoComplete="new-password"
          disabled={isSubmitting}
          {...register("password")}
        />
      </FormField>

      <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1">
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
        Create Vault
        {!isSubmitting && <ArrowRight aria-hidden="true" />}
      </Button>
    </form>
  );
}