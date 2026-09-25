import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { loginSchema, type LoginInput } from "@shared/validations/auth";

import { AuthFooterLink, AuthShell } from "@/components/auth-shell";
import { AlertNote } from "@/components/ui/alert";
import { Field, Input, SwitchRow } from "@/components/ui/form";
import { Button } from "@/components/ui/primitives";
import { authClient } from "@/lib/auth";
import { authErrorMessage, hasOnboarded, safeNext } from "@/lib/auth-flow";
import { API_URL, IS_LOCAL_API } from "@/lib/config";

export default function LoginScreen() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    register,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async ({ email, password, rememberMe }: LoginInput) => {
    setServerError(null);
    const res = await authClient.signIn.email({ email, password, rememberMe });
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
      title="Welcome back"
      subtitle="Sign in to see what you need to take and how you are doing."
      footer={<AuthFooterLink prompt="New to MediTrack AI?" href="/register" action="Create an account" />}
    >
      {IS_LOCAL_API ? (
        <AlertNote tone="warning" title="Development server" message={`Connected to ${API_URL}`} />
      ) : null}
      {serverError ? <AlertNote title="Sign-in failed" message={serverError} /> : null}

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

      <Field label="Password" error={errors.password?.message} required>
        <Input
          placeholder="Your password"
          autoCapitalize="none"
          secure
          autoComplete="current-password"
          editable={!isSubmitting}
          invalid={!!errors.password}
          {...register("password", {
            onChange: () => setError("password", { type: "manual", message: undefined }),
          })}
        />
      </Field>

      <Controller
        control={control}
        name="rememberMe"
        render={({ field }) => (
          <SwitchRow
            label="Remember me"
            description="Stay signed in on this device"
            value={field.value}
            onValueChange={field.onChange}
            disabled={isSubmitting}
          />
        )}
      />

      <Button
        label="Sign in"
        size="lg"
        iconRight="arrow-forward"
        loading={isSubmitting}
        onPress={handleSubmit(onSubmit)}
      />
    </AuthShell>
  );
}
