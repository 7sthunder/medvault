import type { Metadata } from "next";
import type { ReactNode } from "react";
import { db } from "@/server/db/client";
import { getDemoUser } from "@/server/domain/demo/service";
import type { ProfileMenuUser } from "@/components/layout/ProfileMenu";
import { DemoShell } from "@/features/demo/DemoShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demo Mode · MedVault",
  description: "Live interactive demonstration environment with Arun Kumar (§19) realistic adherence data.",
};

export default async function DemoLayout({ children }: { children: ReactNode }) {
  let demoUser: ProfileMenuUser = {
    name: "Arun Kumar",
    email: "arun@medvault.local",
    image: null,
  };

  try {
    const user = await getDemoUser(db);
    demoUser = {
      name: user.name,
      email: user.email,
      image: user.image ?? null,
    };
  } catch {
    // Graceful fallback if database connection is offline during build
  }

  return (
    <DemoShell demoUser={demoUser}>
      {children}
    </DemoShell>
  );
}
