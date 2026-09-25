"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { useController, useForm } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { loginSchema, type LoginInput } from "@/shared/validations/auth";

import { authErrorMessage } from "./auth-error";
import { hasOnboarded, safeNext } from "./flow";
import { PasswordInput } from "./PasswordInput";

export default function LoginForm({ next }: { next: string | null }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

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
      setServerError(authErrorMessage(res.error.code));
      return;
    }
    const session = await authClient.getSession();
    router.push(safeNext(next, { onboardingCompleted: hasOnboarded(session.data?.user) }));
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

      <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink-700">
        <Checkbox
          checked={rememberMe.field.value}
          onCheckedChange={(checked) => rememberMe.field.onChange(checked === true)}
          onBlur={rememberMe.field.onBlur}
        />
        Remember me
      </label>

      <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1">
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
        Access Vault
        {!isSubmitting && <ArrowRight aria-hidden="true" />}
      </Button>
    </form>
  );
}
