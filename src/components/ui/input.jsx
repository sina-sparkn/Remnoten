import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  dir = "auto",
  ...props
}) {
  return (
    <InputPrimitive
      type={type}
      dir={dir}
      data-slot="input"
      className={cn(
        "h-12 w-full rounded-[18px] border border-white/[0.08] bg-[#16161A] shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] px-4 py-2 text-[15px] font-medium text-white placeholder:text-[#545458] outline-none transition-all duration-200 focus-visible:border-[var(--primary,#FF2442)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/20 disabled:pointer-events-none disabled:opacity-50 text-start",
        className
      )}
      {...props}
    />
  )
}

export { Input }
