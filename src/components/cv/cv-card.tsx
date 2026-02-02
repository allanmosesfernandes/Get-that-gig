'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  Download,
  Star,
  StarOff,
} from 'lucide-react';
import { CV } from '@/types/cv';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CVCardProps {
  cv: CV;
  onDelete?: (id: string) => Promise<void>;
  onSetPrimary?: (id: string) => Promise<void>;
}

export function CVCard({ cv, onDelete, onSetPrimary }: CVCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(cv.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/cv/${cv.id}/download`);
      const data = await response.json();

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleSetPrimary = async () => {
    if (!onSetPrimary) return;
    await onSetPrimary(cv.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const experienceCount = cv.parsed_content?.experience?.length || 0;
  const skillsCount = cv.parsed_content?.skills?.length || 0;

  return (
    <>
      <Card
        className={cn(
          'group transition-shadow hover:shadow-md',
          cv.is_primary && 'ring-2 ring-primary'
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <Link
                href={`/dashboard/cv/${cv.id}`}
                className="font-semibold hover:underline"
              >
                {cv.title}
              </Link>
              {cv.is_primary && (
                <Badge variant="secondary" className="ml-2">
                  Primary
                </Badge>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {cv.original_filename || 'No file'}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/cv/${cv.id}`)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {cv.original_file_url && (
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Original
                </DropdownMenuItem>
              )}
              {!cv.is_primary && (
                <DropdownMenuItem onClick={handleSetPrimary}>
                  <Star className="h-4 w-4 mr-2" />
                  Set as Primary
                </DropdownMenuItem>
              )}
              {cv.is_primary && (
                <DropdownMenuItem disabled>
                  <StarOff className="h-4 w-4 mr-2" />
                  Primary CV
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{experienceCount} experience{experienceCount !== 1 ? 's' : ''}</span>
            <span>{skillsCount} skill{skillsCount !== 1 ? 's' : ''}</span>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Updated {formatDate(cv.updated_at)}
        </CardFooter>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete CV</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{cv.title}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
