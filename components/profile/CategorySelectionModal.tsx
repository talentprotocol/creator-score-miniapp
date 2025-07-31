"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  CREATOR_CATEGORIES,
  type CreatorCategoryType,
} from "@/lib/credentialUtils";

interface CategorySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: CreatorCategoryType) => void;
  currentCategory?: CreatorCategoryType;
}

export function CategorySelectionModal({
  isOpen,
  onClose,
  onSelectCategory,
  currentCategory,
}: CategorySelectionModalProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [selectedCategory, setSelectedCategory] = useState<
    CreatorCategoryType | undefined
  >(currentCategory);

  // Update selected category when modal opens or current category changes
  useEffect(() => {
    if (isOpen && currentCategory) {
      setSelectedCategory(currentCategory);
    }
  }, [isOpen, currentCategory]);

  const handleConfirm = () => {
    if (selectedCategory) {
      onSelectCategory(selectedCategory);
    }
  };

  const handleCancel = () => {
    setSelectedCategory(currentCategory);
    onClose();
  };

  const content = (
    <div className="space-y-4">
      <RadioGroup
        value={selectedCategory}
        onValueChange={(value) =>
          setSelectedCategory(value as CreatorCategoryType)
        }
      >
        <div className="space-y-0">
          {Object.entries(CREATOR_CATEGORIES).map(([category, emoji]) => (
            <label
              key={category}
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{emoji}</span>
                <span className="font-medium">{category}</span>
              </div>
              <RadioGroupItem value={category} />
            </label>
          ))}
        </div>
      </RadioGroup>

      <div className="flex gap-4 mt-6">
        <Button styling="default" onClick={handleCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          className="flex-1"
          styling="brand"
          disabled={!selectedCategory}
        >
          Save
        </Button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>Select Creator Category</DialogTitle>
          <DialogDescription>
            Choose your primary creator focus
          </DialogDescription>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Select Creator Category</DrawerTitle>
            <DrawerDescription>
              Choose your primary creator focus
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-8">{content}</div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
