"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { registerSchema, type RegisterInput } from "@/shared/validations/auth";

import { authErrorMessage } from "./auth-error";
import { hasOnboarded, safeNext } from "./flow";
import { PasswordInput } from "./PasswordInput";

export default function RegisterForm({ next }: { next: string | null }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: RegisterInput) => {
    setServerError(null);
    const res = await authClient.signUp.email(values);
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
          <AlertTitle>Registration failed</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

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
