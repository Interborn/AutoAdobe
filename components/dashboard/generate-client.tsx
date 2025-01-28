"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ImageLibrary } from "@/components/dashboard/image-library";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Product } from "@/models/Product";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductGrid } from "@/components/dashboard/product-grid";

interface GenerateClientProps {
  initialProducts: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function GenerateClient({ initialProducts, pagination }: GenerateClientProps) {
  console.log("GenerateClient: Initial render", {
    initialProductCount: initialProducts.length,
    products: initialProducts.map(p => ({
      id: p._id.toString(),
      hasOriginalImages: !!(p.originalImages && p.originalImages.length > 0),
      originalImagesCount: p.originalImages?.length || 0,
      firstImageUrl: p.originalImages?.[0]?.url || null
    }))
  });

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [artStyle, setArtStyle] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<string>("");

  useEffect(() => {
    console.log("GenerateClient: Products state updated", {
      productCount: products.length,
      selectedCount: selectedIds.length,
      products: products.map(p => ({
        id: p._id.toString(),
        hasOriginalImages: !!(p.originalImages && p.originalImages.length > 0),
        originalImagesCount: p.originalImages?.length || 0,
        firstImageUrl: p.originalImages?.[0]?.url || null,
        isSelected: selectedIds.includes(p._id.toString())
      }))
    });
  }, [products, selectedIds]);

  const handleSelect = (productId: string) => {
    console.log("GenerateClient: Handling selection", {
      productId,
      currentlySelected: selectedIds.includes(productId)
    });

    setSelectedIds(prev => {
      const isSelected = prev.includes(productId);
      const newSelection = isSelected
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      console.log("GenerateClient: Selection updated", {
        previousSelection: prev,
        newSelection,
        action: isSelected ? "removed" : "added"
      });

      return newSelection;
    });
  };

  const handleGeneratePhotos = async () => {
    if (!selectedIds.length) {
      toast({
        variant: "destructive",
        title: "No images selected",
        description: "Please select at least one image from your library.",
      });
      return;
    }

    if (!artStyle || !aspectRatio) {
      toast({
        variant: "destructive",
        title: "Missing configuration",
        description: "Please select both art style and aspect ratio.",
      });
      return;
    }

    console.log("GenerateClient: Starting generation", {
      selectedIds,
      artStyle,
      aspectRatio
    });

    setIsGenerating(true);

    try {
      const response = await fetch("/api/products/batch", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds: selectedIds,
          action: "generatePhotos",
          imageConfig: {
            artStyle,
            aspectRatio,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate photos");
      }

      const updatedProducts: Product[] = await response.json();
      
      console.log("GenerateClient: Generation response", {
        updatedProductCount: updatedProducts.length,
        updatedProducts: updatedProducts.map(p => ({
          id: p._id.toString(),
          hasOriginalImages: !!(p.originalImages && p.originalImages.length > 0),
          originalImagesCount: p.originalImages?.length || 0
        }))
      });

      // Update the products in state
      setProducts(prev => {
        const productMap = new Map(updatedProducts.map(p => [p._id.toString(), p]));
        return prev.map(p => productMap.get(p._id.toString()) || p);
      });

      // Clear selection
      setSelectedIds([]);
      
      toast({
        title: "Generation started",
        description: `Started generating variations for ${selectedIds.length} image${selectedIds.length === 1 ? "" : "s"}.`,
      });
    } catch (error) {
      console.error("GenerateClient: Generation error", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate photos",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdate = async (updatedProduct: Product) => {
    const updatedProducts = products.map(p => 
      p._id.toString() === updatedProduct._id.toString() ? updatedProduct : p
    );
    setProducts(updatedProducts);
  };

  const handleDelete = async (productId: string) => {
    setProducts(products.filter(p => p._id.toString() !== productId));
    setSelectedIds(selectedIds.filter(id => id !== productId));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr,250px]">
        <ImageLibrary
          products={products}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />

        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Generation Options</h2>
              <p className="text-sm text-muted-foreground">
                Configure settings for generating variations.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Art Style</Label>
                <Select value={artStyle} onValueChange={setArtStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realistic">Realistic</SelectItem>
                    <SelectItem value="artistic">Artistic</SelectItem>
                    <SelectItem value="abstract">Abstract</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label>Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">Square (1:1)</SelectItem>
                    <SelectItem value="4:3">Standard (4:3)</SelectItem>
                    <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
                    <SelectItem value="3:2">Classic (3:2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="pt-2">
              <Button
                onClick={handleGeneratePhotos}
                disabled={isGenerating || !selectedIds.length || !artStyle || !aspectRatio}
                className="w-full"
              >
                {isGenerating ? "Generating..." : "Generate Variations"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Generated Photos</h2>
        </div>
        
        <ProductGrid
          products={products}
        />
      </div>
    </div>
  );
} 