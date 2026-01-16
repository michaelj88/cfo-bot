import React from 'react';

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-stone-800 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-stone-500 text-sm sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}