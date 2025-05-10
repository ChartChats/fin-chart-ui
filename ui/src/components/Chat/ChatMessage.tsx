import { useState } from "react";
import { ChatMessage as ChatMessageType, Chart, useChat } from "@/contexts/ChatContext";
import { Avatar } from "@/components/widgets/avatar";
import { Button } from "@/components/widgets/button";
import { cn } from "@/lib/utils";
import { BarChart, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { addChart, deleteMessage } = useChat();
  const [hovering, setHovering] = useState(false);

  const handleAddChart = (chart: Chart) => {
    addChart(chart);
  };

  const handleDelete = () => {
    deleteMessage(message.id);
  };

  const formattedTime = format(new Date(message.timestamp), 'HH:mm');

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors",
        hovering && "bg-muted/50",
        message.sender === "user" ? "justify-start" : "justify-start"
      )}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <Avatar className="h-8 w-8">
        {message.sender === "user" ? (
          <div className="bg-primary text-primary-foreground rounded-full h-full w-full flex items-center justify-center">
            U
          </div>
        ) : (
          <div className="bg-secondary text-secondary-foreground rounded-full h-full w-full flex items-center justify-center">
            S
          </div>
        )}
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {message.sender === "user" ? "You" : "System"}
          </span>
          <span className="text-muted-foreground text-xs">{formattedTime}</span>
          {hovering && (
            <Button
              variant="text"
              size="small"
              className="h-6 w-6 ml-auto"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="mt-1 text-sm">{message.text}</div>
        {message.charts && message.charts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.charts.map((chart) => (
              <Button
                key={chart.id}
                type="default"
                size="small"
                className="text-xs flex gap-1.5 items-center h-7"
                onClick={() => handleAddChart(chart)}
              >
                <BarChart className="h-3.5 w-3.5" />
                {chart.title}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}