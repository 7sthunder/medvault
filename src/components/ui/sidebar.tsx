"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { cva, type VariantProps } from "class-variance-authority";
import { PanelLeftIcon, XIcon } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsDesktop } from "@/lib/use-media-query";

/**
 * Sidebar primitive, ported from the shadcn/ui collapsible sidebar used by the reference app
 * (`a-s-unique-group`, `src/components/ui/sidebar.tsx`).
 *
 * Three things are load-bearing and differ from a hand-rolled fixed rail:
 *
 * 1. The content offset is an in-flow element (`sidebar-gap`), not padding on the page. The rail
 *    itself is `fixed`; the gap div is what occupies its width. The two therefore cannot drift
 *    apart, and `SidebarInset` needs to know nothing about the sidebar at all.
 * 2. Collapse is a `data-collapsible="icon"` attribute on a group, so every descendant styles
 *    itself off that one bit (`group-data-[collapsible=icon]:...`) instead of a `collapsed`
 *    boolean threaded through props.
 * 3. State is a context, so the trigger, the rail edge, and the mobile drawer all toggle the same
 *    thing, and the choice persists in a cookie.
 *
 * Deliberate deviations from the reference:
 * - `Ctrl/Cmd+B` is bound, as upstream.
 * - The mobile drawer is MedVault's base-ui `Drawer` at the `lg` breakpoint rather than a Radix
 *   `Sheet` at `md`, so the existing `lg` rail and `BottomNav` arrangement are untouched.
 * - Both branches render at once and are separated by `lg:hidden` / `hidden lg:block` rather than
 *   by a JS `isMobile` branch. The reference branches in JS, which means its sidebar is absent
 *   from the server HTML; keeping both mounted lets CSS own the switch and keeps the first paint
 *   correct.
 */
const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "240px";
const SIDEBAR_WIDTH_ICON = "72px";
const SIDEBAR_WIDTH_MOBILE = "240px";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider.");
  return context;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return match?.[2] ? decodeURIComponent(match[2]) : null;
}

const sidebarListeners = new Set<() => void>();

/**
 * The collapse choice is a cookie, which makes it a genuine external store: another tab can change
 * it underneath us. `useSyncExternalStore` is the right tool because the server cannot read a
 * cookie — the server snapshot is `defaultOpen`, and React swaps in the stored value right after
 * hydration. That keeps the first client render byte-identical to the server HTML (no hydration
 * mismatch) and avoids the flash that a `useState` + effect restore would produce.
 */
function subscribeToSidebarState(onStoreChange: () => void) {
  sidebarListeners.add(onStoreChange);
  // Re-read on focus: the user may have collapsed the rail in another tab.
  window.addEventListener("focus", onStoreChange);
  return () => {
    sidebarListeners.delete(onStoreChange);
    window.removeEventListener("focus", onStoreChange);
  };
}

function getSidebarStateSnapshot(): boolean {
  const stored = readCookie(SIDEBAR_COOKIE_NAME);
  return stored === null ? true : stored === "true";
}

/**
 * `false` while rendering on the server and during hydration, `true` from the first client effect
 * onwards. Used to pick the rail for the very first paint without a `setState`-in-effect.
 */
const noopSubscribe = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  // The rail starts at `lg`, so `lg` is what "mobile" means here. `useIsDesktop` reports `false`
  // during SSR and the first client render, which is only ever read from event handlers
  // (a toggle click, a tooltip hover) that cannot fire before hydration has settled.
  const isDesktop = useIsDesktop();
  const isMobile = !isDesktop;
  const [openMobile, setOpenMobile] = React.useState(false);

  const storeOpen = React.useSyncExternalStore(
    subscribeToSidebarState,
    getSidebarStateSnapshot,
    () => defaultOpen,
  );
  const open = openProp ?? storeOpen;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) setOpenProp(openState);
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      sidebarListeners.forEach((listener) => listener());
    },
    [setOpenProp, open],
  );

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) setOpenMobile((value) => !value);
    else setOpen((value) => !value);
  }, [isMobile, setOpen]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delay={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn("flex min-h-svh w-full bg-background", className)}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const { state, openMobile, setOpenMobile, isMobile } = useSidebar();

  // Exactly one navigation tree is ever mounted, otherwise an open drawer would leave a second,
  // hidden copy of every nav link in the accessibility tree. The server and the first client render
  // emit the rail: it is `hidden` below `lg`, so choosing it costs mobile users nothing visually,
  // whereas choosing the drawer would cost desktop users a visible sidebar flash.
  const hydrated = React.useSyncExternalStore(
    noopSubscribe,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );
  const showRail = !hydrated || !isMobile;

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "hidden w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground lg:flex",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  const rail = (
    <div
      data-slot="sidebar-desktop"
      className="group peer hidden text-sidebar-foreground lg:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
    >
      {/* In-flow spacer: this is the page's left offset, so the content never has to know the
          sidebar exists. */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-30 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear lg:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="flex h-full w-full flex-col bg-[#F0FAF7] text-[#172033] group-data-[side=left]:border-r group-data-[side=left]:border-[#DDECE7] overflow-x-hidden overflow-y-hidden transition-all duration-200 group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  );

  return showRail ? (
    rail
  ) : (
    <DrawerPrimitive.Root open={openMobile} onOpenChange={setOpenMobile} modal>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Backdrop className="fixed inset-0 z-50 bg-ink-900/40 duration-150 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DrawerPrimitive.Popup
          data-slot="sidebar-mobile"
          data-mobile="true"
          style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
          className="fixed inset-y-0 left-0 z-50 flex w-(--sidebar-width) max-w-[85vw] flex-col border-r border-[#DDECE7] bg-[#F0FAF7] text-[#172033] outline-none duration-300 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-left-2 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-left-2"
        >
          <DrawerPrimitive.Title className="sr-only">Navigation menu</DrawerPrimitive.Title>
          <button
            type="button"
            data-sidebar="mobile-close"
            aria-label="Close menu"
            onClick={() => setOpenMobile(false)}
            className="absolute top-3 right-3 z-20 flex size-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent/70"
          >
            <XIcon className="size-4" />
          </button>
          <div className="flex h-full w-full flex-col">{children}</div>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}

function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar, state, openMobile } = useSidebar();
  const expanded = state === "expanded";

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon-sm"
      className={cn(className)}
      aria-expanded={expanded || openMobile}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      data-slot="sidebar-rail"
      /* Named apart from the header trigger on purpose: two buttons answering to the same
         accessible name in one page is a needless ambiguity, and this one is a pointer-only edge
         affordance (tabIndex -1) rather than part of the tab order. */
      aria-label="Toggle sidebar from the edge"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 hover:after:bg-sidebar-border after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] lg:flex",
        "group-data-[collapsible=offcanvas]:translate-x-0",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The page column beside the rail. A `div`, not a `<main>`: every feature page already renders its
 * own `<main>` landmark, and a second one here would be invalid HTML and fail axe's duplicate-main
 * rule.
 */
function SidebarInset({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background",
        "peer-data-[variant=inset]:m-2 peer-data-[variant=inset]:ml-0 peer-data-[variant=inset]:rounded-xl peer-data-[variant=inset]:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn(
        "flex flex-col p-4 pb-2 border-b border-[#DDECE7]/50 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pt-4",
        className,
      )}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col p-2 group-data-[collapsible=icon]:items-center", className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-6 group-data-[collapsible=icon]:gap-4 overflow-y-auto overflow-x-hidden pt-6",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn(
        "relative flex w-full min-w-0 flex-col px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "flex h-6 shrink-0 items-center rounded-md px-3 text-[11px] font-semibold text-[#718096] uppercase tracking-wider mb-2",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn(
        "flex w-full min-w-0 flex-col gap-1 group-data-[collapsible=icon]:items-center",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn(
        "group/menu-item relative group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center",
        className,
      )}
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-[10px] text-left text-[15px] font-medium text-[#172033] outline-hidden ring-sidebar-ring transition-[width,height,padding,background-color] duration-200 hover:bg-[#E7F7F2] hover:text-[#172033] focus-visible:ring-2 active:bg-[#E7F7F2] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:bg-[#DDF7EC] data-active:font-semibold data-active:text-[#00A88F] data-[state=open]:hover:bg-[#E7F7F2] data-[state=open]:hover:text-[#172033] group-data-[collapsible=icon]:w-[48px]! group-data-[collapsible=icon]:h-[44px]! group-data-[collapsible=icon]:m-0! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-[12px] [&>span:last-child]:truncate [&>svg]:size-[19px] [&>svg]:shrink-0 [&>svg]:text-[#536174] hover:[&>svg]:text-[#172033] data-active:[&>svg]:text-[#00A88F] relative data-active:before:absolute data-active:before:left-0 data-active:before:top-1/2 data-active:before:-translate-y-1/2 data-active:before:h-6 data-active:before:w-[3px] data-active:before:bg-[#00A88F] data-active:before:rounded-r-md group-data-[collapsible=icon]:data-active:before:hidden",
  {
    variants: {
      variant: {
        default: "",
        outline: "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))]",
      },
      size: {
        default: "h-11 px-3",
        sm: "h-9 px-2.5 text-sm",
        lg: "h-11 px-3 group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function SidebarMenuButton({
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  render,
  ...props
}: useRender.ComponentProps<"button"> & {
  isActive?: boolean;
  tooltip?: string;
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const { state, isMobile } = useSidebar();

  const button = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      { className: cn(sidebarMenuButtonVariants({ variant, size }), className) },
      props,
    ),
    render,
    // `useRender` turns every `state` key into a `data-*` attribute, which is how the row knows its
    // own size and whether it is the active route. Note a `true` state serialises to an empty
    // attribute (`data-active=""`), hence the presence-based `data-active:` selectors above rather
    // than the reference's `data-[active=true]`.
    state: { slot: "sidebar-menu-button", sidebar: "menu-button", active: isActive, size },
  });

  if (!tooltip || state !== "collapsed" || isMobile) return button;

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent side="right">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("mx-4 w-auto bg-[#DDECE7]", className)}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
  sidebarMenuButtonVariants,
};
