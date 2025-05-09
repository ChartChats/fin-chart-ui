import { CloseOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChartTabProps {
  id: string;
  title: string;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

export function ChartTab({ id, title, isActive, onSelect, onClose }: ChartTabProps) {
  const isMobile = useIsMobile();
  
  return (
    <div
      className={cn(
        "flex items-center justify-between px-2 sm:px-3 py-1 text-sm border-r border-border min-w-[80px] sm:min-w-[100px] max-w-[120px] sm:max-w-[150px] rounded-md",
        isActive
          ? "bg-background text-foreground border-b-2 border-b-primary"
          : "bg-muted/30 text-muted-foreground hover:bg-muted/50 cursor-pointer"
      )}
      onClick={onSelect}
    >
      <span className="flex-1 truncate">{title}</span>
      <Button
        type="text"
        size="small"
        className="h-4 w-4 p-0 opacity-60 hover:opacity-100 ml-1"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        icon={<CloseOutlined style={{ fontSize: '12px' }} />}
      />
    </div>
  );
}