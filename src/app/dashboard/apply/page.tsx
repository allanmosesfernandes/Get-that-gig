'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { CV } from '@/types/cv';
import { Suggestion } from '@/types/suggestions';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  JobInputForm,
  SuggestionsPanel,
  ApplyPrompt,
} from '@/components/apply';
import {
  Loader2,
  FileText,
  Upload,
  ArrowLeft,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

type ApplyState = 'input' | 'loading' | 'reviewing' | 'generating' | 'complete';

interface SuggestResponse {
  session_id: string;
  suggestions: Suggestion[];
  analysis: {
    match_score: number;
    key_matches: string[];
    gaps: string[];
  };
  tokens_used: number;
  sessions_used: number;
  sessions_limit: number | null;
  error?: string;
}

interface ApplyResponse {
  success: boolean;
  download_url: string;
  storage_path: string;
  filename: string;
  suggestions_applied: number;
  application: {
    id: string;
  } | null;
  error?: string;
}

export default function ApplyPage() {
  // State machine
  const [state, setState] = useState<ApplyState>('input');

  // Data state
  const [cvs, setCvs] = useState<CV[]>([]);
  const [selectedCvId, setSelectedCvId] = useState<string>('');
  const [sessionsUsed, setSessionsUsed] = useState(0);
  const [sessionsLimit, setSessionsLimit] = useState<number | null>(5);

  // Suggestion state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [jobData, setJobData] = useState<{
    job_description: string;
    company_name?: string;
    position?: string;
    job_url?: string;
  } | null>(null);

  // Result state
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [filename, setFilename] = useState<string>('');

  // UI state
  const [isLoadingCvs, setIsLoadingCvs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplyPrompt, setShowApplyPrompt] = useState(false);
  const [isLoggingApplication, setIsLoggingApplication] = useState(false);

  // Fetch all CVs on mount
  useEffect(() => {
    const fetchCvs = async () => {
      try {
        setIsLoadingCvs(true);
        const response = await fetch('/api/cv');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch CVs');
        }

        // The API returns a single CV, we need to adapt
        if (data.cv) {
          setCvs([data.cv]);
          setSelectedCvId(data.cv.id);
        } else {
          setCvs([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoadingCvs(false);
      }
    };

    fetchCvs();
  }, []);

  // Handle CV selection
  const handleCvChange = useCallback((cvId: string) => {
    setSelectedCvId(cvId);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: {
      job_description: string;
      company_name?: string;
      position?: string;
      job_url?: string;
    }) => {
      if (!selectedCvId) return;

      setError(null);
      setState('loading');
      setJobData(data);

      try {
        const response = await fetch('/api/ai/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cv_id: selectedCvId,
            ...data,
          }),
        });

        const result: SuggestResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to generate suggestions');
        }

        setSessionId(result.session_id);
        setSuggestions(result.suggestions);
        setSessionsUsed(result.sessions_used);
        if (result.sessions_limit !== undefined) {
          setSessionsLimit(result.sessions_limit);
        }
        setState('reviewing');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setState('input');
      }
    },
    [selectedCvId]
  );

  // Suggestion actions
  const handleAccept = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'accepted' as const } : s))
    );
  }, []);

  const handleReject = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'rejected' as const } : s))
    );
  }, []);

  const handleReset = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'pending' as const } : s))
    );
  }, []);

  const handleAcceptAll = useCallback(() => {
    setSuggestions((prev) =>
      prev.map((s) => (s.status === 'pending' ? { ...s, status: 'accepted' as const } : s))
    );
  }, []);

  const handleRejectAll = useCallback(() => {
    setSuggestions((prev) =>
      prev.map((s) => (s.status === 'pending' ? { ...s, status: 'rejected' as const } : s))
    );
  }, []);

  // Generate tailored CV
  const handleGenerate = useCallback(async () => {
    if (!sessionId || !selectedCvId) return;

    setError(null);
    setState('generating');

    try {
      const response = await fetch('/api/ai/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          cv_id: selectedCvId,
          suggestions: suggestions.map((s) => ({ id: s.id, status: s.status })),
          create_application: false,
          company_name: jobData?.company_name,
          position: jobData?.position,
          job_url: jobData?.job_url,
        }),
      });

      const result: ApplyResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate CV');
      }

      setDownloadUrl(result.download_url);
      setFilename(result.filename);
      setState('complete');
      setShowApplyPrompt(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setState('reviewing');
    }
  }, [sessionId, selectedCvId, suggestions, jobData]);

  // Log application
  const handleLogApplication = useCallback(
    async (data: { company_name: string; position: string; job_url?: string }) => {
      setIsLoggingApplication(true);

      try {
        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            cv_id: selectedCvId,
            job_description: jobData?.job_description,
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Failed to log application');
        }

        setShowApplyPrompt(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to log application');
      } finally {
        setIsLoggingApplication(false);
      }
    },
    [selectedCvId, jobData]
  );

  // Reset to input state
  const handleBack = useCallback(() => {
    setState('input');
    setSuggestions([]);
    setSessionId(null);
    setError(null);
  }, []);

  // Start new session
  const handleStartNew = useCallback(() => {
    setState('input');
    setSuggestions([]);
    setSessionId(null);
    setJobData(null);
    setDownloadUrl('');
    setFilename('');
    setError(null);
  }, []);

  // Loading state
  if (isLoadingCvs) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apply</h1>
          <p className="text-muted-foreground">
            Tailor your CV for specific job applications
          </p>
        </div>
        <div className="flex gap-6">
          <div className="w-[60%] space-y-4">
            <Skeleton className="h-[400px] w-full" />
          </div>
          <div className="w-[40%]">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  // No CVs - show upload prompt
  if (cvs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apply</h1>
          <p className="text-muted-foreground">
            Tailor your CV for specific job applications
          </p>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-lg p-8">
          <div className="p-4 rounded-full bg-muted mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No CV uploaded yet</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-sm">
            Upload your master CV first, then come back here to tailor it for
            specific job applications.
          </p>
          <Button asChild>
            <Link href="/dashboard/cv/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Your CV
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Step indicator
  const steps = [
    { key: 'input', label: 'Job Details' },
    { key: 'reviewing', label: 'Review Suggestions' },
    { key: 'complete', label: 'Download' },
  ];

  const currentStepIndex =
    state === 'input' || state === 'loading'
      ? 0
      : state === 'reviewing' || state === 'generating'
      ? 1
      : 2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {(state === 'reviewing' || state === 'generating') && (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Apply</h1>
            <p className="text-muted-foreground">
              Tailor your CV for specific job applications
            </p>
          </div>
        </div>

        {state === 'complete' && (
          <Button variant="outline" onClick={handleStartNew}>
            <Sparkles className="h-4 w-4 mr-2" />
            Start New
          </Button>
        )}
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                index < currentStepIndex
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                  : index === currentStepIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index < currentStepIndex ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="h-4 w-4 flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </span>
              )}
              {step.label}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 mx-2 ${
                  index < currentStepIndex ? 'bg-green-500' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content - Full width */}
      <div className="max-w-3xl mx-auto">
        {state === 'input' && (
          <JobInputForm
            cvs={cvs}
            selectedCvId={selectedCvId}
            onCvChange={handleCvChange}
            onSubmit={handleSubmit}
            isLoading={false}
            sessionsUsed={sessionsUsed}
            sessionsLimit={sessionsLimit}
          />
        )}

        {state === 'loading' && (
          <Card className="flex items-center justify-center min-h-[400px]">
            <CardContent className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Analyzing your CV...
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Our AI is comparing your experience with the job requirements
                to find the best improvements.
              </p>
            </CardContent>
          </Card>
        )}

        {(state === 'reviewing' || state === 'generating') && (
          <SuggestionsPanel
            suggestions={suggestions}
            onAccept={handleAccept}
            onReject={handleReject}
            onReset={handleReset}
            onAcceptAll={handleAcceptAll}
            onRejectAll={handleRejectAll}
            onGenerate={handleGenerate}
            isGenerating={state === 'generating'}
          />
        )}

        {state === 'complete' && (
          <Card className="flex items-center justify-center min-h-[400px]">
            <CardContent className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Your tailored CV is ready!
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Download your optimized CV and apply with confidence. Good luck!
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button asChild>
                  <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                    Download {filename}
                  </a>
                </Button>
                <Button variant="outline" onClick={() => setShowApplyPrompt(true)}>
                  Log Application
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Apply Prompt Modal */}
      <ApplyPrompt
        isOpen={showApplyPrompt}
        onClose={() => setShowApplyPrompt(false)}
        downloadUrl={downloadUrl}
        filename={filename}
        companyName={jobData?.company_name}
        position={jobData?.position}
        onLogApplication={handleLogApplication}
        isLogging={isLoggingApplication}
      />
    </div>
  );
}
