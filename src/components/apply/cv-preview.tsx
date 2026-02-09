'use client';

import { ParsedCV } from '@/types/cv';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
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
} from 'lucide-react';

interface CVPreviewProps {
  parsedContent: ParsedCV;
}

export function CVPreview({ parsedContent }: CVPreviewProps) {
  if (!parsedContent) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No CV data available
      </div>
    );
  }

  const { contact, summary, experience, education, skills, certifications, projects } =
    parsedContent;

  return (
    <div className="space-y-6 text-sm">
      {/* Contact Information */}
      <section className="space-y-3">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          Contact Information
        </h3>
        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
          {contact?.fullName && (
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              <span className="text-foreground">{contact.fullName}</span>
            </div>
          )}
          {contact?.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3" />
              <span className="text-foreground truncate">{contact.email}</span>
            </div>
          )}
          {contact?.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3" />
              <span className="text-foreground">{contact.phone}</span>
            </div>
          )}
          {contact?.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              <span className="text-foreground">{contact.location}</span>
            </div>
          )}
          {contact?.linkedIn && (
            <div className="flex items-center gap-2">
              <Linkedin className="h-3 w-3" />
              <span className="text-foreground">LinkedIn</span>
            </div>
          )}
          {contact?.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-3 w-3" />
              <span className="text-foreground">Website</span>
            </div>
          )}
        </div>
      </section>

      <Separator />

      {/* Summary */}
      {summary && (
        <>
          <section className="space-y-2">
            <h3 className="font-semibold text-base">Professional Summary</h3>
            <p className="text-muted-foreground leading-relaxed">{summary}</p>
          </section>
          <Separator />
        </>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <>
          <section className="space-y-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Experience
            </h3>
            <div className="space-y-4">
              {experience.map((exp, index) => (
                <div key={exp.id || index} className="space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{exp.title}</p>
                      <p className="text-muted-foreground">{exp.company}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="list-disc list-inside text-muted-foreground text-xs space-y-0.5 mt-1">
                      {exp.highlights.slice(0, 2).map((h, i) => (
                        <li key={i} className="truncate">{h}</li>
                      ))}
                      {exp.highlights.length > 2 && (
                        <li className="text-muted-foreground/60">
                          +{exp.highlights.length - 2} more
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
          <Separator />
        </>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <>
          <section className="space-y-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              Education
            </h3>
            <div className="space-y-3">
              {education.map((edu, index) => (
                <div key={edu.id || index} className="space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                      </p>
                      <p className="text-muted-foreground">{edu.institution}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {edu.startDate} - {edu.endDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <Separator />
        </>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <>
          <section className="space-y-2">
            <h3 className="font-semibold text-base">Skills</h3>
            <div className="flex flex-wrap gap-1">
              {skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </section>
          <Separator />
        </>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <>
          <section className="space-y-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <FolderGit2 className="h-4 w-4 text-muted-foreground" />
              Projects
            </h3>
            <div className="space-y-2">
              {projects.map((project, index) => (
                <div key={project.id || index}>
                  <p className="font-medium">{project.name}</p>
                  {project.technologies && project.technologies.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {project.technologies.join(' • ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
          <Separator />
        </>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-muted-foreground" />
            Certifications
          </h3>
          <div className="space-y-2">
            {certifications.map((cert, index) => (
              <div key={cert.id || index}>
                <p className="font-medium">{cert.name}</p>
                <p className="text-xs text-muted-foreground">{cert.issuer}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
