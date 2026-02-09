'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Download, ClipboardList } from 'lucide-react';

interface ApplyPromptProps {
  isOpen: boolean;
  onClose: () => void;
  downloadUrl: string;
  filename: string;
  companyName?: string;
  position?: string;
  onLogApplication: (data: {
    company_name: string;
    position: string;
    job_url?: string;
  }) => void;
  isLogging: boolean;
}

export function ApplyPrompt({
  isOpen,
  onClose,
  downloadUrl,
  filename,
  companyName: initialCompany = '',
  position: initialPosition = '',
  onLogApplication,
  isLogging,
}: ApplyPromptProps) {
  const [company, setCompany] = useState(initialCompany);
  const [position, setPosition] = useState(initialPosition);
  const [jobUrl, setJobUrl] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleDownload = () => {
    window.open(downloadUrl, '_blank');
  };

  const handleLogApplication = () => {
    if (!company || !position) return;
    onLogApplication({
      company_name: company,
      position: position,
      job_url: jobUrl || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle>Tailored CV Ready!</DialogTitle>
          </div>
          <DialogDescription>
            Your CV has been optimized for this role. Download it and apply with confidence!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Download Section */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleDownload}
          >
            <Download className="mr-2 h-4 w-4" />
            Download {filename}
          </Button>

          {/* Log Application Prompt */}
          {!showForm ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Have you applied to this job?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowForm(true)}
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Yes, log it
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={onClose}
                >
                  Not yet
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="log-company">Company Name</Label>
                <Input
                  id="log-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., Google"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="log-position">Position</Label>
                <Input
                  id="log-position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="log-url">Job URL (optional)</Label>
                <Input
                  id="log-url"
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          )}
        </div>

        {showForm && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Back
            </Button>
            <Button
              onClick={handleLogApplication}
              disabled={!company || !position || isLogging}
            >
              {isLogging ? 'Logging...' : 'Log Application'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
