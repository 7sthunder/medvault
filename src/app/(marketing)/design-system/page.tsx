"use client"

import { redirect } from "next/navigation"
import { useState, type ReactNode } from "react"
import {
  AlertCircle,
  BellRing,
  Check,
  Clock,
  HeartPulse,
  MessageSquareText,
  Pill,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Brand } from "@/components/brand/Brand"
import { Logo } from "@/components/brand/Logo"
import { Wordmark } from "@/components/brand/Wordmark"
import { AiBrandLockup } from "@/components/brand/Brand"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Chip } from "@/components/ui/chip"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { FormField } from "@/components/ui/form-field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ListRow } from "@/components/ui/list-row"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SectionLabel } from "@/components/ui/section-label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/ui/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { TimePicker } from "@/components/ui/time-picker"
import { Toaster } from "@/components/ui/sonner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

import { ALL_TOKENS, COLOR_TOKENS } from "@/lib/token-doc"
import { cn } from "@/lib/utils"
import { DOSE_STATUSES } from "@/shared/status"

if (process.env.NODE_ENV !== "development") {
  redirect("/")
}

const MEDS = [
  { name: "Metformin 500mg", dose: "1 tablet · every 8h", time: "08:00 · 14:00 · 20:00", status: "taken" },
  { name: "Atorvastatin 20mg", dose: "1 tablet · once daily", time: "21:00", status: "due-now" },
  { name: "Levothyroxine 50µg", dose: "1 tablet · once daily", time: "07:30", status: "upcoming" },
  { name: "Ibuprofen 400mg", dose: "1 tablet · as needed", time: "12:00", status: "missed" },
] as const

function StorySection({
  id,
  kicker,
  title,
  children,
}: {
  id: string
  kicker: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} data-slot={id} className="grid gap-5">
      <div className="grid gap-1">
        <SectionLabel tone="cyan">{kicker}</SectionLabel>
        <h2 className="font-heading text-xl font-bold tracking-tight text-ink-900">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function StoryGrid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-wrap items-start gap-4", className)}>{children}</div>
  )
}

function StoryTile({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid min-w-40 gap-2", className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export default function DesignSystemPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [doseTime, setDoseTime] = useState("08:00")
  const [doseDate, setDoseDate] = useState("")
  const [pillCount, setPillCount] = useState("2")
  const [frequency, setFrequency] = useState("daily-fixed")
  const [takeNow, setTakeNow] = useState(true)
  const [remember, setRemember] = useState(true)
  const [remindVia, setRemindVia] = useState("push")
  const [tab, setTab] = useState("today")

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Toaster />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <Brand size={36} />
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Design System <span className="text-ink-400">· Stitch export §5</span>
            </span>
          </div>
          <nav aria-label="Design system sections" className="flex flex-wrap items-center gap-1">
            <SectionLink href="#tokens">Tokens</SectionLink>
            <SectionLink href="#type">Type</SectionLink>
            <SectionLink href="#buttons">Buttons</SectionLink>
            <SectionLink href="#forms">Forms</SectionLink>
            <SectionLink href="#status">Status</SectionLink>
            <SectionLink href="#meds">Med story</SectionLink>
            <SectionLink href="#overlays">Overlays</SectionLink>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-hero-gradient border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-14">
          <SectionLabel tone="emerald">MedVault · Phase 03</SectionLabel>
          <h1 className="mt-2 max-w-2xl font-heading text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
            One token set, one component language.
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-600">
            Every colour, shadow and radius in this catalogue traces back to plan §5 — verified
            against the Stitch export (§7). No hardcoded brand hex anywhere in features.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button size="lg"><Plus data-icon="inline-start" /> Add medication</Button>
            <Button size="lg" variant="secondary"><HeartPulse data-icon="inline-start" /> Secondary</Button>
            <AiBrandLockup Icon={MessageSquareText} href="/design-system" />
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl space-y-16 px-4 py-14">
        {/* ============ TOKENS ============ */}
        <StorySection id="tokens" kicker="01 · Tokens" title="Colour & shadows (§5.3 / §5.4)">
          <div className="grid gap-8 xl:grid-cols-2">
            {/* Colour swatches */}
            <div className="grid gap-1.5">
              {COLOR_TOKENS.map((t) => (
                <div
                  key={t.cssVar}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-2 text-sm"
                >
                  <span
                    aria-hidden
                    className="h-8 w-8 shrink-0 rounded-md ring-1 ring-ink-900/10"
                    style={{ backgroundColor: `var(${t.cssVar})` }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink-900">{t.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.cssVar}</p>
                  </div>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-ink-600">{t.value}</code>
                  {t.provenance === "extended" && <Badge variant="outline">plan §12</Badge>}
                </div>
              ))}
            </div>
            {/* Shadow swatches */}
            <div className="grid content-start gap-1.5">
              <p className="text-xs font-medium text-muted-foreground">Shadows (§5.4)</p>
              <div className="flex flex-wrap gap-6 bg-muted/60 p-6 rounded-xl">
                {ALL_TOKENS.filter((t) => t.cssVar.startsWith("--shadow")).map((t) => (
<div key={t.cssVar} className="grid gap-2">
                  <div
                    className="h-16 w-24 rounded-lg bg-card ring-1 ring-ink-900/5"
                    style={{ boxShadow: `var(${t.cssVar})` }}
                  />
                  <p className="text-xs text-muted-foreground">{t.label}</p>
                  <code className="rounded bg-muted px-1 py-0.5 text-xs text-ink-600">{t.cssVar}</code>
                </div>
                ))}
              </div>
              <Separator className="my-2" />
              <div className="rounded-xl p-6 ring-1 ring-ink-900/5 glass-card">
                <p className="text-sm font-semibold text-ink-900">Glass card</p>
                <p className="text-xs text-muted-foreground">
                  inset blur + 1px emerald border + glass shadow — dashboard insight cards.
                </p>
              </div>
            </div>
          </div>
        </StorySection>

        {/* ============ TYPOGRAPHY ============ */}
        <StorySection id="type" kicker="02 · Type" title="Type scale (§5.2)">
          <div className="grid max-w-2xl gap-5 rounded-xl border border-border bg-card p-6">
            <SectionLabel tone="violet">Your medications, one tap away</SectionLabel>
            <h1 className="font-heading font-extrabold tracking-tight text-ink-900" style={{ fontSize: "clamp(42px,5.5vw,72px)", lineHeight: 1.08, letterSpacing: "-0.03em" }}>
              Never miss a dose again.
            </h1>
            <h2 className="font-heading font-bold tracking-tight text-ink-900" style={{ fontSize: "clamp(28px,3.5vw,44px)" }}>
              Built for real routines, not just reminders.
            </h2>
            <h3 className="font-heading font-extrabold tracking-tight text-ink-900" style={{ fontSize: "clamp(24px,2.6vw,32px)" }}>
              All your meds in one place
            </h3>
            <p style={{ fontSize: "16px" }} className="leading-relaxed text-ink-600">
              Body copy sits at 15–17px in ink-600 with relaxed leading — readable on cards,
              dashboards and mobile. <span className="font-semibold text-ink-900">Semibold ink-900</span>{" "}
              for emphasis, never a colour substitute.
            </p>
          </div>
        </StorySection>

        {/* ============ BUTTONS ============ */}
        <StorySection id="buttons" kicker="03 · Buttons" title="Actions (§5.5)">
          <StoryGrid className="items-end">
            <StoryTile label="Default">
              <Button>Save changes</Button>
            </StoryTile>
            <StoryTile label="Hover">
              <Button className="hover:bg-primary-dark">Save changes</Button>
            </StoryTile>
            <StoryTile label="Secondary">
              <Button variant="secondary"><Plus data-icon="inline-start" /> Add medication</Button>
            </StoryTile>
            <StoryTile label="Outline">
              <Button variant="outline">View schedule</Button>
            </StoryTile>
            <StoryTile label="Ghost">
              <Button variant="ghost">Skip</Button>
            </StoryTile>
            <StoryTile label="Destructive">
              <Button variant="destructive"><Trash2 data-icon="inline-start" /> Delete</Button>
            </StoryTile>
            <StoryTile label="Link">
              <Button variant="link">Manage reminders</Button>
            </StoryTile>
            <StoryTile label="Disabled">
              <Button disabled>Add medication</Button>
            </StoryTile>
            <StoryTile label="Sizes">
              <StoryGrid className="items-center gap-3">
                <Button size="xs">Tiny</Button>
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
              </StoryGrid>
            </StoryTile>
          </StoryGrid>
        </StorySection>

        {/* ============ FORMS ============ */}
        <StorySection id="forms" kicker="04 · Forms" title="Inputs, fields & schedules (§5.5)">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="grid gap-5 rounded-xl border border-border bg-card p-6">
              <FormField label="Medication name" required error="At least 2 characters.">
                <Input defaultValue="Met" aria-invalid />
              </FormField>
              <FormField label="Dose / strength" hint="e.g. ‘500 mg’, ‘1 tablet’">
                <Input placeholder="500 mg" />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <StoryTile label="Start date">
                  <DatePicker value={doseDate} onChange={setDoseDate} />
                </StoryTile>
                <StoryTile label="First dose time">
                  <TimePicker value={doseTime} onChange={setDoseTime} />
                </StoryTile>
              </div>
              <StoryTile label="Frequency">
                <Select value={frequency} onValueChange={(v) => setFrequency(v ?? "daily-fixed")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily-fixed">Daily · fixed times</SelectItem>
                    <SelectItem value="daily-diff">Daily · varied times</SelectItem>
                    <SelectItem value="every-8h">Every 8 hours</SelectItem>
                    <SelectItem value="as-needed">As needed</SelectItem>
                  </SelectContent>
                </Select>
              </StoryTile>
              <StoryGrid>
                <StoryTile label="Pills to take">
                  <TimeStepper value={pillCount} onChange={setPillCount} />
                </StoryTile>
                <StoryTile label="Toast">
                  <Button variant="outline" onClick={() => toast.success("Medication added")}>
                    Fire a toast
                  </Button>
                </StoryTile>
              </StoryGrid>
            </div>

            <div className="grid gap-5 rounded-xl border border-border bg-card p-6">
              <StoryGrid>
                <StoryTile label="Take now">
                  <Switch checked={takeNow} onCheckedChange={setTakeNow} />
                </StoryTile>
                <StoryTile label="Remind me">
                  <Switch checked={remember} onCheckedChange={setRemember} />
                </StoryTile>
                <StoryTile label="Textarea">
                  <Textarea placeholder="Notes…" className="w-64 min-h-20" />
                </StoryTile>
              </StoryGrid>
              <StoryTile label="Remind via">
                <RadioGroup value={remindVia} onValueChange={setRemindVia}>
                  <Label className="flex items-center gap-2 font-normal">
                    <RadioGroupItem value="push" /> Push notification
                  </Label>
                  <Label className="flex items-center gap-2 font-normal">
                    <RadioGroupItem value="sms" /> SMS
                  </Label>
                  <Label className="flex items-center gap-2 font-normal">
                    <RadioGroupItem value="email" /> Email
                  </Label>
                </RadioGroup>
              </StoryTile>
              <StoryGrid>
                <StoryTile label="Checkbox">
                  <Label className="flex items-center gap-2 font-normal">
                    <Checkbox defaultChecked /> Enabled
                  </Label>
                </StoryTile>
                <StoryTile label="Select in error">
                  <Select value="" onValueChange={() => {}}>
                    <SelectTrigger className="w-full" aria-invalid>
                      <SelectValue placeholder="Choose…" />
                    </SelectTrigger>
                  </Select>
                </StoryTile>
              </StoryGrid>
            </div>
          </div>

          <StoryGrid>
            <StoryTile label="Lockup (Brand)">
              <Brand />
            </StoryTile>
            <StoryTile label="Wordmark only">
              <Wordmark size={20} />
            </StoryTile>
            <StoryTile label="Logo sizes">
              <StoryGrid>
                <Logo size={36} href={null} />
                <Logo size={40} href={null} />
                <Logo size={44} href={null} />
              </StoryGrid>
            </StoryTile>
          </StoryGrid>
        </StorySection>

        {/* ============ STATUS ============ */}
        <StorySection id="status" kicker="05 · Status" title="Dose status chips (§12)">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Never colour-only: every status ships an icon, the visible label, and an
            <code className="rounded bg-muted px-1 py-0.5 text-xs"> aria-label</code>.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="grid gap-3 rounded-xl border border-border bg-card p-6">
              <p className="text-xs font-medium text-muted-foreground">StatusBadge · pill</p>
              <StoryGrid className="gap-2">
                {DOSE_STATUSES.map((s) => (
                  <StatusBadge key={s} status={s} />
                ))}
              </StoryGrid>
            </div>
            <div className="grid gap-3 rounded-xl border border-border bg-card p-6">
              <p className="text-xs font-medium text-muted-foreground">StatusIndicator · inline</p>
              <StoryGrid className="gap-x-4 gap-y-2">
                {DOSE_STATUSES.map((s) => (
                  <StatusIndicator key={s} status={s} />
                ))}
              </StoryGrid>
            </div>
          </div>
        </StorySection>

        {/* ============ MEDICATION STORY ============ */}
        <StorySection id="meds" kicker="06 · Stitch story" title="Medication list (§1 dashboard · §2)">
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="shadow-card-sm">
              <CardHeader>
                <CardTitle>Today — 4 of 6 taken</CardTitle>
                <CardDescription>Stitch med card: icon tile, name, dose, times, status</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {MEDS.map((m) => (
                  <ListRow
                    key={m.name}
                    icon={Pill}
                    iconClass="bg-primary-tint text-primary-dark"
                    title={m.name}
                    subtitle={<span className="flex items-center gap-2"><span>{m.dose}</span><Clock className="size-3" />{m.time}</span>}
                    right={<StatusBadge status={m.status} />}
                    onClick={() => setDialogOpen(true)}
                  />
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <StatCard
                title="Adherence"
                value="94.2%"
                icon={ShieldCheck}
                tone="emerald"
                subtitle="▲ 3.1% vs last week"
                footer={<Chip tone="cyan">8-day streak</Chip>}
              />
              <StatCard
                title="Doses today"
                value="6"
                icon={BellRing}
                tone="amber"
                subtitle="1 missed · 1 due now"
              />
              <EmptyState
                icon={Pill}
                title="No medications yet"
                description="Add your first medication to build today's schedule."
                action={<Button size="sm"><Plus data-icon="inline-start" /> Add medication</Button>}
              />
            </div>
          </div>
        </StorySection>

        {/* ============ DATA + FEEDBACK ============ */}
        <StorySection id="feedback" kicker="07 · Feedback" title="Alerts, chips, skeletons">
          <div className="grid gap-4 lg:grid-cols-2">
            <Alert>
              <BellRing className="size-4" aria-hidden="true" />
              <AlertTitle>Dose due at 21:00</AlertTitle>
              <AlertDescription>Atorvastatin 20 mg — it&apos;s timed with dinner.</AlertDescription>
              <AlertAction><Button size="sm">Mark taken</Button></AlertAction>
            </Alert>
            <ErrorState
              compact
              icon={AlertCircle}
              title="Couldn't load your history"
              action={<Button variant="outline" size="sm">Retry</Button>}
            />
            <StoryTile label="Chips (§2 dashboard topics)">
              <StoryGrid className="gap-2">
                <Chip tone="emerald" leading={<Check className="size-3.5" />}>On track</Chip>
                <Chip tone="cyan">Morning</Chip>
                <Chip tone="magenta">Chronic</Chip>
                <Chip tone="violet">AI insight</Chip>
                <Chip tone="blue">New</Chip>
                <Chip tone="slate">Idle</Chip>
              </StoryGrid>
            </StoryTile>
            <div className="grid w-full gap-3 rounded-xl border border-border bg-card p-5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </StorySection>

        {/* ============ OVERLAYS ============ */}
        <StorySection id="overlays" kicker="08 · Overlays" title="Dialog, drawer, menus, tabs, tooltips">
          <StoryGrid className="items-end">
            <StoryTile label="Dialog">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger render={<Button variant="outline" />}>Open dialog</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm dose</DialogTitle>
                    <DialogDescription>Metformin 500 mg — take now with water?</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Not now</Button>
                    <Button onClick={() => setDialogOpen(false)}>Taken</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </StoryTile>

            <StoryTile label="Bottom drawer">
              <Drawer>
                <DrawerTrigger render={<Button variant="outline" />}>Open drawer</DrawerTrigger>
                <DrawerContent>
                  <DrawerHandle />
                  <DrawerHeader>
                    <DrawerTitle>Dose details</DrawerTitle>
                    <DrawerDescription>Atorvastatin 20 mg · 21:00</DrawerDescription>
                  </DrawerHeader>
                  <ListRow icon={Pill} title="Take now" right={<Switch />} />
                  <DrawerFooter>
                    <Button variant="outline">Snooze 30 min</Button>
                    <Button>Mark taken</Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </StoryTile>

            <StoryTile label="Dropdown">
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" />}>More</DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Medication</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => toast("Editing medication")}>
                    <SlidersHorizontal /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast("Snoozed 30 min")}>
                    <Clock /> Snooze
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
                    <Trash2 /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </StoryTile>

            <StoryTile label="Popover">
              <Popover>
                <PopoverTrigger render={<Button variant="outline" />}>Why this rate?</PopoverTrigger>
                <PopoverContent>
                  <PopoverHeader>
                    <PopoverTitle>94.2% adherence</PopoverTitle>
                    <PopoverDescription>3 of 5 weeks above 90%. Keep it up.</PopoverDescription>
                  </PopoverHeader>
                </PopoverContent>
              </Popover>
            </StoryTile>

            <StoryTile label="Tooltip">
              <Tooltip>
                <TooltipTrigger render={<Button variant="outline" size="icon-sm" />}>
                  <HeartPulse />
                </TooltipTrigger>
                <TooltipContent>Heart health summary</TooltipContent>
              </Tooltip>
            </StoryTile>
          </StoryGrid>

          <StoryGrid className="items-end">
            <StoryTile label="Tabs">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <TabsContent value={tab} className="pt-2">
                  {tab === "today" && <p className="text-sm text-muted-foreground">4 doses today.</p>}
                  {tab === "upcoming" && <p className="text-sm text-muted-foreground">Next dose 21:00.</p>}
                  {tab === "history" && <p className="text-sm text-muted-foreground">30-day log ready.</p>}
                </TabsContent>
              </Tabs>
            </StoryTile>

            <StoryTile label="Avatar + badges">
              <StoryGrid>
                <Avatar>
                  <AvatarImage src="" alt="Dr. Okafor" />
                  <AvatarFallback>DO</AvatarFallback>
                </Avatar>
                <Badge>New</Badge>
                <Badge variant="secondary">In stock</Badge>
                <Badge variant="destructive">Out of stock</Badge>
                <Badge variant="outline">OTC</Badge>
              </StoryGrid>
            </StoryTile>

            <StoryTile label="Pagination">
              <Pagination>
                <PaginationContent>
                  <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
                  <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
                  <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
                  <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
                  <PaginationItem><PaginationEllipsis /></PaginationItem>
                  <PaginationItem><PaginationNext href="#" /></PaginationItem>
                </PaginationContent>
              </Pagination>
            </StoryTile>
          </StoryGrid>
        </StorySection>

        {/* ============ FOOTER ============ */}
        <footer className="border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Built from plan §5 — verify against <code className="rounded bg-muted px-1 py-0.5 text-xs">docs/stitch-analysis.md</code>
          </p>
        </footer>
      </main>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this medication?"
        description="Atorvastatin 20 mg and its schedule will be removed from the app."
        confirmLabel="Delete"
        onConfirm={() => {
          setConfirmOpen(false)
          toast("Medication deleted")
        }}
      />
    </div>
  )
}

function SectionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </a>
  )
}

/** §5.5 pill stepper used for "pills to take". */
function TimeStepper({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-1 text-sm">
      <Button variant="ghost" size="icon-sm" aria-label="Decrease pills" onClick={() => onChange(String(Math.max(0, Number(value) - 1)))}>
        <Plus className="rotate-45" />
      </Button>
      <span aria-live="polite" className="min-w-6 text-center text-sm font-semibold text-ink-900">
        {value}
      </span>
      <Button variant="ghost" size="icon-sm" aria-label="Increase pills" onClick={() => onChange(String(Number(value) + 1))}>
        <Plus />
      </Button>
    </div>
  )
}