"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { useController, useForm } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  // Forgot password dialog state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const onResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    setResetStatus("sending");
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      const data = (await res.json()) as {
        status?: boolean;
        message?: string;
        error?: { code?: string; message?: string };
      };
      if (!res.ok) {
        setResetStatus("failed");
        setResetMessage(data?.error?.message ?? `Request failed (${res.status}). Try again later.`);
        return;
      }
      setResetStatus("sent");
      setResetMessage(data?.message ?? "If an account exists for that email, you'll receive a password reset link shortly.");
    } catch {
      setResetStatus("failed");
      setResetMessage("Could not send reset email. Try again later.");
    }
  };

  return (
    <>
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

        <FormField
          label={
            <div className="flex items-center justify-between w-full">
              Password <span className="text-red">*</span>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsResetOpen(true);
                }}
              >
                Forgot password?
              </Button>
            </div>
          }
          error={errors.password?.message}
          required={false}
        >
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
          Sign in to MediTrack AI
          {!isSubmitting && <ArrowRight aria-hidden="true" />}
        </Button>
      </form>

      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forgot password?</DialogTitle>
            <DialogDescription>
              Enter your email address and we will send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onResetSubmit} className="flex flex-col gap-4">
            <FormField label="Email Address" required>
              <Input
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                inputMode="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                disabled={resetStatus === "sending"}
              />
            </FormField>
            {resetMessage && (
              <Alert variant={resetStatus === "failed" ? "destructive" : "default"}>
                <AlertTitle>
                  {resetStatus === "failed" ? "Reset failed" : "Reset email sent"}
                </AlertTitle>
                <AlertDescription>{resetMessage}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResetOpen(false)}
                disabled={resetStatus === "sending"}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={resetStatus === "sending" || !resetEmail.trim()}
              >
                {resetStatus === "sending" && (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                )}
                Send reset link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
