import { BadgeItem } from "@/lib/badge-data";
import { Icon } from "@/components/ui/icon";

interface BadgeCardProps {
  badge: BadgeItem;
  onBadgeClick: (badge: BadgeItem) => void;
}

export function BadgeCard({ badge, onBadgeClick }: BadgeCardProps) {
  return (
    <div
      className="flex flex-col items-center gap-1 cursor-pointer transition-all hover:opacity-80"
      onClick={() => onBadgeClick(badge)}
    >
      {/* Badge Icon */}
      <div className="w-12 h-12 flex items-center justify-center">
        <Icon
          icon={badge.icon}
          size="lg"
          color={badge.completed ? "default" : "muted"}
          className={badge.completed ? "fill-current" : ""}
        />
      </div>

      {/* Badge Name */}
      <div className="text-center">
        <span
          className={`text-sm font-medium ${
            badge.completed ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {badge.name}
        </span>
      </div>
    </div>
  );
}
