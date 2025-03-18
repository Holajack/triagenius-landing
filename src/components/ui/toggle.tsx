
import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        permission: 
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground relative overflow-hidden",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ToggleProps extends 
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
  VariantProps<typeof toggleVariants> {
    permission?: "granted" | "denied" | "prompt" | null;
    permissionType?: "notification" | "dnd" | "display" | "audio";
  }

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToggleProps
>(({ className, variant, size, permission, permissionType, ...props }, ref) => {
  // Used to debounce rapid toggle actions
  const handleChange = (checked: boolean) => {
    if (props.onCheckedChange) {
      // Use requestAnimationFrame to prevent UI thread blocking
      requestAnimationFrame(() => {
        props.onCheckedChange?.(checked);
      });
    }
  };

  return (
    <TogglePrimitive.Root
      ref={ref}
      className={cn(
        toggleVariants({ variant, size }),
        permission === "denied" && variant === "permission" && "border-red-300 bg-red-50 dark:bg-red-950/20",
        permission === "granted" && variant === "permission" && "border-green-300 bg-green-50 dark:bg-green-950/20",
        className
      )}
      {...props}
      onCheckedChange={handleChange}
      data-permission-type={permissionType}
      data-permission-status={permission}
    >
      {props.children}
      {permission === "denied" && variant === "permission" && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] px-1 rounded-bl-md">
          Blocked
        </span>
      )}
    </TogglePrimitive.Root>
  );
})
Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
