'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UsageIndicator } from './usage-indicator';
import { Loader2, Sparkles, FileText } from 'lucide-react';
import { CV } from '@/types/cv';

interface JobInputFormProps {
  cvs: CV[];
  selectedCvId: string;
  onCvChange: (cvId: string) => void;
  onSubmit: (data: {
    job_description: string;
    company_name?: string;
    position?: string;
    job_url?: string;
  }) => void;
  isLoading: boolean;
  sessionsUsed: number;
  sessionsLimit: number | null;
}

export function JobInputForm({
  cvs,
  selectedCvId,
  onCvChange,
  onSubmit,
  isLoading,
  sessionsUsed,
  sessionsLimit,
}: JobInputFormProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [charCount, setCharCount] = useState(0);

  const MAX_CHARS = 10000;
  const MIN_CHARS = 100;

  useEffect(() => {
    // Count characters excluding leading/trailing whitespace
    setCharCount(jobDescription.trim().length);
  }, [jobDescription]);

  const isValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS && selectedCvId;
  const isFreeUser = sessionsLimit !== null;
  const isLimitReached = isFreeUser && sessionsUsed >= sessionsLimit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading || isLimitReached) return;

    // Trim whitespace and normalize multiple spaces/newlines
    const cleanedDescription = jobDescription
      .trim()
      .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
      .replace(/[ \t]+/g, ' '); // Collapse multiple spaces/tabs

    onSubmit({
      job_description: cleanedDescription,
      company_name: companyName.trim() || undefined,
      position: position.trim() || undefined,
      job_url: jobUrl.trim() || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI-Powered CV Tailoring
        </CardTitle>
        <CardDescription>
          Paste a job description and get AI suggestions to optimize your CV for the role.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* CV Selector */}
          <div className="space-y-2">
            <Label htmlFor="cv-select">Select CV</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                id="cv-select"
                value={selectedCvId}
                onChange={(e) => onCvChange(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a CV...</option>
                {cvs.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.title} {cv.is_primary && '(Primary)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="job-description">Job Description</Label>
              <span className={`text-xs ${charCount < MIN_CHARS ? 'text-destructive' : charCount > MAX_CHARS ? 'text-destructive' : 'text-muted-foreground'}`}>
                {charCount.toLocaleString()} / {MIN_CHARS.toLocaleString()}-{MAX_CHARS.toLocaleString()} characters
              </span>
            </div>
            <Textarea
              id="job-description"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[350px] resize-y"
            />
          </div>

          {/* Optional fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name (optional)</Label>
              <Input
                id="company-name"
                placeholder="e.g., Google"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position (optional)</Label>
              <Input
                id="position"
                placeholder="e.g., Software Engineer"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-url">Job URL (optional)</Label>
            <Input
              id="job-url"
              type="url"
              placeholder="https://..."
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
            />
          </div>

          {/* Usage Indicator */}
          <div className="pt-2">
            <UsageIndicator sessionsUsed={sessionsUsed} limit={sessionsLimit} />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!isValid || isLoading || isLimitReached}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : isLimitReached ? (
              'Upgrade to Continue'
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Get AI Suggestions
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
