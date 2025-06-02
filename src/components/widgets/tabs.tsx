import * as React from "react"
import { Tabs as AntTabs } from "antd"
import { cn } from "@/lib/utils"

export interface TabsProps extends React.ComponentProps<typeof AntTabs> {
  className?: string
}

export const Tabs = ({ className, ...props }: TabsProps) => {
  return (
    <AntTabs
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
Tabs.displayName = "Tabs"

export const TabsList = AntTabs.TabPane
TabsList.displayName = "TabsList"

export const TabsTrigger = AntTabs.TabPane
TabsTrigger.displayName = "TabsTrigger"

export const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = "TabsContent"