
import { Button } from "antd";
import { LAYOUT_PRESETS, useLayout } from "@/contexts/LayoutContext";
import { cn } from "@/lib/utils";

export function LayoutControls() {
  const { activePreset, applyPreset } = useLayout();

  // Layout presets with visual representations using simple SVGs
  const presetButtons = [
    { 
      preset: LAYOUT_PRESETS.CHARTS_FOCUS, 
      label: 'Charts Focus',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="12" height="12" rx="1" className="stroke-current" strokeWidth="1.5" />
          <rect x="14" y="1" width="5" height="12" rx="1" className="stroke-current" strokeWidth="1.5" />
          <rect x="1" y="14" width="18" height="5" rx="1" className="stroke-current" strokeWidth="1.5" />
        </svg>
      )
    },
    { 
      preset: LAYOUT_PRESETS.CHAT_FOCUS, 
      label: 'Chat Focus',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="5" height="12" rx="1" className="stroke-current" strokeWidth="1.5" />
          <rect x="7" y="1" width="12" height="12" rx="1" className="stroke-current" strokeWidth="1.5" />
          <rect x="1" y="14" width="18" height="5" rx="1" className="stroke-current" strokeWidth="1.5" />
        </svg>
      )
    },
    { 
      preset: LAYOUT_PRESETS.BALANCED, 
      label: 'Balanced',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="8" height="12" rx="1" className="stroke-current" strokeWidth="1.5" />
          <rect x="10" y="1" width="9" height="12" rx="1" className="stroke-current" strokeWidth="1.5" />
          <rect x="1" y="14" width="18" height="5" rx="1" className="stroke-current" strokeWidth="1.5" />
        </svg>
      )
    },
  ];

  return (
    <div className="flex items-center space-x-2">
      <div className="flex space-x-2">
        {presetButtons.map(({ preset, label, icon }) => (
          <Button
            key={preset}
            type={activePreset === preset ? "primary" : "default"}
            className={cn(
              "h-9 w-9 flex items-center justify-center rounded-md transition-all",
              activePreset === preset ? "shadow-sm" : "hover:bg-muted/60",
              activePreset === preset ? "border-primary" : "border-border"
            )}
            onClick={() => applyPreset(preset)}
            title={label}
          >
            <div className={activePreset === preset ? "text-primary-foreground" : "text-muted-foreground"}>
              {icon}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}