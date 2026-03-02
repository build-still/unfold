"use client"

import * as React from "react"

import { PanelLeftIcon } from "lucide-react"
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react"

import { AnimatedIcon } from "@/components/ui/animated-icon"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SIDEBAR_GAP_TWEEN, SIDEBAR_SHELL_TWEEN } from "@/components/sidebar/sidebar-motion"
import { cn } from "@/lib/utils"

import { useSidebar } from "./sidebar-provider"

const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_OFFCANVAS_BLUR = "1px"

type SidebarProps = Omit<HTMLMotionProps<"div">, "children"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
  children?: React.ReactNode
}

export function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: SidebarProps) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()
  const prefersReducedMotion = useReducedMotion()
  const isCollapsed = state === "collapsed"
  const isOffcanvas = collapsible === "offcanvas"

  const gapTransition = prefersReducedMotion ? { duration: 0 } : SIDEBAR_GAP_TWEEN
  const sidebarTransition = prefersReducedMotion ? { duration: 0 } : SIDEBAR_SHELL_TWEEN
  const collapsedX =
    prefersReducedMotion || !isOffcanvas
      ? "0%"
      : side === "left"
        ? "calc(-100% - 48px)"
        : "calc(100% + 48px)"

  const sidebarMotion = isOffcanvas
    ? {
        initial: false,
        animate: {
          x: isCollapsed ? collapsedX : "0%",
          opacity: isCollapsed ? 0 : 1,
          filter: prefersReducedMotion
            ? "none"
            : isCollapsed
              ? `blur(${SIDEBAR_OFFCANVAS_BLUR})`
              : "blur(0px)",
        },
        transition: sidebarTransition,
      }
    : { initial: false }

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn("bg-sidebar text-sidebar-foreground flex h-full sidebar-width flex-col", className)}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-sidebar text-sidebar-foreground border-sidebar-container-border/80 sidebar-width p-0 [&>button]:hidden"
          style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      <motion.div
        data-slot="sidebar-gap"
        className={cn("relative sidebar-gap bg-background", "group-data-[side=right]:rotate-180")}
        layout
        transition={gapTransition}
      />
      <motion.div
        data-slot="sidebar-container"
          className={cn(
          "fixed inset-y-0 z-10 hidden h-svh sidebar-container transition-[width] duration-280 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:flex",
          side === "left" ? "left-0" : "right-0",
          variant === "floating" || variant === "inset"
            ? "p-2"
            : "group-data-[side=left]:border-r group-data-[side=right]:border-l border-sidebar-container-border/60",
          className,
        )}
        {...sidebarMotion}
        style={{
          transformOrigin: side === "left" ? "left center" : "right center",
          marginLeft: side === "left" ? "5px" : undefined,
        }}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-sidebar flex h-full w-full flex-col group-data-[variant=floating]:rounded-[1.75rem] group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-container-border/70"
        >
          {children}
        </div>
      </motion.div>
    </div>
  )
}

export function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <AnimatedIcon className="w-full h-full flex items-center justify-center">
        <PanelLeftIcon />
      </AnimatedIcon>
      <span className="sr-only">toggle sidebar</span>
    </Button>
  )
}

export function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="toggle sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="toggle sidebar"
      className={cn(
        "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      {...props}
    />
  )
}

export function SidebarInset({
  className,
  onDrag: _onDrag,
  onDragStart: _onDragStart,
  onDragEnd: _onDragEnd,
  onDragOver: _onDragOver,
  onDragEnter: _onDragEnter,
  onDragLeave: _onDragLeave,
  onAnimationStart: _onAnimationStart,
  onAnimationEnd: _onAnimationEnd,
  onAnimationIteration: _onAnimationIteration,
  ...props
}: React.ComponentProps<"main">) {
  const prefersReducedMotion = useReducedMotion()
  const insetTransition = prefersReducedMotion ? { duration: 0 } : SIDEBAR_GAP_TWEEN

  return (
    <motion.main
      data-slot="sidebar-inset"
      className={cn(
        "bg-background relative flex w-full flex-1 flex-col",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className,
      )}
      layout
      transition={insetTransition}
      {...props}
    />
  )
}
