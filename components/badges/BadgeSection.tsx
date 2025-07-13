import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { BadgeSection, BadgeItem } from "@/lib/badge-data";
import { BadgeCard } from "./BadgeCard";

interface BadgeSectionProps {
  section: BadgeSection;
  onBadgeClick: (badge: BadgeItem) => void;
}

export function BadgeSectionComponent({
  section,
  onBadgeClick,
}: BadgeSectionProps) {
  const completedCount = section.badges.filter(
    (badge) => badge.completed,
  ).length;
  const totalCount = section.badges.length;

  return (
    <AccordionItem
      value={section.id}
      className="bg-muted rounded-xl border-0 shadow-none"
    >
      <AccordionTrigger className="px-6 py-4 hover:no-underline">
        <div className="flex items-center gap-3">
          <span className="font-medium">{section.title}</span>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{totalCount}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
          {section.badges.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              onBadgeClick={onBadgeClick}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
