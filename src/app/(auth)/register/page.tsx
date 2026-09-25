import type { Metadata } from "next";

import { AuthFooter } from "@/features/auth/AuthFooter";
import RegisterForm from "@/features/auth/RegisterForm";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : null;

  return (
    <>
      <h1 className="font-heading text-4xl leading-none font-black tracking-tight text-ink-900 sm:text-5xl">
        Create your
        <br />
        <span className="text-primary">MediTrack AI account.</span>
      </h1>
      <p className="mt-4 mb-9 text-base text-muted-foreground">
        Join thousands protecting their health data with MediTrack AI.
      </p>

      <RegisterForm next={next} />
      <AuthFooter mode="register" next={next} />
    </>
  );
}
