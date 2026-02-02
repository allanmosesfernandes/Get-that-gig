'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Star, Loader2 } from 'lucide-react';
import { CV, ParsedCV, EMPTY_PARSED_CV } from '@/types/cv';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CVViewer } from '@/components/cv/cv-viewer';
import { CVEditor } from '@/components/cv/cv-editor';

export default function CVDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [cv, setCv] = useState<CV | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCv = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/cv/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch CV');
        }

        setCv(data.cv);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCv();
  }, [id]);

  const handleSave = async (content: ParsedCV) => {
    const response = await fetch(`/api/cv/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ parsed_content: content }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to save CV');
    }

    const data = await response.json();
    setCv(data.cv);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/cv/${id}/download`);
      const data = await response.json();

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleSetPrimary = async () => {
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

      const data = await response.json();
      setCv(data.cv);
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

  if (error || !cv) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/cv">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">CV Not Found</h1>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error || 'CV not found'}</AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/dashboard/cv">Back to CVs</Link>
        </Button>
      </div>
    );
  }

  const parsedContent = cv.parsed_content || EMPTY_PARSED_CV;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/cv">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{cv.title}</h1>
              {cv.is_primary && <Badge variant="secondary">Primary</Badge>}
            </div>
            {cv.original_filename && (
              <p className="text-muted-foreground">{cv.original_filename}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!cv.is_primary && (
            <Button variant="outline" onClick={handleSetPrimary}>
              <Star className="h-4 w-4 mr-2" />
              Set as Primary
            </Button>
          )}
          {cv.original_file_url && (
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </div>

      {!parsedContent.parsing_success && (
        <Alert>
          <AlertDescription>
            Automatic parsing encountered issues. Please review and edit the
            content below to ensure accuracy.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="view" className="w-full">
        <TabsList>
          <TabsTrigger value="view">View</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
        </TabsList>
        <TabsContent value="view" className="mt-6">
          <CVViewer parsedContent={parsedContent} />
        </TabsContent>
        <TabsContent value="edit" className="mt-6">
          <CVEditor
            cvId={cv.id}
            initialContent={parsedContent}
            onSave={handleSave}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
