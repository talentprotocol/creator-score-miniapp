"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
}

export function StatCard({ title, value }: StatCardProps) {
  return (
    <Card className="flex flex-col bg-muted rounded-xl p-4 min-w-0 flex-1 border-0 shadow-none">
      <span className="text-xs text-muted-foreground font-medium">{title}</span>
      <span className="text-2xl font-bold leading-tight mt-1">{value}</span>
    </Card>
  );
}
