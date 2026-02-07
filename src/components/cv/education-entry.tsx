'use client';

import { useState } from 'react';
import { ChevronDown, GripVertical, Trash2 } from 'lucide-react';
import { UseFormReturn, FieldArrayWithId } from 'react-hook-form';
import { ParsedCV } from '@/types/cv';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';

interface EducationEntryProps {
  index: number;
  field: FieldArrayWithId<ParsedCV, 'education', 'id'>;
  form: UseFormReturn<ParsedCV>;
  onRemove: () => void;
}

export function EducationEntry({
  index,
  field,
  form,
  onRemove,
}: EducationEntryProps) {
  const [isExpanded, setIsExpanded] = useState(
    !form.getValues(`education.${index}.institution`) ||
    !form.getValues(`education.${index}.degree`)
  );

  const institution = form.watch(`education.${index}.institution`);
  const degree = form.watch(`education.${index}.degree`);
  const field_ = form.watch(`education.${index}.field`);
  const startDate = form.watch(`education.${index}.startDate`);
  const endDate = form.watch(`education.${index}.endDate`);

  const degreeText = degree && field_ ? `${degree} in ${field_}` : degree || field_ || '';
  const collapsedTitle = institution && degreeText
    ? `${degreeText} at ${institution}`
    : institution || degreeText || 'New Education';

  const dateRange = startDate ? `${startDate} - ${endDate || 'Present'}` : '';

  return (
    <div className="border rounded-lg bg-muted/30">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 p-3 text-left hover:bg-muted/50 transition-colors rounded-t-lg"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 cursor-grab" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{collapsedTitle}</span>
            {dateRange && (
              <>
                <span className="text-muted-foreground">|</span>
                <span className="text-sm text-muted-foreground">{dateRange}</span>
              </>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="p-4 pt-2 space-y-4 border-t">
            <FormField
              control={form.control}
              name={`education.${index}.institution`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Stanford University"
                      className="bg-background"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name={`education.${index}.degree`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Degree</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Bachelor of Science"
                        className="bg-background"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`education.${index}.field`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field of Study</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Computer Science"
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
              name={`education.${index}.location`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Stanford, CA"
                      className="bg-background"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name={`education.${index}.startDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Sep 2016"
                        className="bg-background"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`education.${index}.endDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Jun 2020"
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
              name={`education.${index}.gpa`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GPA (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 3.8"
                      className="bg-background"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
