"use client";

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImageIcon, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface UploadButtonProps {
  onUploadComplete: (files: File[]) => void;
  onUploadError: (error: Error) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  disabled?: boolean;
}

export function UploadButton({
  onUploadComplete,
  onUploadError,
  multiple = true,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = "image/*",
  disabled = false
}: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (!files.length) return;
    
    if (files.length > maxFiles) {
      toast({
        variant: "destructive",
        title: "Too many files",
        description: `You can only upload up to ${maxFiles} files at once.`
      });
      return;
    }

    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "Files too large",
        description: `Some files exceed the ${maxSize / (1024 * 1024)}MB limit.`
      });
      return;
    }

    setIsUploading(true);

    try {
      // Instead of uploading to get URLs, we now pass the files directly
      onUploadComplete(files);
      
      toast({
        title: "Files selected",
        description: `Successfully selected ${files.length} file${files.length === 1 ? '' : 's'}.`
      });
    } catch (error) {
      console.error('File processing error:', error);
      onUploadError(error instanceof Error ? error : new Error('File processing failed'));
      
      toast({
        variant: "destructive",
        title: "Processing failed",
        description: "There was an error processing your files."
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="upload">Upload Images</Label>
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
        <ImageIcon className="w-8 h-8 mb-4 text-muted-foreground" />
        <p className="mb-2 text-sm text-muted-foreground">
          Drag and drop your images here, or click to select
        </p>
        <div className="relative">
          <Button
            variant="secondary"
            disabled={isUploading || disabled}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Select Images'
            )}
          </Button>
          <input
            id="upload"
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            disabled={isUploading || disabled}
          />
        </div>
      </div>
    </div>
  );
} 