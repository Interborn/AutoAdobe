"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/models/Product";
import { ImageLibrary } from "./image-library";
import { BatchLibrary } from "./batch-library";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, ImagePlus, Grid, List } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LibraryClientProps {
  initialProducts: Product[];
  userId: string;
}

export function LibraryClient({ initialProducts, userId }: LibraryClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [processedFiles, setProcessedFiles] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    setTotalFiles(acceptedFiles.length);
    setProcessedFiles(0);
    setUploadProgress(0);

    try {
      // Get a new batch ID from the server
      const batchResponse = await fetch("/api/products/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!batchResponse.ok) {
        throw new Error("Failed to create batch");
      }

      const { batchId } = await batchResponse.json();

      // Upload files with the batch ID
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", userId);
        formData.append("batchId", batchId);

        const response = await fetch("/api/products/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const product = await response.json();
        setProducts((prev) => [...prev, product]);
        setProcessedFiles((prev) => prev + 1);
        setUploadProgress((prev) => (prev + (100 / acceptedFiles.length)));
      }

      toast.success(`Successfully uploaded ${acceptedFiles.length} images`);
      router.refresh();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload some images");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setTotalFiles(0);
      setProcessedFiles(0);
    }
  }, [userId, router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"]
    },
    multiple: true
  });

  const handleGeneratePrompts = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    try {
      toast.loading("Generating prompts...", { id: "generate-prompts" });

      const response = await fetch("/api/products/generate-prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productIds: selectedIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate prompts");
      }

      const result = await response.json();
      
      // Update local state with new descriptions
      if (result.updatedProducts) {
        setProducts(prevProducts => 
          prevProducts.map(product => {
            const updatedProduct = result.updatedProducts.find(
              (p: Product) => p._id.toString() === product._id.toString()
            );
            return updatedProduct || product;
          })
        );
      }
      
      toast.success(result.message, { id: "generate-prompts" });
      setSelectedIds([]);
    } catch (error: any) {
      console.error("Generate prompts error:", error);
      toast.error(error.message || "Failed to generate prompts", { id: "generate-prompts" });
    }
  };

  const handleSelect = (productId: string) => {
    setSelectedIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleProductUpdate = useCallback((updatedProduct: Product) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product._id.toString() === updatedProduct._id.toString()
          ? updatedProduct
          : product
      )
    );
  }, []);

  const handleProductDelete = useCallback((productId: string) => {
    setProducts(prevProducts =>
      prevProducts.filter(product => product._id.toString() !== productId)
    );
  }, []);

  const handleUpdate = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          {isDragActive ? (
            <p className="mt-2">Drop the images here ...</p>
          ) : (
            <p className="mt-2">Drag & drop images here, or click to select files</p>
          )}
        </div>
        {isUploading && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading {processedFiles} of {totalFiles} files...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          variant="default"
          onClick={handleGeneratePrompts}
          disabled={selectedIds.length === 0}
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          Generate Prompts ({selectedIds.length})
        </Button>
      </div>

      <Tabs defaultValue="grid">
        <TabsList className="mb-4">
          <TabsTrigger value="grid">
            <Grid className="h-4 w-4 mr-2" />
            Grid View
          </TabsTrigger>
          <TabsTrigger value="batch">
            <List className="h-4 w-4 mr-2" />
            Batch View
          </TabsTrigger>
        </TabsList>
        <TabsContent value="grid">
          <ImageLibrary
            products={products}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onUpdate={handleProductUpdate}
            onDelete={handleProductDelete}
          />
        </TabsContent>
        <TabsContent value="batch">
          <BatchLibrary
            products={products}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onUpdate={handleProductUpdate}
            onDelete={handleProductDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 

