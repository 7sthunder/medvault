import type { Metadata } from "next";

import { AuthFooter } from "@/features/auth/AuthFooter";
import LoginForm from "@/features/auth/LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : null;

  return (
    <>
      <h1 className="font-heading text-4xl leading-none font-black tracking-tight text-ink-900 sm:text-5xl">
        Welcome
        <br />
        <span className="text-primary">back.</span>
      </h1>
      <p className="mt-4 mb-9 text-base text-muted-foreground">
        Securely access your medical timeline.
      </p>

      <LoginForm next={next} />
      <AuthFooter mode="login" next={next} />
    </>
  );
}