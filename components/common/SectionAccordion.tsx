"use client";

import * as React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface AccordionSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  value?: string | number;
  content: React.ReactNode;
}

interface SectionAccordionProps {
  type?: "single" | "multiple"; // Defaults to "multiple"
  variant?: "gray" | "white";
  sections: AccordionSection[];
  className?: string;
  defaultExpanded?: string[]; // New prop for auto-expanding sections
  onExpandedChange?: (openIds: string[]) => void;
}

export function SectionAccordion({
  type = "multiple",
  variant = "gray",
  sections,
  className,
  defaultExpanded = [],
  onExpandedChange,
}: SectionAccordionProps) {
  const variantStyles = {
    gray: "bg-muted rounded-xl border-0 shadow-none",
    white: "bg-card rounded-xl border shadow-none",
  };

  // Uncontrolled accordion; report open changes upward
  const accordionProps =
    type === "multiple"
      ? {
          type,
          defaultValue: defaultExpanded,
          onValueChange: (v: string[]) => onExpandedChange?.(v),
        }
      : {
          type,
          defaultValue: defaultExpanded[0] || undefined,
          onValueChange: (v: string) => onExpandedChange?.(v ? [v] : []),
        };

  return (
    <Accordion
      {...accordionProps}
      className={cn("w-full space-y-2", className)}
    >
      {sections.map((section) => (
        <AccordionItem
          key={section.id}
          value={section.id}
          className={variantStyles[variant]}
        >
          <AccordionTrigger className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {section.icon && (
                <div className="h-4 w-4 text-muted-foreground">
                  {section.icon}
                </div>
              )}
              <span className="font-medium">{section.title}</span>
            </div>
            {section.value && (
              <span className="ml-4 text-xl font-semibold text-foreground w-16 text-right">
                {section.value}
              </span>
            )}
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            {section.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
