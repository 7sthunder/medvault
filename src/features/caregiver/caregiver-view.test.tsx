/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/trpc";
import { AcceptInvite } from "./AcceptInvite";
import { AlertFeed } from "./AlertFeed";
import { CaregiverOverview } from "./CaregiverOverview";
import { CaregiverPage } from "./CaregiverPage";
import { InviteForm } from "./InviteForm";
import { PermissionsEditor } from "./PermissionsEditor";
import { RelationshipList } from "./RelationshipList";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === "token" ? "sample-token-123" : null),
  }),
}));

// Mock matchMedia
beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock api
vi.mock("@/lib/trpc", () => ({
  api: {
    useUtils: vi.fn(() => ({
      caregiver: {
        listCaregivers: { invalidate: vi.fn() },
        listInvitations: { invalidate: vi.fn() },
        listPatients: { invalidate: vi.fn() },
        listAlerts: { invalidate: vi.fn() },
        getAlert: { invalidate: vi.fn() },
      },
    })),
    caregiver: {
      invite: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
      listCaregivers: {
        useQuery: vi.fn(() => ({ data: [] })),
      },
      listInvitations: {
        useQuery: vi.fn(() => ({ data: [] })),
      },
      revokeInvitation: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
      revokeCaregiver: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
      updatePermissions: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
      getInvitation: {
        useQuery: vi.fn(),
      },
      acceptInvitation: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
      listPatients: {
        useQuery: vi.fn(() => ({ data: [] })),
      },
      patientOverview: {
        useQuery: vi.fn(),
      },
      listAlerts: {
        useQuery: vi.fn(() => ({ data: [] })),
      },
      updateAlert: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
      connectWithCode: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
      leavePatient: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
    },
    appointments: {
      list: {
        useQuery: vi.fn(() => ({ data: [], isLoading: false })),
      },
      update: {
        useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
      },
      cancel: {
        useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
      },
      create: {
        useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
      },
    },
  },
}));

describe("Phase 21 — Caregiver UI Components", () => {
  describe("InviteForm", () => {
    it("renders form fields and submits invitation", async () => {
      const mutate = vi.fn();
      vi.mocked(api.caregiver.invite.useMutation).mockReturnValue({
        mutate,
        isPending: false,
      } as never);

      render(<InviteForm />);

      expect(screen.getByText("Invite a Caregiver")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("caregiver@example.com")).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText("caregiver@example.com"), {
        target: { value: "friend@medvault.test" },
      });

      fireEvent.click(screen.getByRole("button", { name: /send invitation/i }));

      await waitFor(() => {
        expect(mutate).toHaveBeenCalledWith(
          expect.objectContaining({
            email: "friend@medvault.test",
          }),
        );
      });
    });
  });

  describe("RelationshipList", () => {
    it("renders connected caregivers and pending invitations", () => {
      vi.mocked(api.caregiver.listCaregivers.useQuery).mockReturnValue({
        data: [
          {
            id: "rel-1",
            patientUserId: "p-1",
            caregiverUserId: "c-1",
            patientName: "Me",
            caregiverName: "Dr. Sarah Clinician",
            status: "active",
            relationType: "professional",
            permissions: {
              viewAdherence: true,
              viewMedications: true,
              receiveMissedDoseAlerts: true,
              receiveInsights: false,
              canAcknowledgeAlerts: true,
            },
            acceptedAt: new Date(),
            createdAt: new Date(),
          },
        ],
        isLoading: false,
      } as never);

      vi.mocked(api.caregiver.listInvitations.useQuery).mockReturnValue({
        data: [
          {
            id: "inv-1",
            email: "pending@medvault.test",
            message: null,
            status: "pending",
            expiresAt: new Date(Date.now() + 86400000),
            createdAt: new Date(),
            token: "tok-123",
            relationType: "family",
          },
        ],
        isLoading: false,
      } as never);

      render(<RelationshipList />);

      expect(screen.getByText("Connected Caregivers (1)")).toBeInTheDocument();
      expect(screen.getByText("Dr. Sarah Clinician")).toBeInTheDocument();
      expect(screen.getByText("Pending Invitations (1)")).toBeInTheDocument();
      expect(screen.getByText("pending@medvault.test")).toBeInTheDocument();
    });
  });

  describe("PermissionsEditor", () => {
    it("renders permissions checkboxes and saves changes", () => {
      const mutate = vi.fn();
      vi.mocked(api.caregiver.updatePermissions.useMutation).mockReturnValue({
        mutate,
        isPending: false,
      } as never);

      const onOpenChange = vi.fn();

      render(
        <PermissionsEditor
          relationshipId="rel-1"
          caregiverName="John Caregiver"
          initialPermissions={{
            viewAdherence: true,
            viewMedications: false,
            receiveMissedDoseAlerts: true,
            receiveInsights: false,
            canAcknowledgeAlerts: true,
          }}
          open={true}
          onOpenChange={onOpenChange}
        />,
      );

      expect(screen.getByText("Caregiver Permissions")).toBeInTheDocument();
      expect(screen.getByText("View Medication Details")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /save permissions/i }));

      expect(mutate).toHaveBeenCalledWith({
        relationshipId: "rel-1",
        permissions: expect.objectContaining({
          viewAdherence: true,
          viewMedications: false,
        }),
      });
    });
  });

  describe("AlertFeed", () => {
    it("renders alerts and triggers acknowledge/resolve", () => {
      const mutate = vi.fn();
      vi.mocked(api.caregiver.updateAlert.useMutation).mockReturnValue({
        mutate,
        isPending: false,
      } as never);

      vi.mocked(api.caregiver.listAlerts.useQuery).mockReturnValue({
        data: [
          {
            id: "a-1",
            type: "missed_dose",
            title: "Missed dose: Metformin",
            body: "Jane missed her scheduled 8:00 AM dose.",
            status: "new",
            createdAt: new Date(),
            resolvedAt: null,
            patientName: "Jane Patient",
            medicationName: "Metformin",
            scheduledFor: new Date(),
            doseEventId: "d-1",
          },
        ],
        isLoading: false,
      } as never);

      render(<AlertFeed />);

      expect(screen.getByText("Caregiver Alerts")).toBeInTheDocument();
      expect(screen.getByText("Missed dose: Metformin")).toBeInTheDocument();

      const ackBtn = screen.getByRole("button", { name: "Acknowledge" });
      fireEvent.click(ackBtn);

      expect(mutate).toHaveBeenCalledWith({
        alertId: "a-1",
        action: "acknowledge",
      });
    });
  });

  describe("AcceptInvite", () => {
    it("renders invitation details and allows accepting", () => {
      const mutate = vi.fn();
      vi.mocked(api.caregiver.acceptInvitation.useMutation).mockReturnValue({
        mutate,
        isPending: false,
      } as never);

      vi.mocked(api.caregiver.getInvitation.useQuery).mockReturnValue({
        data: {
          id: "inv-1",
          patientUserId: "p-1",
          patientName: "Jane Patient",
          patientEmail: "patient@medvault.test",
          email: "caregiver@medvault.test",
          relationType: "family",
          permissions: {
            viewAdherence: true,
            viewMedications: false,
            receiveMissedDoseAlerts: true,
            receiveInsights: false,
            canAcknowledgeAlerts: true,
          },
          message: "Please help monitor my pills",
          status: "pending",
          expiresAt: new Date(Date.now() + 86400000),
        },
        isLoading: false,
        isError: false,
      } as never);

      render(<AcceptInvite />);

      expect(screen.getByText("Jane Patient")).toBeInTheDocument();
      expect(screen.getByText("patient@medvault.test")).toBeInTheDocument();
      expect(screen.getByText(/Please help monitor my pills/)).toBeInTheDocument();

      const acceptBtn = screen.getByRole("button", { name: /accept invitation/i });
      fireEvent.click(acceptBtn);

      expect(mutate).toHaveBeenCalledWith({
        token: "sample-token-123",
      });
    });
  });

  describe("CaregiverOverview", () => {
    it("renders patient switcher and patient adherence overview", () => {
      const mockPatients = [
        {
          id: "rel-1",
          patientUserId: "p-1",
          caregiverUserId: "c-1",
          patientName: "Jane Patient",
          caregiverName: "",
          patientEmail: "patient@medvault.test",
          status: "active" as const,
          relationType: "family" as const,
          permissions: {
            viewAdherence: true,
            viewMedications: true,
            receiveMissedDoseAlerts: true,
            receiveInsights: false,
            canAcknowledgeAlerts: true,
          },
          acceptedAt: new Date(),
          createdAt: new Date(),
        },
        {
          id: "rel-2",
          patientUserId: "p-2",
          caregiverUserId: "c-1",
          patientName: "Uncle Bob",
          caregiverName: "",
          patientEmail: "bob@medvault.test",
          status: "active" as const,
          relationType: "family" as const,
          permissions: {
            viewAdherence: true,
            viewMedications: false,
            receiveMissedDoseAlerts: true,
            receiveInsights: false,
            canAcknowledgeAlerts: true,
          },
          acceptedAt: new Date(),
          createdAt: new Date(),
        },
      ];

      vi.mocked(api.caregiver.patientOverview.useQuery).mockReturnValue({
        data: {
          relationship: mockPatients[0],
          permissions: mockPatients[0]!.permissions,
          adherenceSummary: {
            from: new Date(),
            to: new Date(),
            scheduled: 30,
            taken: 28,
            missed: 1,
            skipped: 1,
            snoozed: 0,
            adherencePercent: 93.3,
            days: [],
            streak: { current: 5, longest: 14, currentEndsToday: true },
            trend: { daily: [], rolling7: [], direction: "improving", current7: 93, prior7: 90 },
            byBucket: [],
          },
          medications: [],
          todayDoses: [],
          recentAlerts: [],
        },
        isLoading: false,
        isSuccess: true,
      } as never);

      const onSelectPatient = vi.fn();

      render(
        <CaregiverOverview
          patients={mockPatients}
          selectedPatientId="p-1"
          onSelectPatient={onSelectPatient}
        />,
      );

      expect(screen.getByRole("heading", { name: "Jane Patient" })).toBeInTheDocument();
      expect(screen.getByText("Compliance Rate")).toBeInTheDocument();
      expect(screen.getByText("93.3%")).toBeInTheDocument();

      // Patient Switcher Select
      const select = screen.getByLabelText("Switch monitored patient");
      expect(select).toBeInTheDocument();
      fireEvent.change(select, { target: { value: "p-2" } });
      expect(onSelectPatient).toHaveBeenCalledWith("p-2");
    });
  });

  describe("CaregiverPage", () => {
    it("renders tabs and controls", () => {
      vi.mocked(api.caregiver.listPatients.useQuery).mockReturnValue({
        data: [],
      } as never);
      vi.mocked(api.caregiver.listCaregivers.useQuery).mockReturnValue({
        data: [],
      } as never);
      vi.mocked(api.caregiver.listInvitations.useQuery).mockReturnValue({
        data: [],
      } as never);

      render(<CaregiverPage />);

      expect(screen.getByText("Caregiver Network")).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "My Caregivers" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Invite" })).toBeInTheDocument();
    });
  });
});
