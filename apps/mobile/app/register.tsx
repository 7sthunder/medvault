import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { registerSchema, type RegisterInput } from "@shared/validations/auth";

import { AuthFooterLink, AuthShell } from "@/components/auth-shell";
import { AlertNote } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/primitives";
import { authClient } from "@/lib/auth";
import { authErrorMessage, hasOnboarded, safeNext } from "@/lib/auth-flow";

export default function RegisterScreen() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    handleSubmit,
    register,
    setError,
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
    router.replace(
      safeNext(null, {
        onboardingCompleted: hasOnboarded(session.data?.user as Record<string, unknown> | undefined),
      }),
    );
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start tracking doses, adherence and insights in under a minute."
      footer={<AuthFooterLink prompt="Already have an account?" href="/login" action="Sign in" />}
    >
      {serverError ? <AlertNote title="Registration failed" message={serverError} /> : null}

      <Field label="Full name" error={errors.name?.message} required>
        <Input
          placeholder="e.g. Sarah Jenkins"
          autoCapitalize="words"
          autoComplete="name"
          editable={!isSubmitting}
          invalid={!!errors.name}
          {...register("name", {
            onChange: () => setError("name", { type: "manual", message: undefined }),
          })}
        />
      </Field>

      <Field label="Email address" error={errors.email?.message} required>
        <Input
          placeholder="name@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          editable={!isSubmitting}
          invalid={!!errors.email}
          {...register("email", {
            onChange: () => setError("email", { type: "manual", message: undefined }),
          })}
        />
      </Field>

      <Field
        label="Password"
        error={errors.password?.message}
        required
        hint="At least 8 characters, including a letter and a number"
      >
        <Input
          placeholder="Create a password"
          autoCapitalize="none"
          secure
          autoComplete="new-password"
          editable={!isSubmitting}
          invalid={!!errors.password}
          {...register("password", {
            onChange: () => setError("password", { type: "manual", message: undefined }),
          })}
        />
      </Field>

      <Button
        label="Create account"
        size="lg"
        iconRight="arrow-forward"
        loading={isSubmitting}
        onPress={handleSubmit(onSubmit)}
      />
    </AuthShell>
  );
}
