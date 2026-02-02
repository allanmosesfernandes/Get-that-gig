'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CVUploadZone } from '@/components/cv/cv-upload-zone';

export default function UploadCVPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    cvId: string;
    parsingSuccess: boolean;
    message: string;
  } | null>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name.replace(/\.[^/.]+$/, ''));

      const response = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess({
        cvId: data.cv.id,
        parsingSuccess: data.parsing_success,
        message: data.message,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/cv">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload CV</h1>
          <p className="text-muted-foreground">
            Upload your CV and we&apos;ll parse it automatically
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success ? (
        <div className="space-y-6">
          <Alert
            variant={success.parsingSuccess ? 'default' : 'destructive'}
            className={success.parsingSuccess ? 'border-green-500' : ''}
          >
            {success.parsingSuccess ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {success.parsingSuccess ? 'Upload Successful!' : 'Partial Success'}
            </AlertTitle>
            <AlertDescription>{success.message}</AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button asChild>
              <Link href={`/dashboard/cv/${success.cvId}`}>
                View & Edit CV
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/cv">Back to CVs</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">CV Title (Optional)</Label>
            <Input
              id="title"
              placeholder="e.g., Software Engineer Resume"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
            />
            <p className="text-sm text-muted-foreground">
              Give your CV a descriptive name to easily identify it later.
            </p>
          </div>

          <CVUploadZone
            onUpload={handleUpload}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />
        </div>
      )}
    </div>
  );
}
