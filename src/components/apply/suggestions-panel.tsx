'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { SuggestionCard } from './suggestion-card';
import { Suggestion, CVSection } from '@/types/suggestions';
import { getSectionLabel } from '@/lib/gemini';
import { Check, X, FileDown, Loader2 } from 'lucide-react';

interface SuggestionsPanelProps {
  suggestions: Suggestion[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onReset: (id: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function SuggestionsPanel({
  suggestions,
  onAccept,
  onReject,
  onReset,
  onAcceptAll,
  onRejectAll,
  onGenerate,
  isGenerating,
}: SuggestionsPanelProps) {
  // Group suggestions by section
  const groupedSuggestions = useMemo(() => {
    const groups: Record<CVSection, Suggestion[]> = {
      contact: [],
      summary: [],
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
    };

    suggestions.forEach((s) => {
      groups[s.section].push(s);
    });

    return Object.entries(groups).filter(([, items]) => items.length > 0) as [
      CVSection,
      Suggestion[]
    ][];
  }, [suggestions]);

  // Calculate stats
  const stats = useMemo(() => {
    const accepted = suggestions.filter((s) => s.status === 'accepted').length;
    const rejected = suggestions.filter((s) => s.status === 'rejected').length;
    const pending = suggestions.filter((s) => s.status === 'pending').length;
    return { accepted, rejected, pending, total: suggestions.length };
  }, [suggestions]);

  const hasDecisions = stats.accepted > 0 || stats.rejected > 0;
  const allDecided = stats.pending === 0;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">AI Suggestions</CardTitle>
          <Badge variant="secondary">
            {stats.accepted} of {stats.total} accepted
          </Badge>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onAcceptAll}
            disabled={stats.pending === 0}
            className="text-green-600 hover:text-green-700"
          >
            <Check className="h-4 w-4 mr-1" />
            Accept All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onRejectAll}
            disabled={stats.pending === 0}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            Reject All
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            {groupedSuggestions.map(([section, sectionSuggestions]) => (
              <div key={section} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground sticky top-0 bg-background py-1">
                  {getSectionLabel(section)}
                </h3>
                <div className="space-y-3">
                  {sectionSuggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onAccept={onAccept}
                      onReject={onReject}
                      onReset={onReset}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Generate Button - Fixed at bottom */}
      <div className="p-4 border-t bg-background">
        <Button
          className="w-full"
          size="lg"
          onClick={onGenerate}
          disabled={stats.accepted === 0 || isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Tailored CV...
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              Generate Tailored CV ({stats.accepted} changes)
            </>
          )}
        </Button>
        {stats.accepted === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Accept at least one suggestion to generate
          </p>
        )}
      </div>
    </Card>
  );
}
