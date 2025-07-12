import * as React from "react";

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-purple-200 bg-purple-50 rounded-xl px-6 py-4 my-1 flex items-center text-purple-700 text-xs">
      {children}
    </div>
  );
}
