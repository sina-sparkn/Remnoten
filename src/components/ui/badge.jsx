import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex shrink-0 items-center justify-center font-bold transition-all outline-none select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary,#FF2442)] text-[var(--primary-foreground,#ffffff)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_2px_8px_var(--primary-subtle)]",
        secondary: "bg-white/[0.06] text-[#8E8E93] border border-white/[0.06]",
        outline: "border border-white/10 bg-white/[0.03] text-white",
        active:
          "bg-[var(--primary,#FF2442)] text-[var(--primary-foreground,#ffffff)] font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_2px_8px_var(--primary-subtle)]",
        pill: "h-9 px-4 rounded-full text-xs font-semibold cursor-pointer active:scale-95 duration-150",
      },
      size: {
        default: "h-6 px-2.5 text-xs rounded-full",
        sm: "h-5 px-2 text-[11px] rounded-full",
        lg: "h-9 px-4 text-xs rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size = "default",
  render,
  ...props
}) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps({
      className: cn(badgeVariants({ variant, size }), className),
    }, props),
    render,
    state: {
      slot: "badge",
      variant,
      size,
    },
  });
}

export { Badge, badgeVariants }
