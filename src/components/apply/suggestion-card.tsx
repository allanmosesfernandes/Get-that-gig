'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DiffView, ConfidenceIndicator } from './diff-view';
import { Suggestion, CVSection } from '@/types/suggestions';
import { getSectionLabel } from '@/lib/gemini';
import { Check, X, ChevronDown, ChevronUp, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onReset: (id: string) => void;
}

export function SuggestionCard({
  suggestion,
  onAccept,
  onReject,
  onReset,
}: SuggestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeColor = () => {
    switch (suggestion.type) {
      case 'add':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'remove':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'modify':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    }
  };

  const getStatusStyles = () => {
    switch (suggestion.status) {
      case 'accepted':
        return 'border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20';
      case 'rejected':
        return 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20 opacity-60';
      default:
        return '';
    }
  };

  return (
    <Card className={cn('transition-all', getStatusStyles())}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={getTypeColor()}>
                  {suggestion.type}
                </Badge>
                <Badge variant="secondary">
                  {getSectionLabel(suggestion.section)}
                </Badge>
                {suggestion.status !== 'pending' && (
                  <Badge
                    variant={suggestion.status === 'accepted' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {suggestion.status === 'accepted' ? 'Accepted' : 'Rejected'}
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium mt-1 truncate">
                {suggestion.targetLabel}
              </p>
            </div>
            <ConfidenceIndicator confidence={suggestion.confidence} />
          </div>

          {/* Diff Preview */}
          <DiffView
            original={suggestion.original}
            suggested={suggestion.suggested}
            type={suggestion.type}
          />

          {/* Reasoning (collapsible) */}
          <div>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {isExpanded ? 'Hide' : 'Show'} reasoning
            </button>
            {isExpanded && (
              <p className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-md">
                {suggestion.reasoning}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {suggestion.status === 'pending' ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                  onClick={() => onAccept(suggestion.id)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => onReject(suggestion.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => onReset(suggestion.id)}
              >
                <Undo2 className="h-4 w-4 mr-1" />
                Undo
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
