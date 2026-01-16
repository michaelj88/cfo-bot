import React from 'react';
import Card from './Card';
import { cn } from "@/lib/utils";

export default function MetricCard({ 
  label, 
  value, 
  subtext, 
  trend, 
  trendDirection,
  size = 'normal' 
}) {
  return (
    <Card className={cn(size === 'large' && "col-span-2")}>
      <p className="text-sm text-stone-500 mb-1">{label}</p>
      <p className={cn(
        "font-semibold text-stone-800",
        size === 'large' ? "text-3xl" : "text-2xl"
      )}>
        {value}
      </p>
      {(subtext || trend) && (
        <div className="mt-2 flex items-center gap-2">
          {trend && (
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              trendDirection === 'up' && "bg-emerald-50 text-emerald-700",
              trendDirection === 'down' && "bg-red-50 text-red-700",
              trendDirection === 'neutral' && "bg-stone-100 text-stone-600"
            )}>
              {trend}
            </span>
          )}
          {subtext && (
            <span className="text-xs text-stone-400">{subtext}</span>
          )}
        </div>
      )}
    </Card>
  );
}