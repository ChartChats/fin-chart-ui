import { useState } from "react";
import { Button, Tooltip } from "antd";
import { cn } from "@/lib/utils";
import { BarChart, Edit, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { format } from "date-fns";

interface ChatMessageProps {
  message: {
    text: string;
    timestamp: string;
    sender: string;
    charts?: any[];
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  // const { addChart } = useChat();

  // const handleAddChart = (chart: Chart) => {
  //   addChart(chart);
  // };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
  };

  const handleFeedback = (isPositive: boolean) => {
    // TODO: Implement feedback functionality
  };

  const formattedTime = format(new Date(message.timestamp), 'HH:mm');

  return (
    <div
      className={cn(
        "group flex px-4 py-2 transition-colors",
        message.sender === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex flex-col max-w-[80%] space-y-2 relative",
        message.sender === "user" ? "items-end" : "items-start"
      )}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
          <div className="chat-message-actions">
            {message.sender === "user" ? (
              <>
                <Tooltip title="Edit message">
                  <Button 
                    type="text"
                    size="small"
                    className="message-action-btn edit-btn h-6 w-6 p-0 flex items-center justify-center"
                    onClick={handleEdit}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </Tooltip>
                <Tooltip title="Copy message">
                  <Button 
                    type="text"
                    size="small"
                    className="message-action-btn copy-btn h-6 w-6 p-0 flex items-center justify-center"
                    onClick={handleCopy}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip title="Helpful">
                  <Button 
                    type="text"
                    size="small"
                    className="message-action-btn thumbs-up h-6 w-6 p-0 flex items-center justify-center"
                    onClick={() => handleFeedback(true)}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </Button>
                </Tooltip>
                <Tooltip title="Not helpful">
                  <Button 
                    type="text"
                    size="small"
                    className="message-action-btn thumbs-down h-6 w-6 p-0 flex items-center justify-center"
                    onClick={() => handleFeedback(false)}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </Button>
                </Tooltip>
                <Tooltip title="Copy message">
                  <Button 
                    type="text"
                    size="small"
                    className="message-action-btn copy-btn h-6 w-6 p-0 flex items-center justify-center"
                    onClick={handleCopy}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </Tooltip>
              </>
            )}
          </div>
        </div>
        
        <div className={cn(
          "rounded-lg px-4 py-2",
          message.sender === "user" 
            ? "bg-primary text-primary-foreground ml-4" 
            : "bg-muted text-foreground mr-4"
        )}>
          {message.text}
        </div>

        {message.charts && message.charts.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.charts.map((chart) => (
              <Button
                key={chart.id}
                type="default"
                size="small"
                className="text-xs flex gap-1.5 items-center h-7"
                // onClick={() => handleAddChart(chart)}
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