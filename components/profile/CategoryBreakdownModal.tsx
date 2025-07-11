"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CategoryBreakdown, 
  getCategoryColor, 
  getCategorySvgColor,
  getCategoryBgColor,
  getCategoryIcon,
  type Category 
} from "@/lib/categories";

interface CategoryBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  breakdown: CategoryBreakdown[];
  issuerBreakdown: Array<{
    issuer: string;
    category: Category | null;
    points: number;
    percentage: number;
    credentials: Array<{
      issuer: string;
      label: string;
      points: number;
    }>;
  }>;
  totalPoints: number;
  primaryCategory: Category | null;
}

export function CategoryBreakdownModal({
  open,
  onOpenChange,
  breakdown,
  issuerBreakdown,
  totalPoints,
  primaryCategory,
}: CategoryBreakdownModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Creator Categories</span>
            {primaryCategory && (
              <Badge 
                className={`${getCategoryColor(primaryCategory)} text-white`}
              >
                {getCategoryIcon(primaryCategory)} {primaryCategory}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Platform List */}
          <div className="space-y-4">
            {issuerBreakdown.map((item) => (
              <div key={item.issuer} className={`rounded-lg border p-4 ${item.category ? getCategoryBgColor(item.category) : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${item.category ? getCategoryColor(item.category) : 'bg-gray-500'} flex items-center justify-center text-white text-lg`}>
                      {item.category ? getCategoryIcon(item.category) : "📊"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">{item.issuer}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.category ? item.category : 'Uncategorized'} • {item.credentials.length} credential{item.credentials.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{item.points.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">points</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Contribution</span>
                    <span className="font-medium">{item.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={item.percentage} 
                    className="h-2"
                    style={{
                      '--progress-color': item.category ? getCategorySvgColor(item.category) : '#9ca3af'
                    } as React.CSSProperties}
                  />
                </div>
                
                {/* Credentials breakdown */}
                <div className="mt-3 space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Credentials</h4>
                  <div className="space-y-1">
                    {item.credentials.length > 0 ? (
                      item.credentials.map((credential, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="truncate text-muted-foreground">{credential.label}</span>
                          <span className="font-medium">{credential.points.toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground italic">
                        Coming soon...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 