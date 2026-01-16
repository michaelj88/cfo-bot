import React from 'react';
import { Button } from "@/components/ui/button";

export default function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mb-5">
          <Icon className="w-6 h-6 text-stone-400" />
        </div>
      )}
      <h3 className="text-lg font-medium text-stone-800 mb-2">{title}</h3>
      <p className="text-stone-500 text-sm max-w-sm mb-6">{description}</p>
      {action && onAction && (
        <Button 
          onClick={onAction}
          className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-5"
        >
          {action}
        </Button>
      )}
    </div>
  );
}