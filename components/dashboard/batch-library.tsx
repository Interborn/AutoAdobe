"use client";

import { Product } from "@/models/Product";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";
import { BatchEditDialog } from "./batch-edit-dialog";
import { ProductEditDialog } from "./product-edit-dialog";

interface BatchLibraryProps {
  products: Product[];
  selectedIds: string[];
  onSelect: (productId: string) => void;
  onUpdate: (updatedProduct: Product) => void;
  onDelete: (productId: string) => void;
}

interface BatchGroup {
  batchId: string;
  batchName?: string;
  products: Product[];
  createdAt: Date;
}

export function BatchLibrary({ products, selectedIds, onSelect, onUpdate, onDelete }: BatchLibraryProps) {
  // Group products by batch
  const batches = products.reduce((acc: Record<string, BatchGroup>, product) => {
    const batchId = product.batchId || 'ungrouped';
    if (!acc[batchId]) {
      acc[batchId] = {
        batchId,
        batchName: product.batchName,
        products: [],
        createdAt: new Date(product.createdAt),
      };
    }
    acc[batchId].products.push(product);
    return acc;
  }, {});

  // Sort batches by creation date (newest first)
  const sortedBatches = Object.values(batches).sort((a, b) => 
    b.createdAt.getTime() - a.createdAt.getTime()
  );

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
            <h3 className="font-medium">Batches</h3>
            <p className="text-sm text-muted-foreground">
              View images grouped by upload batch
            </p>
          </div>
          <Badge variant="secondary">
            {selectedIds.length} of {products.length} selected
          </Badge>
        </div>

        <ScrollArea className="h-[600px] pr-4">
          <Accordion type="multiple" className="space-y-4">
            {sortedBatches.map((batch) => (
              <AccordionItem
                key={batch.batchId}
                value={batch.batchId}
                className="border rounded-lg"
              >
                <AccordionTrigger className="px-4">
                  <div className="flex items-center gap-4">
                    <BatchEditDialog
                      batchId={batch.batchId}
                      batchName={batch.batchName}
                      products={batch.products}
                      onUpdate={onUpdate}
                    />
                    <span className="font-medium">
                      {batch.batchName || `Batch ${batch.batchId}`}
                    </span>
                    <Badge variant="outline">
                      {batch.products.length} images
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(batch.createdAt, "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-4 gap-4">
                    {batch.products.map((product) => {
                      const imageUrl = getImageUrl(product);
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
                        >
                          <div
                            className="absolute inset-0"
                            onClick={() => onSelect(product._id.toString())}
                          >
                            <Image
                              src={imageUrl}
                              alt={product.description || "Product image"}
                              fill
                              className="object-cover transition-all group-hover:scale-105"
                            />
                          </div>
                          <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between">
                            <Badge variant="outline" className="bg-background/80">
                              {product.productId}
                            </Badge>
                            <ProductEditDialog
                              product={product}
                              onUpdate={onUpdate}
                              onDelete={onDelete}
                            />
                          </div>
                          {product.description && (
                            <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-2 text-xs opacity-0 transition-opacity group-hover:opacity-100">
                              <div className="line-clamp-3">
                                {product.description}
                              </div>
                            </div>
                          )}
                          {selectedIds.includes(product._id.toString()) && (
                            <div className="absolute inset-0 bg-primary/20" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </div>
    </Card>
  );
} 
