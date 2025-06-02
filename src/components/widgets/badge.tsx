import * as React from "react"
import { Badge as AntBadge } from "antd"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.ComponentProps<typeof AntBadge> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const getStatus = () => {
    switch (variant) {
      case 'destructive':
        return 'error'
      case 'secondary':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <AntBadge
      status={getStatus()}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variant === 'default' && "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        variant === 'secondary' && "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        variant === 'destructive' && "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        variant === 'outline' && "text-foreground",
        className
      )}
      {...props}
    />
  )
}