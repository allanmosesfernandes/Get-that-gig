'use client';

import { ParsedCV } from '@/types/cv';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CVCompletenessBarProps {
  content: ParsedCV;
  className?: string;
}

// Weighted scoring for CV completeness
const WEIGHTS = {
  contact: 20,    // 20%
  summary: 15,    // 15%
  experience: 30, // 30%
  education: 15,  // 15%
  skills: 20,     // 20%
};

function calculateContactScore(contact: ParsedCV['contact']): number {
  const fields = [
    contact.fullName,
    contact.email,
    contact.phone,
    contact.location,
  ];
  const filledCount = fields.filter((f) => f && f.trim().length > 0).length;
  return filledCount / fields.length;
}

function calculateSummaryScore(summary: string): number {
  if (!summary || summary.trim().length === 0) return 0;
  // Ideal length is 400-600 characters
  const length = summary.trim().length;
  if (length >= 400 && length <= 600) return 1;
  if (length >= 200 && length < 400) return 0.7;
  if (length > 600 && length <= 800) return 0.8;
  if (length > 0 && length < 200) return 0.5;
  return 0.5;
}

function calculateExperienceScore(experience: ParsedCV['experience']): number {
  if (experience.length === 0) return 0;
  // At least 1 experience with title and company = 0.7
  // 2+ experiences with details = 1.0
  const validEntries = experience.filter(
    (exp) => exp.title?.trim() && exp.company?.trim()
  );
  if (validEntries.length >= 2) return 1;
  if (validEntries.length === 1) return 0.7;
  return 0.3;
}

function calculateEducationScore(education: ParsedCV['education']): number {
  if (education.length === 0) return 0;
  const validEntries = education.filter(
    (edu) => edu.institution?.trim() && edu.degree?.trim()
  );
  if (validEntries.length >= 1) return 1;
  return 0.3;
}

function calculateSkillsScore(skills: string[]): number {
  if (!skills || skills.length === 0) return 0;
  if (skills.length >= 5) return 1;
  if (skills.length >= 3) return 0.7;
  return 0.4;
}

export function calculateCompleteness(content: ParsedCV): number {
  const contactScore = calculateContactScore(content.contact) * WEIGHTS.contact;
  const summaryScore = calculateSummaryScore(content.summary) * WEIGHTS.summary;
  const experienceScore =
    calculateExperienceScore(content.experience) * WEIGHTS.experience;
  const educationScore =
    calculateEducationScore(content.education) * WEIGHTS.education;
  const skillsScore = calculateSkillsScore(content.skills) * WEIGHTS.skills;

  const total =
    contactScore + summaryScore + experienceScore + educationScore + skillsScore;

  return Math.round(total);
}

export function CVCompletenessBar({ content, className }: CVCompletenessBarProps) {
  const percentage = calculateCompleteness(content);

  const getColorClass = (pct: number) => {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 60) return 'bg-yellow-500';
    if (pct >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Profile completeness</span>
        <span
          className={cn(
            'font-semibold px-2 py-0.5 rounded-full text-white text-xs',
            getColorClass(percentage)
          )}
        >
          {percentage}%
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out',
            getColorClass(percentage)
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {percentage < 80 && (
        <p className="text-xs text-muted-foreground">
          {percentage < 50
            ? 'Add more details to make your CV stand out'
            : 'Great progress! Add a few more details to complete your profile'}
        </p>
      )}
    </div>
  );
}
