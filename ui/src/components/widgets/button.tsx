import * as React from "react"
import { Button as AntButton } from "antd"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ComponentProps<typeof AntButton> {
  customVariant?: 'primary' | 'default' | 'text' | 'link' | 'dashed'
  customSize?: 'small' | 'middle' | 'large'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, customVariant = 'primary', customSize = 'middle', type, size, ...props }, ref) => {
    return (
      <AntButton
        ref={ref}
        type={type || customVariant}
        size={size || customSize}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
          customVariant === 'primary' && "bg-primary text-primary-foreground hover:bg-primary/90",
          customVariant === 'default' && "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
          customVariant === 'text' && "hover:bg-accent hover:text-accent-foreground",
          customVariant === 'link' && "text-primary underline-offset-4 hover:underline",
          customVariant === 'dashed' && "border-dashed border-input bg-background hover:bg-accent hover:text-accent-foreground",
          customSize === 'middle' && "h-10 px-4 py-2",
          customSize === 'small' && "h-9 rounded-md px-3",
          customSize === 'large' && "h-11 rounded-md px-8",
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }