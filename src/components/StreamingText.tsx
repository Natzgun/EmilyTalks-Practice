"use client";

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
}

export function StreamingText({ text, isStreaming }: StreamingTextProps) {
  return (
    <span>
      {text}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-0.5 bg-current animate-pulse rounded-sm" />
      )}
    </span>
  );
}
