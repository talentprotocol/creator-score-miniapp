import { BadgeItem } from "@/lib/badge-data";

interface BadgeCardProps {
  badge: BadgeItem;
  onBadgeClick: (badge: BadgeItem) => void;
}

export function BadgeCard({ badge, onBadgeClick }: BadgeCardProps) {
  const IconComponent = badge.icon;

  return (
    <div
      className="flex flex-col items-center gap-1 cursor-pointer transition-all hover:opacity-80"
      onClick={() => onBadgeClick(badge)}
    >
      {/* Badge Icon */}
      <div className="w-12 h-12 flex items-center justify-center">
        <IconComponent
          className={`w-8 h-8 ${
            badge.completed ? "text-black" : "text-gray-300"
          }`}
        />
      </div>

      {/* Badge Name */}
      <div className="text-center">
        <span
          className={`text-sm font-medium ${
            badge.completed ? "text-gray-900" : "text-gray-300"
          }`}
        >
          {badge.name}
        </span>
      </div>
    </div>
  );
}
