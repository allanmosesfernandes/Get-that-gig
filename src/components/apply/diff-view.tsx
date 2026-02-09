'use client';

import { cn } from '@/lib/utils';

interface DiffViewProps {
  original: string | null;
  suggested: string;
  type: 'modify' | 'add' | 'remove';
  inline?: boolean;
}

export function DiffView({ original, suggested, type, inline = true }: DiffViewProps) {
  if (type === 'add') {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-3">
        <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
          + Add
        </div>
        <p className="text-sm text-green-900 dark:text-green-100">{suggested}</p>
      </div>
    );
  }

  if (type === 'remove') {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-3">
        <div className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
          - Remove
        </div>
        <p className="text-sm text-red-900 dark:text-red-100 line-through">{original}</p>
      </div>
    );
  }

  // Modify type - show side by side or inline
  if (inline) {
    return (
      <div className="space-y-2">
        <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-3">
          <div className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
            - Original
          </div>
          <p className="text-sm text-red-900 dark:text-red-100">{original}</p>
        </div>
        <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-3">
          <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
            + Suggested
          </div>
          <p className="text-sm text-green-900 dark:text-green-100">{suggested}</p>
        </div>
      </div>
    );
  }

  // Side by side
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-3">
        <div className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
          Original
        </div>
        <p className="text-sm text-red-900 dark:text-red-100">{original}</p>
      </div>
      <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-3">
        <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
          Suggested
        </div>
        <p className="text-sm text-green-900 dark:text-green-100">{suggested}</p>
      </div>
    </div>
  );
}

interface ConfidenceIndicatorProps {
  confidence: number;
}

export function ConfidenceIndicator({ confidence }: ConfidenceIndicatorProps) {
  const percentage = Math.round(confidence * 100);

  const getColor = () => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getLabel = () => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">
        {getLabel()} ({percentage}%)
      </span>
    </div>
  );
}
