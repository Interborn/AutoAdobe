"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadButton } from "@/components/upload-button";
import { toast } from "@/components/ui/use-toast";
import { Product } from "@/models/Product";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PromptsFormProps {
  onProductsCreated: (product: Product) => void;
  onProcessingCountChange: (count: number) => void;
  sessionBatchId: string | null;
  sessionBatchName: string;
  onBatchNameChange: (name: string) => void;
  onBatchIdCreated: (batchId: string) => void;
}

interface ProcessingFile {
  file: File;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  product?: Product;
}

const fadeToBackgroundKeyframes = {
  '0%': { opacity: '1' },
  '100%': { opacity: '0', transform: 'scale(1.05)' }
} as const;

const fadeToBackground = {
  animation: 'fade-to-bg 600ms ease-out forwards',
  '@keyframes fade-to-bg': fadeToBackgroundKeyframes,
} as const;

// Add new helper functions for better organization
const createBatchId = async (batchName: string): Promise<string> => {
  const response = await fetch('/api/batches/new', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ batchName })
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate batch ID');
  }
  
  const data = await response.json();
  return data.batchId;
};

const uploadFile = async (file: File, batchName: string, batchId: string) => {
  const formData = new FormData();
  formData.append('files', file);
  formData.append('batchName', batchName);
  formData.append('batchId', batchId);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload file');
  }
  
  const data = await response.json();
  if (!data.results?.[0]?.url) {
    throw new Error('Invalid upload response');
  }
  
  return data.results[0];
};

const updateProduct = async (productId: string, imageConfig: any) => {
  const response = await fetch(`/api/products/${productId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageConfig }),
  });

  if (!response.ok) {
    throw new Error("Failed to update product");
  }

  return response.json();
};

export function PromptsForm({ 
  onProductsCreated, 
  onProcessingCountChange,
  sessionBatchId,
  sessionBatchName,
  onBatchNameChange,
  onBatchIdCreated
}: PromptsFormProps) {
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  // Update processing count whenever processingFiles changes
  useEffect(() => {
    const activeCount = processingFiles.filter(
      pf => pf.status === 'uploading' || pf.status === 'processing'
    ).length;
    onProcessingCountChange(activeCount);
  }, [processingFiles, onProcessingCountChange]);

  const updateFileStatus = (file: File, updates: Partial<ProcessingFile>) => {
    setProcessingFiles(prev => 
      prev.map(pf => 
        pf.file === file ? { ...pf, ...updates } : pf
      )
    );
  };

  const handleUploadComplete = async (files: File[]) => {
    if (!files.length) return;

    try {
      // Get or create batch ID
      let batchId = sessionBatchId;
      if (!batchId) {
        batchId = await createBatchId(sessionBatchName);
        onBatchIdCreated(batchId);
      }

      // Initialize processing state
      setProcessingFiles(files.map(file => ({
        file,
        status: 'uploading',
        progress: 0
      })));

      // Process files concurrently with better error handling
      await Promise.all(files.map(async (file) => {
        try {
          // Upload file
          updateFileStatus(file, { progress: 10 });
          const uploadData = await uploadFile(file, sessionBatchName, batchId!);
          updateFileStatus(file, { progress: 40 });

          // Process and update product
          updateFileStatus(file, { status: 'processing', progress: 50 });
          const product = await updateProduct(uploadData.productId, {
            base64Image: uploadData.base64Image,
            originalImageUrl: uploadData.url,
          });

          // Handle success
          updateFileStatus(file, { 
            status: 'completed', 
            progress: 100,
            product 
          });
          
          onProductsCreated(product);
        } catch (error) {
          console.error('Processing error:', error);
          updateFileStatus(file, { 
            status: 'failed',
            error: error instanceof Error ? error.message : 'Failed to process file',
            progress: 0
          });
          
          toast({
            variant: "destructive",
            title: "Processing failed",
            description: error instanceof Error ? error.message : 'Failed to process file',
          });
        }
      }));

      // Clear completed files after delay
      setTimeout(() => {
        setProcessingFiles(prev => prev.filter(pf => pf.status !== 'completed'));
      }, 3000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Batch creation failed",
        description: error instanceof Error ? error.message : 'Failed to create batch',
      });
    }
  };

  const handleUploadError = (error: Error) => {
    toast({
      variant: "destructive",
      title: "Upload failed",
      description: error.message,
    });
  };

  const getFilesByStatus = () => {
    const uploading = processingFiles.filter(pf => pf.status === 'uploading');
    const processing = processingFiles.filter(pf => pf.status === 'processing');
    const completed = processingFiles.filter(pf => pf.status === 'completed');
    const failed = processingFiles.filter(pf => pf.status === 'failed');
    return { uploading, processing, completed, failed };
  };

  const renderProgressBar = (count: number, total: number, status: ProcessingFile['status']) => {
    const percentage = (count / total) * 100;
    return (
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-300",
            status === 'completed' ? "bg-green-500" :
            status === 'failed' ? "bg-red-500" :
            "bg-blue-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Upload Images</h2>
          <p className="text-sm text-muted-foreground">
            Upload images to automatically create prompts based on your images and preferences.
          </p>
        </div>
        
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="batchName">Batch Name (optional)</Label>
            <Input
              id="batchName"
              value={sessionBatchName}
              onChange={(e) => onBatchNameChange(e.target.value)}
              placeholder="Enter a name for this batch of uploads"
              disabled={processingFiles.length > 0}
            />
          </div>
          
          <div className="grid gap-2">
            <UploadButton
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              multiple
              maxFiles={10}
              maxSize={10 * 1024 * 1024} // 10MB
              accept="image/*"
              disabled={processingFiles.length > 0}
            />
          </div>
        </div>

        {processingFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing files...</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {showDetails && (
              <div className="space-y-2">
                {processingFiles.map((pf, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "text-sm flex items-center justify-between gap-4 transition-all duration-300",
                      pf.status === 'completed' && fadeToBackground
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="truncate">{pf.file.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {pf.status === 'uploading' && 'Uploading...'}
                          {pf.status === 'processing' && 'Processing...'}
                          {pf.status === 'completed' && 'Completed'}
                          {pf.status === 'failed' && 'Failed'}
                        </span>
                      </div>
                      <div className="w-full">
                        {renderProgressBar(pf.progress, 100, pf.status)}
                      </div>
                      {pf.error && (
                        <p className="text-xs text-destructive mt-1">{pf.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}


