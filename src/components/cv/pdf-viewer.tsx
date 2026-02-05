'use client';

import { useEffect, useState } from 'react';
import { Loader2, FileText, Download, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PDFViewerProps {
  cvId: string;
  filename?: string | null;
}

export function PDFViewer({ cvId, filename }: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);

  useEffect(() => {
    const fetchPdfUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/cv/${cvId}/view`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load PDF');
        }

        setPdfUrl(data.url);
        setFileType(data.fileType);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPdfUrl();
  }, [cvId]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Uploaded CV
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100%-60px)]">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm">Loading PDF...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !pdfUrl) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Uploaded CV
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100%-60px)]">
          <div className="flex flex-col items-center gap-3 text-muted-foreground text-center p-4">
            <AlertCircle className="h-12 w-12" />
            <p className="text-sm">{error || 'No PDF available'}</p>
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/cv/${cvId}/download`}>
                <Download className="h-4 w-4 mr-2" />
                Download Instead
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For non-PDF files (like DOCX), show a download prompt instead
  if (fileType && fileType !== 'pdf') {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {filename || 'Uploaded CV'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100%-60px)]">
          <div className="flex flex-col items-center gap-3 text-muted-foreground text-center p-4">
            <FileText className="h-16 w-16" />
            <p className="text-sm">
              Preview not available for {fileType?.toUpperCase()} files
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/cv/${cvId}/download`}>
                <Download className="h-4 w-4 mr-2" />
                Download to View
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {filename || 'Uploaded CV'}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.open(pdfUrl, '_blank')}
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <a href={`/api/cv/${cvId}/download`} title="Download">
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        {/* Use object tag for better PDF rendering */}
        <object
          data={pdfUrl}
          type="application/pdf"
          className="w-full h-full rounded-b-lg"
        >
          {/* Fallback for browsers that don't support object */}
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
            className="w-full h-full border-0 rounded-b-lg"
            title="CV Preview"
          />
        </object>
      </CardContent>
    </Card>
  );
}
