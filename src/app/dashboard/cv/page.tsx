'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  Loader2,
  Pencil,
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Briefcase,
  GraduationCap,
  Award,
  FolderGit2,
  Languages,
  Trash2,
} from 'lucide-react';
import { CV, ParsedCV } from '@/types/cv';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CollapsibleCVSection } from '@/components/cv/collapsible-cv-section';
import { CVEditor } from '@/components/cv/cv-editor';
import { PDFViewer } from '@/components/cv/pdf-viewer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type ViewMode = 'view' | 'edit';

export default function CVPage() {
  const router = useRouter();
  const [cv, setCv] = useState<CV | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('view');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCv = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/cv');
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

  useEffect(() => {
    fetchCv();
  }, []);

  const handleSave = async (content: ParsedCV) => {
    if (!cv) return;

    const response = await fetch(`/api/cv/${cv.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parsed_content: content }),
    });

    if (!response.ok) {
      throw new Error('Failed to save changes');
    }

    const data = await response.json();
    setCv(data.cv);
  };

  const handleDelete = async () => {
    if (!cv) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/cv/${cv.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete CV');
      }

      setCv(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete CV');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No CV uploaded yet - show upload prompt
  if (!cv) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master CV</h1>
          <p className="text-muted-foreground">
            Your complete CV that will be tailored for each job application
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-lg p-8">
          <div className="p-4 rounded-full bg-muted mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No CV uploaded yet</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-sm">
            Upload your master CV to get started. When you apply to jobs, we&apos;ll
            help you tailor it with AI-powered suggestions.
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

  const parsedContent = cv.parsed_content;

  // Render the parsed CV content (used in both view modes)
  const renderParsedContent = () => (
    <div className="space-y-4">
      {/* Contact Information */}
      <CollapsibleCVSection
        title="Contact Information"
        icon={<User className="h-5 w-5" />}
        defaultOpen={true}
      >
        <div className="grid gap-4 md:grid-cols-2 pt-2">
          {parsedContent.contact.fullName && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{parsedContent.contact.fullName}</span>
            </div>
          )}
          {parsedContent.contact.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${parsedContent.contact.email}`} className="text-primary hover:underline">
                {parsedContent.contact.email}
              </a>
            </div>
          )}
          {parsedContent.contact.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{parsedContent.contact.phone}</span>
            </div>
          )}
          {parsedContent.contact.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{parsedContent.contact.location}</span>
            </div>
          )}
          {parsedContent.contact.linkedIn && (
            <div className="flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-muted-foreground" />
              <a
                href={parsedContent.contact.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                LinkedIn
              </a>
            </div>
          )}
          {parsedContent.contact.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a
                href={parsedContent.contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Website
              </a>
            </div>
          )}
        </div>
      </CollapsibleCVSection>

      {/* Summary */}
      {parsedContent.summary && (
        <CollapsibleCVSection
          title="Summary"
          defaultOpen={true}
        >
          <p className="text-muted-foreground whitespace-pre-wrap pt-2">
            {parsedContent.summary}
          </p>
        </CollapsibleCVSection>
      )}

      {/* Experience */}
      {parsedContent.experience.length > 0 && (
        <CollapsibleCVSection
          title="Experience"
          icon={<Briefcase className="h-5 w-5" />}
          badge={<Badge variant="secondary">{parsedContent.experience.length}</Badge>}
          defaultOpen={true}
        >
          <div className="space-y-6 pt-2">
            {parsedContent.experience.map((exp, index) => (
              <div key={exp.id || index}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="font-semibold">{exp.title}</h4>
                    <span className="text-sm text-muted-foreground">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {exp.company}
                    {exp.location && ` \u2022 ${exp.location}`}
                  </p>
                  {exp.description && (
                    <p className="text-sm whitespace-pre-wrap">{exp.description}</p>
                  )}
                  {exp.highlights.length > 0 && (
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {exp.highlights.map((highlight, i) => (
                        <li key={i}>{highlight}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleCVSection>
      )}

      {/* Education */}
      {parsedContent.education.length > 0 && (
        <CollapsibleCVSection
          title="Education"
          icon={<GraduationCap className="h-5 w-5" />}
          badge={<Badge variant="secondary">{parsedContent.education.length}</Badge>}
          defaultOpen={true}
        >
          <div className="space-y-6 pt-2">
            {parsedContent.education.map((edu, index) => (
              <div key={edu.id || index}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="font-semibold">
                      {edu.degree}
                      {edu.field && ` in ${edu.field}`}
                    </h4>
                    <span className="text-sm text-muted-foreground">
                      {edu.startDate} - {edu.endDate}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {edu.institution}
                    {edu.location && ` \u2022 ${edu.location}`}
                  </p>
                  {edu.gpa && <p className="text-sm">GPA: {edu.gpa}</p>}
                  {edu.highlights.length > 0 && (
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {edu.highlights.map((highlight, i) => (
                        <li key={i}>{highlight}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleCVSection>
      )}

      {/* Skills */}
      {parsedContent.skills.length > 0 && (
        <CollapsibleCVSection
          title="Skills"
          badge={<Badge variant="secondary">{parsedContent.skills.length}</Badge>}
          defaultOpen={true}
        >
          <div className="flex flex-wrap gap-2 pt-2">
            {parsedContent.skills.map((skill, index) => (
              <Badge key={index} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </CollapsibleCVSection>
      )}

      {/* Certifications */}
      {parsedContent.certifications.length > 0 && (
        <CollapsibleCVSection
          title="Certifications"
          icon={<Award className="h-5 w-5" />}
          badge={<Badge variant="secondary">{parsedContent.certifications.length}</Badge>}
          defaultOpen={false}
        >
          <div className="space-y-4 pt-2">
            {parsedContent.certifications.map((cert, index) => (
              <div key={cert.id || index}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="font-semibold">{cert.name}</h4>
                    {cert.date && (
                      <span className="text-sm text-muted-foreground">{cert.date}</span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{cert.issuer}</p>
                  {cert.credentialId && (
                    <p className="text-sm">Credential ID: {cert.credentialId}</p>
                  )}
                  {cert.url && (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Verify Credential
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleCVSection>
      )}

      {/* Projects */}
      {parsedContent.projects.length > 0 && (
        <CollapsibleCVSection
          title="Projects"
          icon={<FolderGit2 className="h-5 w-5" />}
          badge={<Badge variant="secondary">{parsedContent.projects.length}</Badge>}
          defaultOpen={false}
        >
          <div className="space-y-6 pt-2">
            {parsedContent.projects.map((project, index) => (
              <div key={project.id || index}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="font-semibold">{project.name}</h4>
                    {(project.startDate || project.endDate) && (
                      <span className="text-sm text-muted-foreground">
                        {project.startDate}
                        {project.endDate && ` - ${project.endDate}`}
                      </span>
                    )}
                  </div>
                  {project.description && (
                    <p className="text-sm whitespace-pre-wrap">{project.description}</p>
                  )}
                  {project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.map((tech, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View Project
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleCVSection>
      )}

      {/* Languages */}
      {parsedContent.languages.length > 0 && (
        <CollapsibleCVSection
          title="Languages"
          icon={<Languages className="h-5 w-5" />}
          badge={<Badge variant="secondary">{parsedContent.languages.length}</Badge>}
          defaultOpen={false}
        >
          <div className="flex flex-wrap gap-2 pt-2">
            {parsedContent.languages.map((language, index) => (
              <Badge key={index} variant="secondary">
                {language}
              </Badge>
            ))}
          </div>
        </CollapsibleCVSection>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master CV</h1>
          <p className="text-muted-foreground">
            {cv.original_filename || 'Your master CV for job applications'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'view' && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => setViewMode('edit')}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/cv/upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Re-upload
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete CV?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Your CV and all associated data will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 60/40 Split Layout */}
      <div className="flex gap-6 min-h-[calc(100vh-220px)]">
        {/* Left side - 60% - Parsed content or Editor */}
        <div className="w-[60%] overflow-y-auto pr-2">
          {viewMode === 'edit' ? (
            <CVEditor
              cvId={cv.id}
              initialContent={parsedContent}
              onSave={handleSave}
              onCancel={() => setViewMode('view')}
            />
          ) : (
            renderParsedContent()
          )}
        </div>

        {/* Right side - 40% - PDF Preview */}
        <div className="w-[40%] sticky top-0 h-[calc(100vh-220px)]">
          <PDFViewer cvId={cv.id} filename={cv.original_filename} />
        </div>
      </div>
    </div>
  );
}
