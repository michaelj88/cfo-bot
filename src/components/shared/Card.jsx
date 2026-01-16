import React from 'react';
import { cn } from "@/lib/utils";

export default function Card({ children, className, padding = 'normal' }) {
  return (
    <div className={cn(
      "bg-white rounded-2xl border border-stone-200 shadow-sm",
      padding === 'normal' && "p-6",
      padding === 'large' && "p-8",
      padding === 'none' && "",
      className
    )}>
      {children}
    </div>
  );
}