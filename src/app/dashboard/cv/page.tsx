'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Upload,
  FileText,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { CV, ParsedCV } from '@/types/cv';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
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
import { CVCompletenessBar, calculateCompleteness } from '@/components/cv/cv-completeness-bar';
import { CVFormSection } from '@/components/cv/cv-form-section';
import { ExperienceEntry } from '@/components/cv/experience-entry';
import { EducationEntry } from '@/components/cv/education-entry';
import { PDFViewer } from '@/components/cv/pdf-viewer';

export default function CVPage() {
  const [cv, setCv] = useState<CV | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');

  const form = useForm<ParsedCV>({
    defaultValues: {
      contact: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        linkedIn: '',
        website: '',
      },
      summary: '',
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      projects: [],
      languages: [],
      parsing_success: false,
    },
  });

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({
    control: form.control,
    name: 'experience',
  });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({
    control: form.control,
    name: 'education',
  });

  const {
    fields: certificationFields,
    append: appendCertification,
    remove: removeCertification,
  } = useFieldArray({
    control: form.control,
    name: 'certifications',
  });

  const {
    fields: projectFields,
    append: appendProject,
    remove: removeProject,
  } = useFieldArray({
    control: form.control,
    name: 'projects',
  });

  const isDirty = form.formState.isDirty;
  const watchedValues = form.watch();
  const summary = form.watch('summary');
  const summaryLength = summary?.length || 0;

  const fetchCv = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/cv');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch CV');
      }

      setCv(data.cv);
      if (data.cv?.parsed_content) {
        form.reset(data.cv.parsed_content);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCv();
  }, []);

  const handleSaveClick = () => {
    setShowSaveDialog(true);
  };

  const handleConfirmSave = async () => {
    if (!cv) return;

    setShowSaveDialog(false);
    setIsSaving(true);
    try {
      const data = form.getValues();
      const response = await fetch(`/api/cv/${cv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parsed_content: data }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      const result = await response.json();
      setCv(result.cv);
      form.reset(data);
    } catch (error) {
      console.error('Save error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setShowCancelDialog(true);
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    if (cv?.parsed_content) {
      form.reset(cv.parsed_content);
    }
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

  const handleAddSkill = useCallback(() => {
    if (skillInput.trim()) {
      const currentSkills = form.getValues('skills') || [];
      if (!currentSkills.includes(skillInput.trim())) {
        form.setValue('skills', [...currentSkills, skillInput.trim()], {
          shouldDirty: true,
        });
      }
      setSkillInput('');
    }
  }, [skillInput, form]);

  const handleRemoveSkill = useCallback(
    (skillToRemove: string) => {
      const currentSkills = form.getValues('skills') || [];
      form.setValue(
        'skills',
        currentSkills.filter((s) => s !== skillToRemove),
        { shouldDirty: true }
      );
    },
    [form]
  );

  const handleAddLanguage = useCallback(() => {
    if (languageInput.trim()) {
      const currentLanguages = form.getValues('languages') || [];
      if (!currentLanguages.includes(languageInput.trim())) {
        form.setValue('languages', [...currentLanguages, languageInput.trim()], {
          shouldDirty: true,
        });
      }
      setLanguageInput('');
    }
  }, [languageInput, form]);

  const handleRemoveLanguage = useCallback(
    (languageToRemove: string) => {
      const currentLanguages = form.getValues('languages') || [];
      form.setValue(
        'languages',
        currentLanguages.filter((l) => l !== languageToRemove),
        { shouldDirty: true }
      );
    },
    [form]
  );

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const getSummaryStatus = () => {
    if (summaryLength === 0) return { color: 'text-muted-foreground', text: '0 characters' };
    if (summaryLength < 200) return { color: 'text-orange-500', text: `${summaryLength} characters (too short)` };
    if (summaryLength < 400) return { color: 'text-yellow-500', text: `${summaryLength} characters (getting there)` };
    if (summaryLength <= 600) return { color: 'text-green-500', text: `${summaryLength} characters (ideal)` };
    if (summaryLength <= 800) return { color: 'text-yellow-500', text: `${summaryLength} characters (a bit long)` };
    return { color: 'text-orange-500', text: `${summaryLength} characters (too long)` };
  };

  const summaryStatus = getSummaryStatus();

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
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 60/40 Split Layout */}
      <div className="flex gap-6 min-h-[calc(100vh-220px)]">
        {/* Left side - 60% - Always-editable form */}
        <div className="w-[60%] overflow-y-auto pr-2 pb-24">
          <Form {...form}>
            <form className="space-y-6">
              {/* Completeness Bar */}
              <CVCompletenessBar content={watchedValues} />

              {/* Personal Details */}
              <CVFormSection
                title="Personal Details"
                description="Add your contact information so employers can reach you"
                badge={
                  <Badge variant="outline" className="text-xs font-normal">
                    +{Math.round(calculateCompleteness({ ...watchedValues, summary: '', experience: [], education: [], skills: [] }) / 20 * 20)}%
                  </Badge>
                }
                defaultOpen={true}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="contact.fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            className="bg-muted/50"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            className="bg-muted/50"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+1 (555) 123-4567"
                            className="bg-muted/50"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact.location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="San Francisco, CA"
                            className="bg-muted/50"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CVFormSection>

              {/* Professional Summary */}
              <CVFormSection
                title="Professional Summary"
                description="Write 2-4 short sentences that highlight your strengths and experience"
                defaultOpen={true}
              >
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="A brief summary of your professional background, key skills, and career goals..."
                          className="min-h-[120px] bg-muted/50"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                          Tip: Recruiters spend 6 seconds on average looking at a CV
                        </p>
                        <span className={`text-xs ${summaryStatus.color}`}>
                          {summaryStatus.text}
                        </span>
                      </div>
                    </FormItem>
                  )}
                />
              </CVFormSection>

              {/* Professional Experience */}
              <CVFormSection
                title="Professional Experience"
                description="Add your relevant work experience, starting with the most recent"
                badge={
                  experienceFields.length > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {experienceFields.length}
                    </Badge>
                  ) : undefined
                }
                defaultOpen={true}
              >
                <div className="space-y-3">
                  {experienceFields.map((field, index) => (
                    <ExperienceEntry
                      key={field.id}
                      index={index}
                      field={field}
                      form={form}
                      onRemove={() => removeExperience(index)}
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() =>
                      appendExperience({
                        id: generateId(),
                        company: '',
                        title: '',
                        location: '',
                        startDate: '',
                        endDate: '',
                        current: false,
                        description: '',
                        highlights: [],
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add one more employment
                  </Button>
                </div>
              </CVFormSection>

              {/* Education */}
              <CVFormSection
                title="Education"
                description="Add your educational background"
                badge={
                  educationFields.length > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {educationFields.length}
                    </Badge>
                  ) : undefined
                }
                defaultOpen={true}
              >
                <div className="space-y-3">
                  {educationFields.map((field, index) => (
                    <EducationEntry
                      key={field.id}
                      index={index}
                      field={field}
                      form={form}
                      onRemove={() => removeEducation(index)}
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() =>
                      appendEducation({
                        id: generateId(),
                        institution: '',
                        degree: '',
                        field: '',
                        location: '',
                        startDate: '',
                        endDate: '',
                        gpa: '',
                        highlights: [],
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add one more education
                  </Button>
                </div>
              </CVFormSection>

              {/* Skills */}
              <CVFormSection
                title="Skills"
                description="Add skills that are relevant to the jobs you're applying for"
                badge={
                  form.watch('skills')?.length > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {form.watch('skills').length}
                    </Badge>
                  ) : undefined
                }
                defaultOpen={true}
              >
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill (e.g. JavaScript, Project Management)"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      className="bg-muted/50"
                    />
                    <Button type="button" onClick={handleAddSkill} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.watch('skills')?.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 py-1.5 px-3">
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {form.watch('skills')?.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No skills added yet. Press Enter or click + to add.
                    </p>
                  )}
                </div>
              </CVFormSection>

              {/* Websites & Social Links */}
              <CVFormSection
                title="Websites & Social Links"
                description="Add your professional online presence"
                defaultOpen={false}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="contact.linkedIn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://linkedin.com/in/johndoe"
                            className="bg-muted/50"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact.website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personal Website</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://johndoe.com"
                            className="bg-muted/50"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CVFormSection>

              {/* Certifications */}
              <CVFormSection
                title="Certifications"
                description="Add any professional certifications you've earned"
                badge={
                  certificationFields.length > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {certificationFields.length}
                    </Badge>
                  ) : undefined
                }
                defaultOpen={false}
              >
                <div className="space-y-4">
                  {certificationFields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4 space-y-4 bg-muted/30">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCertification(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`certifications.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Certification Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="AWS Solutions Architect"
                                  className="bg-background"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`certifications.${index}.issuer`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Issuer</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Amazon Web Services"
                                  className="bg-background"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`certifications.${index}.date`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date Issued</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Jan 2023"
                                  className="bg-background"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`certifications.${index}.credentialId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Credential ID</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="ABC123XYZ"
                                  className="bg-background"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() =>
                      appendCertification({
                        id: generateId(),
                        name: '',
                        issuer: '',
                        date: '',
                        expiryDate: '',
                        credentialId: '',
                        url: '',
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add certification
                  </Button>
                </div>
              </CVFormSection>

              {/* Projects */}
              <CVFormSection
                title="Projects"
                description="Showcase personal or professional projects"
                badge={
                  projectFields.length > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {projectFields.length}
                    </Badge>
                  ) : undefined
                }
                defaultOpen={false}
              >
                <div className="space-y-4">
                  {projectFields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4 space-y-4 bg-muted/30">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProject(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`projects.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="My Awesome Project"
                                  className="bg-background"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`projects.${index}.url`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project URL</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://github.com/user/project"
                                  className="bg-background"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`projects.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your project..."
                                className="min-h-[80px] bg-background"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() =>
                      appendProject({
                        id: generateId(),
                        name: '',
                        description: '',
                        technologies: [],
                        url: '',
                        startDate: '',
                        endDate: '',
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add project
                  </Button>
                </div>
              </CVFormSection>

              {/* Languages */}
              <CVFormSection
                title="Languages"
                description="Add languages you speak"
                badge={
                  form.watch('languages')?.length > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {form.watch('languages').length}
                    </Badge>
                  ) : undefined
                }
                defaultOpen={false}
              >
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a language (e.g. English, Spanish)"
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddLanguage();
                        }
                      }}
                      className="bg-muted/50"
                    />
                    <Button type="button" onClick={handleAddLanguage} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.watch('languages')?.map((language, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 py-1.5 px-3">
                        {language}
                        <button
                          type="button"
                          onClick={() => handleRemoveLanguage(language)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CVFormSection>
            </form>
          </Form>
        </div>

        {/* Right side - 40% - PDF Preview */}
        <div className="w-[40%] sticky top-0 h-[calc(100vh-220px)]">
          <PDFViewer cvId={cv.id} filename={cv.original_filename} />
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {isDirty && (
              <>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-amber-500">Unsaved changes</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelClick}
                disabled={isSaving}
              >
                Discard Changes
              </Button>
            )}
            <Button
              type="button"
              onClick={handleSaveClick}
              disabled={isSaving || !isDirty}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Master CV?</AlertDialogTitle>
            <AlertDialogDescription>
              Your Master CV is the foundation for all AI-tailored job applications.
              Any changes you save here will be used when generating customized CVs for future applications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>Save Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discard Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>Discard Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
