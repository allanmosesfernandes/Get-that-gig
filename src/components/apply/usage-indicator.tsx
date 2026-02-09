'use client';

import { Progress } from '@/components/ui/progress';
import { FREE_TIER_AI_SESSIONS_PER_MONTH } from '@/types/suggestions';

interface UsageIndicatorProps {
  sessionsUsed: number;
  limit: number | null;
}

export function UsageIndicator({ sessionsUsed, limit }: UsageIndicatorProps) {
  const isFreeUser = limit !== null;
  const maxSessions = limit ?? FREE_TIER_AI_SESSIONS_PER_MONTH;
  const percentage = Math.min((sessionsUsed / maxSessions) * 100, 100);
  const remaining = Math.max(maxSessions - sessionsUsed, 0);
  const isLimitReached = isFreeUser && sessionsUsed >= maxSessions;

  if (!isFreeUser) {
    return (
      <div className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{sessionsUsed}</span> AI sessions used this month
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{sessionsUsed}</span> of {maxSessions} sessions used
        </span>
        {isLimitReached ? (
          <span className="text-destructive font-medium">Limit reached</span>
        ) : (
          <span className="text-muted-foreground">{remaining} remaining</span>
        )}
      </div>
      <Progress value={percentage} className="h-2" />
      {isLimitReached && (
        <p className="text-xs text-muted-foreground">
          Upgrade to Pro for unlimited AI-powered CV tailoring.
        </p>
      )}
    </div>
  );
}
