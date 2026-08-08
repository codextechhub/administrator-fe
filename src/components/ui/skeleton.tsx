import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // not shadcn's bg-accent: at oklch(0.97) it vanishes on the app's
      // #F7F7F7 page background, so loading screens read as blank.
      // motion-reduce:animate-none - the pulse is decoration; users who ask for
      // reduced motion get a static block. Fixed here so no caller has to.
      className={cn(
        "bg-gray-200 animate-pulse motion-reduce:animate-none rounded-md",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
