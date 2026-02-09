import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import { ParsedCV } from '@/types/cv';

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    fontSize: 9,
    color: '#475569',
  },
  contactItem: {
    marginRight: 15,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  summary: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.5,
  },
  experienceItem: {
    marginBottom: 10,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  experienceTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  experienceCompany: {
    fontSize: 10,
    color: '#475569',
  },
  experienceDate: {
    fontSize: 9,
    color: '#64748b',
  },
  experienceLocation: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 3,
  },
  description: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 3,
  },
  bulletList: {
    marginLeft: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bullet: {
    width: 10,
    fontSize: 9,
    color: '#64748b',
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: '#475569',
  },
  educationItem: {
    marginBottom: 8,
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  educationDegree: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  educationInstitution: {
    fontSize: 10,
    color: '#475569',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 9,
    color: '#475569',
    marginRight: 5,
    marginBottom: 5,
  },
  projectItem: {
    marginBottom: 8,
  },
  projectName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  projectTech: {
    fontSize: 9,
    color: '#2563eb',
    marginBottom: 2,
  },
  certItem: {
    marginBottom: 5,
  },
  certName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  certIssuer: {
    fontSize: 9,
    color: '#475569',
  },
});

interface CVDocumentProps {
  cv: ParsedCV;
}

const CVDocument = ({ cv }: CVDocumentProps) => {
  const { contact, summary, experience, education, skills, projects, certifications } = cv;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with contact info */}
        <View style={styles.header}>
          <Text style={styles.name}>{contact.fullName || 'Your Name'}</Text>
          <View style={styles.contactRow}>
            {contact.email && <Text style={styles.contactItem}>{contact.email}</Text>}
            {contact.phone && <Text style={styles.contactItem}>{contact.phone}</Text>}
            {contact.location && <Text style={styles.contactItem}>{contact.location}</Text>}
            {contact.linkedIn && <Text style={styles.contactItem}>{contact.linkedIn}</Text>}
            {contact.website && <Text style={styles.contactItem}>{contact.website}</Text>}
          </View>
        </View>

        {/* Summary */}
        {summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summary}>{summary}</Text>
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.map((exp, index) => (
              <View key={`exp-${index}`} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <View>
                    <Text style={styles.experienceTitle}>{exp.title}</Text>
                    <Text style={styles.experienceCompany}>{exp.company}</Text>
                  </View>
                  <Text style={styles.experienceDate}>
                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                  </Text>
                </View>
                {exp.location && <Text style={styles.experienceLocation}>{exp.location}</Text>}
                {exp.description && <Text style={styles.description}>{exp.description}</Text>}
                {exp.highlights.length > 0 && (
                  <View style={styles.bulletList}>
                    {exp.highlights.map((highlight, hIndex) => (
                      <View key={`exp-${index}-h-${hIndex}`} style={styles.bulletItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>{highlight}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu, index) => (
              <View key={`edu-${index}`} style={styles.educationItem}>
                <View style={styles.educationHeader}>
                  <View>
                    <Text style={styles.educationDegree}>
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                    </Text>
                    <Text style={styles.educationInstitution}>{edu.institution}</Text>
                  </View>
                  <Text style={styles.experienceDate}>
                    {edu.startDate} - {edu.endDate}
                  </Text>
                </View>
                {edu.gpa && <Text style={styles.description}>GPA: {edu.gpa}</Text>}
                {edu.highlights.length > 0 && (
                  <View style={styles.bulletList}>
                    {edu.highlights.map((highlight, hIndex) => (
                      <View key={`edu-${index}-h-${hIndex}`} style={styles.bulletItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>{highlight}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {skills.map((skill, index) => (
                <Text key={`skill-${index}`} style={styles.skill}>{skill}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((project, index) => (
              <View key={`proj-${index}`} style={styles.projectItem}>
                <Text style={styles.projectName}>{project.name}</Text>
                {project.technologies.length > 0 && (
                  <Text style={styles.projectTech}>
                    {project.technologies.join(' • ')}
                  </Text>
                )}
                <Text style={styles.description}>{project.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certifications.map((cert, index) => (
              <View key={`cert-${index}`} style={styles.certItem}>
                <Text style={styles.certName}>{cert.name}</Text>
                <Text style={styles.certIssuer}>
                  {cert.issuer}{cert.date ? ` • ${cert.date}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

/**
 * Generate a PDF buffer from a ParsedCV
 */
export async function generatePDF(cv: ParsedCV): Promise<Buffer> {
  console.log('[PDF Generator] Generating PDF for:', cv.contact.fullName);

  const buffer = await renderToBuffer(<CVDocument cv={cv} />);

  console.log('[PDF Generator] PDF generated, size:', buffer.length, 'bytes');

  return buffer;
}

/**
 * Generate a filename for the tailored CV
 */
export function generateFilename(
  originalName: string,
  company?: string,
  position?: string
): string {
  const baseName = originalName.replace(/\.[^/.]+$/, ''); // Remove extension
  const suffix = company || position || 'tailored';
  const sanitized = suffix.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  return `${baseName}-${sanitized}.pdf`;
}
