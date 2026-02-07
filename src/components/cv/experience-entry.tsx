'use client';

import { useState } from 'react';
import { ChevronDown, GripVertical, Trash2 } from 'lucide-react';
import { UseFormReturn, FieldArrayWithId } from 'react-hook-form';
import { ParsedCV, ExperienceItem } from '@/types/cv';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';

interface ExperienceEntryProps {
  index: number;
  field: FieldArrayWithId<ParsedCV, 'experience', 'id'>;
  form: UseFormReturn<ParsedCV>;
  onRemove: () => void;
}

export function ExperienceEntry({
  index,
  field,
  form,
  onRemove,
}: ExperienceEntryProps) {
  const [isExpanded, setIsExpanded] = useState(
    !form.getValues(`experience.${index}.title`) ||
    !form.getValues(`experience.${index}.company`)
  );

  const title = form.watch(`experience.${index}.title`);
  const company = form.watch(`experience.${index}.company`);
  const startDate = form.watch(`experience.${index}.startDate`);
  const endDate = form.watch(`experience.${index}.endDate`);
  const current = form.watch(`experience.${index}.current`);

  const collapsedTitle = title && company
    ? `${title} at ${company}`
    : title || company || 'New Experience';

  const dateRange = startDate
    ? `${startDate} - ${current ? 'Present' : endDate || 'Present'}`
    : '';

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
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name={`experience.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Software Engineer"
                        className="bg-background"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`experience.${index}.company`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Acme Inc."
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
              name={`experience.${index}.location`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. San Francisco, CA"
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
                name={`experience.${index}.startDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Jan 2020"
                        className="bg-background"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`experience.${index}.endDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Dec 2023"
                        className="bg-background"
                        disabled={current}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name={`experience.${index}.current`}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    I currently work here
                  </FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`experience.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your key responsibilities and achievements..."
                      className="min-h-[100px] bg-background"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Tip: Use action verbs and quantify achievements when possible
                  </p>
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
