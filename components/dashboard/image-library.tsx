"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Product } from "@/models/Product";

interface ImageLibraryProps {
  products: Product[];
  selectedIds: string[];
  onSelect: (productId: string) => void;
}

export function ImageLibrary({ products, selectedIds, onSelect }: ImageLibraryProps) {
  useEffect(() => {
    console.log("ImageLibrary: Received props", {
      productCount: products.length,
      selectedCount: selectedIds.length,
      products: products.map(p => ({
        id: p._id.toString(),
        hasOriginalImages: !!(p.originalImages && p.originalImages.length > 0),
        hasImageConfig: !!p.imageConfig?.originalImageUrl,
        originalImagesCount: p.originalImages?.length || 0,
        firstImageUrl: p.originalImages?.[0]?.url || p.imageConfig?.originalImageUrl || null
      }))
    });
  }, [products, selectedIds]);

  // Filter products that have original images or image config
  const productsWithImages = products.filter(
    (product) => 
      (product.originalImages && product.originalImages.length > 0) ||
      product.imageConfig?.originalImageUrl ||
      product.imageConfig?.base64Image
  );

  console.log("ImageLibrary: Filtered products", {
    beforeCount: products.length,
    afterCount: productsWithImages.length,
    filteredProducts: productsWithImages.map(p => ({
      id: p._id.toString(),
      hasOriginalImages: !!(p.originalImages && p.originalImages.length > 0),
      hasImageConfig: !!p.imageConfig?.originalImageUrl,
      hasBase64: !!p.imageConfig?.base64Image,
      imageUrl: p.originalImages?.[0]?.url || p.imageConfig?.originalImageUrl || null
    }))
  });

  const getImageUrl = (product: Product): string | null => {
    if (product.originalImages && product.originalImages.length > 0) {
      return product.originalImages[0].url;
    }
    if (product.imageConfig?.originalImageUrl) {
      return product.imageConfig.originalImageUrl;
    }
    if (product.imageConfig?.base64Image) {
      return `data:image/jpeg;base64,${product.imageConfig.base64Image}`;
    }
    return null;
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Image Library</h3>
            <p className="text-sm text-muted-foreground">
              Select images to generate variations
            </p>
          </div>
          <Badge variant="secondary">
            {selectedIds.length} of {productsWithImages.length} selected
          </Badge>
        </div>

        <ScrollArea className="h-[600px] pr-4">
          <div className={
            productsWithImages.length <= 8 ? "grid grid-cols-4 gap-4" :
            productsWithImages.length <= 18 ? "grid grid-cols-6 gap-4" :
            productsWithImages.length <= 32 ? "grid grid-cols-8 gap-4" :
            "grid grid-cols-10 gap-4"
          }>
            {productsWithImages.map((product) => {
              const imageUrl = getImageUrl(product);
              
              console.log("ImageLibrary: Rendering product", {
                id: product._id.toString(),
                hasOriginalImages: !!(product.originalImages && product.originalImages.length > 0),
                hasImageConfig: !!product.imageConfig?.originalImageUrl,
                hasBase64: !!product.imageConfig?.base64Image,
                imageUrl,
                isSelected: selectedIds.includes(product._id.toString())
              });

              if (!imageUrl) return null;

              return (
                <div
                  key={product._id.toString()}
                  className={cn(
                    "group relative aspect-square cursor-pointer overflow-hidden rounded-lg border",
                    selectedIds.includes(product._id.toString())
                      ? "border-primary ring-2 ring-primary"
                      : "border-muted hover:border-primary"
                  )}
                  onClick={() => onSelect(product._id.toString())}
                >
                  <Image
                    src={imageUrl}
                    alt={product.description || "Product image"}
                    fill
                    className="object-cover transition-all group-hover:scale-105"
                    onError={(e) => {
                      console.error("ImageLibrary: Image failed to load", {
                        productId: product._id.toString(),
                        imageUrl
                      });
                    }}
                  />
                  <div className="absolute top-2 left-2 z-10">
                    <Badge variant="outline" className="bg-background/80">
                      {product.productId || product._id.toString().slice(-6)}
                    </Badge>
                  </div>
                  {product.description && (
                    <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-2 text-xs opacity-0 transition-opacity group-hover:opacity-100">
                      {product.description}
                    </div>
                  )}
                  {selectedIds.includes(product._id.toString()) && (
                    <div className="absolute inset-0 bg-primary/20" />
                  )}
                </div>
              );
            })}

            {productsWithImages.length === 0 && (
              <div className="col-span-2 text-center text-sm text-muted-foreground py-8">
                No images available in your library
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
} 