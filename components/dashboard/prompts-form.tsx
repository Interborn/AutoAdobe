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

    // Generate a new batch ID if one doesn't exist for the session
    let batchId = sessionBatchId;
    if (!batchId) {
      try {
        const response = await fetch('/api/batches/new', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ batchName: sessionBatchName })
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate batch ID');
        }
        
        const data = await response.json();
        batchId = data.batchId;
        onBatchIdCreated(data.batchId);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate batch ID",
        });
        return;
      }
    }

    if (!batchId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get batch ID",
      });
      return;
    }

    // Initialize processing state for each file
    setProcessingFiles(files.map(file => ({
      file,
      status: 'uploading',
      progress: 0
    })));

    // Process all files concurrently
    const processFile = async (file: File) => {
      try {
        // Step 1: Upload to cloud storage
        updateFileStatus(file, { progress: 10 });
        const formData = new FormData();
        formData.append('files', file);
        formData.append('stage', 'prompts');
        formData.append('batchName', sessionBatchName);
        formData.append('batchId', batchId);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }
        
        const uploadData = await uploadResponse.json();
        console.log('Upload response:', uploadData);

        if (!uploadData.results?.[0]?.url) {
          throw new Error('Invalid upload response');
        }

        const { url: originalImageUrl, productId, description, base64Image } = uploadData.results[0];
        
        updateFileStatus(file, { progress: 40 });

        // Step 2: Update the product with base64 data
        updateFileStatus(file, { status: 'processing', progress: 50 });

        // Step 3: Update the product with base64 data
        const response = await fetch(`/api/products/${productId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageConfig: {
              base64Image,
              originalImageUrl,
            }
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update product");
        }

        const product = await response.json();
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
      }
    };

    // Process all files concurrently
    await Promise.all(files.map(processFile));
    
    // Clear completed files after a delay
    setTimeout(() => {
      setProcessingFiles(prev => prev.filter(pf => pf.status !== 'completed'));
    }, 3000);
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

          {/* Processing Status */}
          {processingFiles.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="space-y-2">
                {/* Summary Stats */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium">Upload Progress</h3>
                    <div className="flex items-center gap-2 text-xs">
                      {(() => {
                        const { uploading, processing, completed, failed } = getFilesByStatus();
                        return (
                          <>
                            {uploading.length > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-muted-foreground">{uploading.length}</span>
                              </span>
                            )}
                            {processing.length > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-muted-foreground">{processing.length}</span>
                              </span>
                            )}
                            {completed.length > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-muted-foreground">{completed.length}</span>
                              </span>
                            )}
                            {failed.length > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                                <span className="text-muted-foreground">{failed.length}</span>
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </Button>
                </div>

                {/* Overall Progress */}
                {renderProgressBar(
                  processingFiles.filter(pf => pf.status === 'completed').length,
                  processingFiles.length,
                  'uploading'
                )}

                {/* Detailed Status */}
                {showDetails && (
                  <div className="mt-3 space-y-2">
                    {processingFiles.map((pf) => (
                      <div
                        key={pf.file.name}
                        className={cn(
                          "text-xs flex items-center gap-2",
                          pf.status === 'completed' && fadeToBackground
                        )}
                      >
                        <div className="flex-1 truncate">
                          {pf.file.name}
                        </div>
                        <div className="flex items-center gap-2">
                          {pf.status === 'uploading' && (
                            <Loader2 size={12} className="animate-spin" />
                          )}
                          {pf.status === 'processing' && (
                            <Loader2 size={12} className="animate-spin text-blue-500" />
                          )}
                          {pf.status === 'completed' && (
                            <span className="text-green-500">✓</span>
                          )}
                          {pf.status === 'failed' && (
                            <span className="text-red-500">✗</span>
                          )}
                          <span className={cn(
                            pf.status === 'completed' && "text-green-500",
                            pf.status === 'failed' && "text-red-500"
                          )}>
                            {pf.status === 'failed' ? 'Failed' :
                             pf.status === 'completed' ? 'Done' :
                             `${pf.progress}%`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}


