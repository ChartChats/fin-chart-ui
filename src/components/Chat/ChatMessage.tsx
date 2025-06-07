import React, { useState } from "react";
import _ from "lodash";
import { Button, Tooltip } from "antd";
import { cn } from "@/lib/utils";
import { BarChart, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import rehypeExternalLinks from 'rehype-external-links';

interface ChatMessageProps {
  message: {
    content: string;
    role: string;
    timestamp: string;
    isAnalyzing?: boolean;
  };
}

export function ChatMessage({ message }: ChatMessageProps) {

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  const handleFeedback = (isPositive: boolean) => {
    // TODO: Implement feedback functionality
  };

  // Safely format the timestamp with a fallback
  const formattedTime = (() => {
    try {
      return message.timestamp ? format(new Date(message.timestamp), 'MMM d, yyyy HH:mm') : '';
    } catch (error) {
      console.error('Invalid timestamp:', message.timestamp);
      return '';
    }
  });

  return (
    <div
      className={cn(
        "group flex px-4 py-2 transition-colors",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex flex-col max-w-[80%] space-y-2 relative",
        message.role === "user" ? "items-end" : "items-start"
      )}>
        <div className="flex items-center gap-2">
          {
            message.role === "system" &&
            <span className="text-xs text-muted-foreground">{ formattedTime() }</span>
          }
          <div className="chat-message-actions">
            {
              message.role === "user"
                ? (
                    <>
                      <Tooltip title="Edit message">
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
                  )
                : (
                    <>
                      <Tooltip title="Helpful">
                        <Button 
                          type="text"
                          size="small"
                          className="message-action-btn thumbs-up h-6 w-6 p-0 flex items-center justify-center"
                          onClick={ () => handleFeedback(true) }
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </Button>
                      </Tooltip>
                      <Tooltip title="Not helpful">
                        <Button 
                          type="text"
                          size="small"
                          className="message-action-btn thumbs-down h-6 w-6 p-0 flex items-center justify-center"
                          onClick={ () => handleFeedback(false) }
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </Button>
                      </Tooltip>
                      <Tooltip title="Copy message">
                        <Button 
                          type="text"
                          size="small"
                          className="message-action-btn copy-btn h-6 w-6 p-0 flex items-center justify-center"
                          onClick={ handleCopy }
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </Tooltip>
                    </>
                  )
            }
          </div>
          {
            message.role === "user" &&
            <span className="text-xs text-muted-foreground">{ formattedTime() }</span>
          }
        </div>
        <div
          className={ cn(
            "rounded-lg px-4 py-2 prose prose-invert max-w-none",
            message.role === "user" ? "bg-primary text-primary-foreground ml-4" : "bg-muted text-foreground mr-4"
          ) }
        >
          {
            message.isAnalyzing
              ? (
                  <div className="flex">
                    <span className="mx-2">
                      Analyzing and processing your question
                    </span>
                    <span className="mx-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                        ......
                      </div>
                    </span>
                  </div>
                  
                )
              : (
                  <ReactMarkdown 
                    remarkPlugins={ [remarkGfm] }
                    rehypePlugins={ [[rehypeExternalLinks, { target: '_blank', rel: ['nofollow', 'noopener', 'noreferrer'] }]] }
                    components={{
                      a: ({ ...props }) => (
                        <a className="text-blue-500 hover:text-blue-600 underline" {...props} />
                      ),
                      img: ({ ...props }) => (
                        <img className="max-w-full h-auto rounded-lg my-2" {...props} />
                      ),
                      code: ({ children, className, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <code className="block bg-gray-100 dark:bg-gray-800 rounded p-2 my-2" { ...props }>
                            {children}
                          </code>
                        ) : (
                          <code className="bg-gray-100 dark:bg-gray-800 rounded px-1" { ...props }>
                            {children}
                          </code>
                        );
                      },
                      ul: ({ ...props }) => (
                        <ul className="list-disc list-inside my-2" { ...props } />
                      ),
                      ol: ({ ...props }) => (
                        <ol className="list-decimal list-inside my-2" { ...props } />
                      ),
                    }}
                  >
                    { message.content }
                  </ReactMarkdown>
                )
          }
        </div>
      </div>
    </div>
  );
}