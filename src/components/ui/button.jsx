import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent whitespace-nowrap transition-all duration-200 outline-none select-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary,#FF2442)] text-[var(--primary-foreground,#ffffff)] hover:bg-[var(--primary-hover,#E01B37)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.24),0_4px_16px_var(--primary-subtle)] font-bold rounded-[18px] active:scale-[0.97] active:brightness-95",
        red:
          "bg-[var(--primary,#FF2442)] text-[var(--primary-foreground,#ffffff)] hover:bg-[var(--primary-hover,#E01B37)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.24),0_4px_16px_var(--primary-subtle)] font-bold rounded-[18px] active:scale-[0.97] active:brightness-95",
        outline:
          "border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] font-semibold rounded-[18px] active:scale-[0.97]",
        secondary:
          "bg-[#18181C] border border-white/[0.06] text-white hover:bg-[#202026] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] font-semibold rounded-[18px] active:scale-[0.97]",
        ghost:
          "hover:bg-white/[0.08] text-white hover:text-white rounded-xl active:scale-90 duration-150",
        destructive:
          "bg-[var(--primary-subtle,rgba(255,36,66,0.1))] text-[var(--primary,#FF2442)] border border-[var(--primary-subtle-border,rgba(255,36,66,0.25))] hover:opacity-90 rounded-[18px] active:scale-[0.97]",
        link: "text-[var(--primary,#FF2442)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-4 text-sm rounded-xl",
        sm: "h-8 gap-1.5 px-3 text-xs rounded-lg",
        lg: "h-11 gap-2 px-5 text-sm rounded-xl",
        xl: "h-[52px] gap-2 px-5 text-[15px] font-bold w-full rounded-[18px]",
        icon: "size-10 rounded-xl p-0",
        "icon-sm": "size-8 rounded-lg p-0",
        "icon-header": "size-[38px] rounded-[11px] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
