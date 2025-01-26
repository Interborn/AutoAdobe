import { Product } from "@/models/Product";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Standard aspect ratios
const ASPECT_RATIOS = [
  { name: "1:1", value: 1 },
  { name: "3:2", value: 1.5 },
  { name: "4:3", value: 1.333 },
  { name: "16:9", value: 1.778 }
] as const;

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  processingCount?: number;
  onSelect?: (id: string) => void;
  selectedIds?: string[];
  onAction?: (product: Product) => void;
  actionLabel?: string;
}

function ProductSkeleton() {
  return (
    <Card className="group relative overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative bg-muted">
          <div className="relative w-full" style={{ paddingTop: "100%" }}>
            <Skeleton className="absolute inset-0" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-full" /> {/* Description */}
          <Skeleton className="h-3 w-24" /> {/* Created time */}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductGrid({
  products,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  processingCount = 0,
  onSelect,
  selectedIds = [],
  onAction,
  actionLabel,
}: ProductGridProps) {
  const getDisplayAsset = (product: Product) => {
    if (product.originalImages?.[0]) {
      const image = product.originalImages[0];
      if (image.url) {
        return image.url;
      }
      if (image.base64Image) {
        return `data:${image.mimeType || 'image/jpeg'};base64,${image.base64Image}`;
      }
    }
    return null;
  };

  const getClosestAspectRatio = (width: number, height: number) => {
    if (!width || !height) return ASPECT_RATIOS[0];
    const targetRatio = width / height;
    let closestRatio = ASPECT_RATIOS[0];
    let minDiff = Math.abs(targetRatio - ASPECT_RATIOS[0].value);

    for (const ratio of ASPECT_RATIOS) {
      const diff = Math.abs(targetRatio - ratio.value);
      if (diff < minDiff) {
        minDiff = diff;
        closestRatio = ratio as typeof ASPECT_RATIOS[0];
      }
    }

    return closestRatio;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Processing Skeletons */}
        {processingCount > 0 && Array.from({ length: processingCount }).map((_, index) => (
          <ProductSkeleton key={`processing-${index}`} />
        ))}

        {/* Actual Products */}
        {products.map(product => {
          const assetUrl = getDisplayAsset(product);
          const isSelected = selectedIds.includes(product._id.toString());

          return (
            <Card 
              key={product._id.toString()} 
              className={cn(
                "group relative overflow-hidden transition-all duration-200 hover:shadow-lg h-[32rem] flex flex-col",
                isSelected && "ring-2 ring-primary",
                onSelect && "cursor-pointer"
              )}
              onClick={() => onSelect?.(product._id.toString())}
            >
              <CardHeader className="p-0 flex-none">
                <div className="relative bg-muted">
                  {assetUrl && (
                    <div className="relative w-full" style={{ paddingTop: `${(1 / ASPECT_RATIOS[0].value) * 100}%` }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-pulse bg-muted-foreground/10 w-full h-full" />
                      </div>
                      <Image
                        src={assetUrl}
                        alt={`Product ${product.productId}`}
                        fill
                        className="object-cover transition-opacity duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        loading="lazy"
                        onError={(e) => {
                          console.error('Image failed to load:', assetUrl);
                          const img = e.currentTarget;
                          img.style.display = 'none';
                          const parent = img.parentElement;
                          if (parent) {
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'absolute inset-0 flex items-center justify-center bg-destructive/10 text-destructive text-sm p-2 text-center';
                            errorDiv.textContent = 'Failed to load image';
                            parent.appendChild(errorDiv);
                          }
                        }}
                        onLoad={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.style.opacity = '1';
                          const ratio = getClosestAspectRatio(img.naturalWidth, img.naturalHeight);
                          const container = img.parentElement;
                          if (container) {
                            container.style.paddingTop = `${(1 / ratio.value) * 100}%`;
                          }
                        }}
                        style={{ opacity: 0 }}
                      />
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 flex-1 min-h-0 flex flex-col">
                <div className="space-y-3 flex-1 min-h-0 flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap flex-none">
                    <Badge variant="outline" className="font-mono">
                      {product.productId}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 flex-none">
                    <Badge 
                      variant="outline" 
                      className="font-mono text-xs"
                    >
                      {product.batchId || "No Batch"}
                    </Badge>
                    {product.batchName && (
                      <span className="text-sm text-muted-foreground truncate">
                        {product.batchName}
                      </span>
                    )}
                  </div>

                  {product.description && (
                    <div className="text-sm text-muted-foreground overflow-y-auto flex-1 min-h-0">
                      {product.description}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div className="h-1" />
      )}
    </div>
  );
} 