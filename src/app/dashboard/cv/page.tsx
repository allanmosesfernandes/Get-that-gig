'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Loader2 } from 'lucide-react';
import { CV } from '@/types/cv';
import { Button } from '@/components/ui/button';
import { CVCard } from '@/components/cv/cv-card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CVPage() {
  const router = useRouter();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCvs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/cv');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch CVs');
      }

      setCvs(data.cvs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCvs();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/cv/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete CV');
      }

      setCvs((prev) => prev.filter((cv) => cv.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete CV');
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      const response = await fetch(`/api/cv/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_primary: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update CV');
      }

      setCvs((prev) =>
        prev.map((cv) => ({
          ...cv,
          is_primary: cv.id === id,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update CV');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CVs</h1>
          <p className="text-muted-foreground">
            Manage your CV templates and versions
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/cv/upload">
            <Plus className="h-4 w-4 mr-2" />
            Upload CV
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {cvs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-lg p-8">
          <div className="p-4 rounded-full bg-muted mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No CVs yet</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-sm">
            Upload your first CV to get started. We&apos;ll parse it automatically and
            help you apply to jobs faster.
          </p>
          <Button asChild>
            <Link href="/dashboard/cv/upload">
              <Plus className="h-4 w-4 mr-2" />
              Upload Your First CV
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cvs.map((cv) => (
            <CVCard
              key={cv.id}
              cv={cv}
              onDelete={handleDelete}
              onSetPrimary={handleSetPrimary}
            />
          ))}
        </div>
      )}
    </div>
  );
}
