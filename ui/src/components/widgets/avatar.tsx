import * as React from "react"
import { Avatar as AntAvatar } from "antd"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.ComponentProps<typeof AntAvatar> {
  className?: string
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, ...props }, ref) => {
    return (
      <AntAvatar
        ref={ref}
        className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
        {...props}
      />
    )
  }
)
Avatar.displayName = "Avatar"

export const AvatarImage = AntAvatar
AvatarImage.displayName = "AvatarImage"

export const AvatarFallback = AntAvatar
AvatarFallback.displayName = "AvatarFallback"