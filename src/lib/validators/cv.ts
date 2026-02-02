import { z } from 'zod';

// File validation constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_EXTENSIONS = ['.pdf', '.docx'] as const;
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

// Contact info schema
export const contactInfoSchema = z.object({
  fullName: z.string().default(''),
  email: z.string().email().or(z.literal('')).default(''),
  phone: z.string().default(''),
  location: z.string().default(''),
  linkedIn: z.string().url().or(z.literal('')).default(''),
  website: z.string().url().or(z.literal('')).default(''),
});

// Experience item schema
export const experienceItemSchema = z.object({
  id: z.string(),
  company: z.string().default(''),
  title: z.string().default(''),
  location: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  current: z.boolean().default(false),
  description: z.string().default(''),
  highlights: z.array(z.string()).default([]),
});

// Education item schema
export const educationItemSchema = z.object({
  id: z.string(),
  institution: z.string().default(''),
  degree: z.string().default(''),
  field: z.string().default(''),
  location: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  gpa: z.string().default(''),
  highlights: z.array(z.string()).default([]),
});

// Certification item schema
export const certificationItemSchema = z.object({
  id: z.string(),
  name: z.string().default(''),
  issuer: z.string().default(''),
  date: z.string().default(''),
  expiryDate: z.string().default(''),
  credentialId: z.string().default(''),
  url: z.string().url().or(z.literal('')).default(''),
});

// Project item schema
export const projectItemSchema = z.object({
  id: z.string(),
  name: z.string().default(''),
  description: z.string().default(''),
  technologies: z.array(z.string()).default([]),
  url: z.string().url().or(z.literal('')).default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
});

// Complete parsed CV schema
export const parsedCVSchema = z.object({
  contact: contactInfoSchema,
  summary: z.string().default(''),
  experience: z.array(experienceItemSchema).default([]),
  education: z.array(educationItemSchema).default([]),
  skills: z.array(z.string()).default([]),
  certifications: z.array(certificationItemSchema).default([]),
  projects: z.array(projectItemSchema).default([]),
  languages: z.array(z.string()).default([]),
  parsing_success: z.boolean().default(false),
});

// CV update schema (for PATCH requests)
export const cvUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  parsed_content: parsedCVSchema.optional(),
  is_primary: z.boolean().optional(),
});

// File validation helper
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File must be under 5MB' };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
    fileName.endsWith(ext)
  );
  if (!hasValidExtension) {
    return { valid: false, error: 'Only PDF and DOCX files are allowed' };
  }

  // Check MIME type
  const hasValidMimeType = ALLOWED_MIME_TYPES.includes(
    file.type as (typeof ALLOWED_MIME_TYPES)[number]
  );
  if (!hasValidMimeType) {
    return { valid: false, error: 'Invalid file type' };
  }

  return { valid: true };
}

// Type exports
export type ContactInfoInput = z.infer<typeof contactInfoSchema>;
export type ExperienceItemInput = z.infer<typeof experienceItemSchema>;
export type EducationItemInput = z.infer<typeof educationItemSchema>;
export type CertificationItemInput = z.infer<typeof certificationItemSchema>;
export type ProjectItemInput = z.infer<typeof projectItemSchema>;
export type ParsedCVInput = z.infer<typeof parsedCVSchema>;
export type CVUpdateInput = z.infer<typeof cvUpdateSchema>;
