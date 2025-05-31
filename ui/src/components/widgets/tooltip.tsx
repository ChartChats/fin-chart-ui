import * as React from "react"
import { Tooltip as AntTooltip } from "antd"
import { cn } from "@/lib/utils"

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export const Tooltip = ({ children, content, placement = 'top', className }: TooltipProps) => {
  return (
    <AntTooltip
      title={content}
      placement={placement}
      className={cn(className)}
    >
      {children}
    </AntTooltip>
  )
}