"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  onClick?: () => void;
}

export function StatCard({ title, value, onClick }: StatCardProps) {
  return (
    <Card
      className={`flex flex-col bg-muted rounded-xl p-4 min-w-0 flex-1 border-0 shadow-none ${
        onClick ? "cursor-pointer hover:bg-muted/80 transition-colors" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs text-muted-foreground font-medium">
          {title}
        </span>
        {onClick && (
          <ChevronDown className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
        )}
      </div>
      <span className="text-2xl font-bold leading-tight mt-1">{value}</span>
    </Card>
  );
}
