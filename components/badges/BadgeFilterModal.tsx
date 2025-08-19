"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { X } from "lucide-react";

export interface BadgeFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: Array<{ id: string; title: string }>;
  selectedSections: string[];
  onSectionToggle: (sectionId: string) => void;
}

function Content({
  sections,
  selectedSections,
  onSectionToggle,
  onClose,
}: Omit<BadgeFilterModalProps, "open" | "onOpenChange"> & {
  onClose: () => void;
}) {
  const allSelected = selectedSections.length === sections.length;
  const someSelected =
    selectedSections.length > 0 && selectedSections.length < sections.length;

  const handleAllToggle = () => {
    if (allSelected) {
      // If all are selected, deselect all
      onSectionToggle("all");
    } else {
      // If some or none are selected, select all
      sections.forEach((section) => {
        if (!selectedSections.includes(section.id)) {
          onSectionToggle(section.id);
        }
      });
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
          aria-label="Close filter modal"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter Options */}
      <div className="space-y-4">
        {/* All sections checkbox */}
        <div className="flex items-center space-x-3">
          <Checkbox
            id="all-sections"
            checked={allSelected}
            ref={(ref) => {
              if (ref && ref instanceof HTMLInputElement) {
                ref.indeterminate = someSelected;
              }
            }}
            onCheckedChange={handleAllToggle}
            aria-describedby="all-sections-description"
          />
          <label
            id="all-sections-description"
            htmlFor="all-sections"
            className="flex-1 cursor-pointer text-left"
          >
            <Typography size="base" weight="medium">
              All Sections
            </Typography>
          </label>
        </div>

        {/* Individual section checkboxes */}
        {sections.map((section) => (
          <div key={section.id} className="flex items-center space-x-3">
            <Checkbox
              id={section.id}
              checked={selectedSections.includes(section.id)}
              onCheckedChange={() => onSectionToggle(section.id)}
              aria-describedby={`${section.id}-description`}
            />
            <label
              id={`${section.id}-description`}
              htmlFor={section.id}
              className="flex-1 cursor-pointer text-left"
            >
              <Typography size="base" weight="medium">
                {section.title}
              </Typography>
            </label>
          </div>
        ))}
      </div>
    </>
  );
}

export function BadgeFilterModal({
  open,
  onOpenChange,
  sections,
  selectedSections,
  onSectionToggle,
}: BadgeFilterModalProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="px-4 pb-4">
            <DrawerTitle>Filter Badges</DrawerTitle>
            <Typography size="sm" color="muted" className="mt-1">
              Select sections to filter the badges.
            </Typography>
            <Content
              sections={sections}
              selectedSections={selectedSections}
              onSectionToggle={onSectionToggle}
              onClose={() => onOpenChange(false)}
            />
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Badges</DialogTitle>
          <DialogDescription>
            Select sections to filter the badges.
          </DialogDescription>
          <Content
            sections={sections}
            selectedSections={selectedSections}
            onSectionToggle={onSectionToggle}
            onClose={() => onOpenChange(false)}
          />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
