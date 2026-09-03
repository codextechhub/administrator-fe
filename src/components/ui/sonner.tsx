import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import { isValidElement, useEffect, type ReactNode } from "react"
import { useTheme } from "next-themes"
import {
  Toaster as Sonner,
  toast,
  useSonner,
  type ToasterProps,
  type ToastT,
} from "sonner"

export const MIN_NOTIFICATION_DURATION_MS = 4_000
export const MAX_NOTIFICATION_DURATION_MS = 10_000
const NOTIFICATION_CHARACTERS_PER_SECOND = 15

function getContentLength(content: ReactNode | (() => ReactNode)): number {
  if (typeof content === "string") return content.trim().length
  if (typeof content === "number" || typeof content === "bigint") {
    return String(content).length
  }
  if (Array.isArray(content)) {
    return content.reduce((length, child) => length + getContentLength(child), 0)
  }
  if (isValidElement<{ children?: ReactNode }>(content)) {
    return getContentLength(content.props.children ?? null)
  }
  return 0
}

/**
 * How long a notification should stay up: long enough to read it, no longer.
 * Reading time at 15 characters per second, clamped to 4s..10s.
 *
 * One thing overrides that, and it is not severity. A toast that ASKS
 * something - one carrying an action or a cancel button - waits until it is
 * answered, because a question that withdraws itself while you are reading it
 * is worse than no question at all.
 *
 * Errors used to wait too, on the reasoning that they matter more. In practice
 * that left the screen collecting them: every refused save, every expired
 * session and every validation message stayed until somebody swept them away by
 * hand, and the pile is what people stopped reading. An error a user can only
 * acknowledge is still only an error to read, so it now goes when it has been
 * read. An error that offers a way out keeps its button on screen, because that
 * button is the question.
 */
export function getNotificationDuration(
  message: ReactNode | (() => ReactNode),
  options: {
    description?: ReactNode | (() => ReactNode)
    requiresAction?: boolean
  } = {},
) {
  if (options.requiresAction) return Infinity

  const contentLength =
    getContentLength(message) + getContentLength(options.description ?? null)
  const readingTime = Math.ceil(
    contentLength / NOTIFICATION_CHARACTERS_PER_SECOND,
  ) * 1_000

  return Math.min(
    MAX_NOTIFICATION_DURATION_MS,
    Math.max(MIN_NOTIFICATION_DURATION_MS, readingTime),
  )
}

export function getToastDuration(toastItem: Pick<
  ToastT,
  "title" | "description" | "type" | "action" | "cancel"
>) {
  return getNotificationDuration(toastItem.title ?? null, {
    description: toastItem.description,
    requiresAction: Boolean(toastItem.action || toastItem.cancel),
  })
}

function updateToastDuration(toastItem: ToastT, duration: number) {
  const options = { id: toastItem.id, duration }

  switch (toastItem.type) {
    case "success":
      toast.success(toastItem.title, options)
      break
    case "info":
      toast.info(toastItem.title, options)
      break
    case "warning":
      toast.warning(toastItem.title, options)
      break
    case "error":
      toast.error(toastItem.title, options)
      break
    default:
      toast.message(toastItem.title, options)
  }
}

/**
 * Every call site gets the reading-time duration without asking for it: watch
 * the live toast list and re-issue any toast whose duration is not the one its
 * own content earns. Loading toasts are left alone - they end when their
 * promise does.
 */
function AdaptiveToastDurations() {
  const { toasts } = useSonner()

  useEffect(() => {
    for (const toastItem of toasts) {
      if (toastItem.type === "loading") continue

      const duration = getToastDuration(toastItem)
      if (toastItem.duration !== duration) {
        updateToastDuration(toastItem, duration)
      }
    }
  }, [toasts])

  return null
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const { className, style, ...rest } = props

  return (
    <>
      <AdaptiveToastDurations />
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className={["toaster group", className].filter(Boolean).join(" ")}
        icons={{
          success: <CircleCheckIcon className="size-4" />,
          info: <InfoIcon className="size-4" />,
          warning: <TriangleAlertIcon className="size-4" />,
          error: <OctagonXIcon className="size-4" />,
          loading: <Loader2Icon className="size-4 animate-spin" />,
          close: <XIcon className="size-3.5" />,
        }}
        style={
          {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
            "--border-radius": "var(--radius)",
            ...style,
          } as React.CSSProperties
        }
        {...rest}
      />
    </>
  )
}

type SidebarState = "expanded" | "collapsed"

const sharedToasterProps = {
  position: "top-center",
  closeButton: true,
  expand: true,
  visibleToasts: 3,
  gap: 8,
  toastOptions: {
    closeButtonAriaLabel: "Dismiss notification",
  },
} satisfies ToasterProps

/**
 * Toasts are centred over the work area, not the viewport, so they do not
 * drift left under the sidebar. Half the sidebar's width (16rem expanded,
 * 3rem in icon mode - see ui/sidebar.tsx) pushes the centre back to where the
 * page content actually is.
 */
export function getWorkspaceToastCenter(sidebarState: SidebarState) {
  return sidebarState === "expanded"
    ? "calc(50% + 8rem)"
    : "calc(50% + 1.5rem)"
}

function WorkspaceToaster({ sidebarState }: { sidebarState: SidebarState }) {
  return (
    <Toaster
      {...sharedToasterProps}
      className="app-toaster workspace-toaster"
      offset={{ top: 68 }}
      mobileOffset={{ top: 68, right: 16, left: 16 }}
      style={
        {
          "--width": "380px",
          "--workspace-toast-center": getWorkspaceToastCenter(sidebarState),
          zIndex: 60,
        } as React.CSSProperties
      }
    />
  )
}

function AuthToaster() {
  return (
    <Toaster
      {...sharedToasterProps}
      className="app-toaster auth-toaster"
      offset={{ top: 16 }}
      mobileOffset={{ top: 16, right: 16, left: 16 }}
      style={{ "--width": "380px" } as React.CSSProperties}
    />
  )
}

export { AuthToaster, Toaster, WorkspaceToaster }
