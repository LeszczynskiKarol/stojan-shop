// components/ExpandableDescription.tsx
"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableDescriptionProps {
  content: string;
  className?: string;
  onExpandChange?: (isExpanded: boolean) => void; // DODAJ TĘ LINIĘ
}

export const ExpandableDescription = ({
  content,
  className = "",
  onExpandChange, // DODAJ TEN PARAMETR
}: ExpandableDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onExpandChange?.(newState); // WYWOŁAJ CALLBACK
  };

  return (
    <div className={`max-w-2xl mx-auto px-4 md:px-0 ${className}`}>
      <div
        className={`prose prose-gray dark:prose-invert max-w-none ${
          isExpanded ? "" : "max-h-[200px] overflow-hidden relative"
        }`}
      >
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
        )}
        <div
          className="space-y-4"
          dangerouslySetInnerHTML={{
            __html: content
              .replace(/\n\n/g, "</p><p>")
              .replace(/\n/g, "<br/>")
              .replace(/^(.+)$/m, "<p>$1</p>")
              .replace(/• (.+)/g, "<li>$1</li>")
              .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>"),
          }}
        />
      </div>

      <button
        onClick={handleToggle} // ZMIEŃ NA handleToggle
        className="flex items-center gap-2 mx-auto mt-4 text-primary hover:text-primary/80 transition-colors"
      >
        {isExpanded ? (
          <>
            Pokaż mniej
            <ChevronUp className="w-4 h-4" />
          </>
        ) : (
          <>
            Pokaż więcej
            <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
};
