"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { YearlyPostData } from "@/hooks/useProfilePostsAll";

interface PostsChartProps {
  yearlyData: YearlyPostData[];
  loading: boolean;
  error: string | null;
}

export function PostsChart({ yearlyData, loading, error }: PostsChartProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Find the selected year data or fallback to first available year
  const selectedYearData =
    yearlyData.find((d) => d.year === selectedYear) || yearlyData[0];

  // Set initial selected year to current year if available, otherwise latest year
  useEffect(() => {
    if (yearlyData.length > 0) {
      const hasCurrentYear = yearlyData.find((d) => d.year === currentYear);
      const latestYear = Math.max(...yearlyData.map((d) => d.year));
      setSelectedYear(hasCurrentYear ? currentYear : latestYear);
    }
  }, [yearlyData, currentYear]);

  // Solid colors for different years using brand colors
  const getSolidColor = (year: number) => {
    const colors = {
      0: "bg-brand-purple", // Primary brand color
      1: "bg-brand-green", // Secondary brand color
      2: "bg-brand-blue", // Secondary brand color
      3: "bg-brand-pink", // Secondary brand color
    };
    const index = yearlyData.findIndex((d) => d.year === year);
    const colorIndex = index % 4; // Now 4 colors instead of 5
    return colors[colorIndex as keyof typeof colors] || "bg-brand-purple";
  };

  if (loading) {
    return (
      <Card className="w-full min-w-0 p-3 sm:p-6 bg-white rounded-xl border border-gray-200 shadow-none">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-16 rounded-md" />
            ))}
          </div>
          <div className="flex flex-col space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-24 sm:h-32 w-full rounded-lg" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full min-w-0 p-3 sm:p-6 bg-white rounded-xl border border-gray-200 shadow-none">
        <div className="text-center py-8">
          <div className="text-sm text-destructive">{error}</div>
        </div>
      </Card>
    );
  }

  if (yearlyData.length === 0) {
    return (
      <Card className="w-full min-w-0 p-3 sm:p-6 bg-white rounded-xl border border-gray-200 shadow-none">
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No post activity data available.</p>
          <p className="text-xs mt-2">
            Activity from Mirror, Paragraph, and Zora will appear here once your
            score is calculated.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full min-w-0 p-3 sm:p-6 bg-white rounded-xl border border-gray-200 shadow-none">
      {/* Year Pills & Total Posts - Same Line */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          {yearlyData.map((yearData) => (
            <Button
              key={yearData.year}
              onClick={() => setSelectedYear(yearData.year)}
              className="flex-1"
              variant={
                selectedYear === yearData.year ? "brand-purple" : "default"
              }
            >
              {yearData.year}
            </Button>
          ))}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-muted-foreground font-medium">
            Total Posts
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {selectedYearData?.total || 0}
          </div>
        </div>
      </div>

      {/* Chart Container - Scrollable */}
      <div className="w-full min-w-0 overflow-x-auto">
        <div className="w-full" style={{ minWidth: "400px" }}>
          {/* Stream Visualization */}
          <div className="relative h-24 sm:h-32 bg-gray-50 rounded-lg overflow-hidden mb-3 sm:mb-4">
            <div className="flex h-full">
              {(selectedYearData?.months || Array(12).fill(0)).map(
                (count, monthIndex) => {
                  // Check if this month is in the future
                  const currentDate = new Date();
                  const currentYear = currentDate.getFullYear();
                  const currentMonth = currentDate.getMonth();
                  const isFutureMonth =
                    selectedYear > currentYear ||
                    (selectedYear === currentYear && monthIndex > currentMonth);

                  // Don't show bars for future months
                  const displayCount = isFutureMonth ? 0 : count;
                  const maxCount = Math.max(
                    ...(selectedYearData?.months || [1]),
                  );
                  const height =
                    maxCount > 0 ? (displayCount / maxCount) * 100 : 0;

                  return (
                    <div key={monthIndex} className="flex-1 relative px-0.5">
                      <div
                        className={`absolute bottom-0 left-0.5 right-0.5 ${getSolidColor(selectedYear)}`}
                        style={{
                          height: `${height}%`,
                        }}
                      />
                      {/* Count label - only show when count > 0 */}
                      {!isFutureMonth && count > 0 && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-medium text-white">
                          {count}
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {/* Month Labels */}
          <div className="flex">
            {[
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ].map((month, index) => (
              <div
                key={index}
                className="flex-1 text-center text-xs text-muted-foreground"
              >
                <span className="hidden sm:inline">{month}</span>
                <span className="sm:hidden">
                  {
                    [
                      "J",
                      "F",
                      "M",
                      "A",
                      "M",
                      "J",
                      "J",
                      "A",
                      "S",
                      "O",
                      "N",
                      "D",
                    ][index]
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
