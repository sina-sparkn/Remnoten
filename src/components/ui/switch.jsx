import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/lib/utils"
import { useTheme } from "@/lib/theme.jsx"

function Switch({
  className,
  size = "lg",
  dir = "ltr",
  style,
  ...props
}) {
  const { currentTheme } = useTheme();
  const isLightContrastTheme = currentTheme?.id === 'white_and_black' || currentTheme?.isLightContrast;

  return (
    <SwitchPrimitive.Root
      dir={dir}
      data-slot="switch"
      data-size={size}
      style={{ direction: "ltr", ...style }}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none [direction:ltr] after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-2 focus-visible:ring-ring data-[size=default]:h-[20px] data-[size=default]:w-[36px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] data-[size=lg]:h-[30px] data-[size=lg]:w-[50px] data-checked:bg-[var(--primary,#FF2442)] data-unchecked:bg-[#36363B] cursor-pointer",
        className
      )}
      onPointerDown={(e) => {
        e.stopPropagation();
        props.onPointerDown?.(e);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        props.onTouchStart?.(e);
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
        props.onTouchEnd?.(e);
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        props.onMouseUp?.(e);
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        render={(thumbProps, state) => {
          const isDarkThumb = state.checked && isLightContrastTheme;
          return (
            <span
              {...thumbProps}
              style={{
                ...thumbProps.style,
                backgroundColor: isDarkThumb ? '#121214' : '#FFFFFF',
              }}
              className={cn(
                "pointer-events-none block rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.35),0_1px_1px_rgba(0,0,0,0.15)] transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                isDarkThumb ? "bg-[#121214]" : "bg-white",
                "group-data-[size=default]/switch:size-4 group-data-[size=default]/switch:data-checked:translate-x-[18px]",
                "group-data-[size=sm]/switch:size-3 group-data-[size=sm]/switch:data-checked:translate-x-[10px]",
                "group-data-[size=lg]/switch:size-6 group-data-[size=lg]/switch:data-checked:translate-x-[23px]",
                "group-data-[size=default]/switch:data-unchecked:translate-x-[2px]",
                "group-data-[size=sm]/switch:data-unchecked:translate-x-[2px]",
                "group-data-[size=lg]/switch:data-unchecked:translate-x-[3px]",
                thumbProps.className
              )}
            />
          );
        }}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
