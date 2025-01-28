"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProductGrid } from "@/components/dashboard/product-grid";
import { PromptsForm } from "@/components/dashboard/prompts-form";
import { BatchStatus } from "@/components/dashboard/batch-status";
import { Product } from "@/models/Product";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { BatchEditDialog } from "./batch-edit-dialog";

interface PromptsClientProps {
  initialProducts: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface BatchState {
  id: string | null;
  name: string;
  products: Product[];
}

export function PromptsClient({ initialProducts, pagination }: PromptsClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(pagination.total > initialProducts.length);
  const [processingCount, setProcessingCount] = useState(0);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batch, setBatch] = useState<BatchState>({
    id: null,
    name: "",
    products: []
  });

  // Reset batch when component mounts
  useEffect(() => {
    setBatch({ id: null, name: "", products: [] });
  }, []);

  // Update batch products whenever products change
  useEffect(() => {
    if (batch.id) {
      const batchProducts = products.filter(p => p.batchId === batch.id);
      setBatch(prev => ({ ...prev, products: batchProducts }));
    }
  }, [products, batch.id]);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/products?page=1&limit=${pagination.limit}`);
      if (!response.ok) throw new Error('Failed to refresh data');
      const data = await response.json();
      setProducts(data.items);
      setPage(1);
      setHasMore(data.items.length < data.total);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh data"
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.limit]);

  const handleProductsCreated = useCallback((newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
  }, []);

  const handleBatchComplete = useCallback(() => {
    if (batch.products.length > 0) {
      setShowBatchDialog(true);
    }
  }, [batch.products.length]);

  const handleProcessingCountChange = useCallback((count: number) => {
    setProcessingCount(count);
    if (count === 0 && processingCount > 0) {
      handleBatchComplete();
    }
  }, [processingCount, handleBatchComplete]);

  const handleLoadMore = useCallback(async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const nextPage = page + 1;
      const response = await fetch(`/api/products?page=${nextPage}&limit=${pagination.limit}`);
      
      if (!response.ok) {
        throw new Error("Failed to load more products");
      }

      const data = await response.json();
      
      if (data.items.length === 0) {
        setHasMore(false);
        return;
      }

      setProducts(prev => [...prev, ...data.items]);
      setPage(nextPage);
      setHasMore(data.items.length === pagination.limit);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load more products",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, page, pagination.limit]);

  const handleContinueToGenerate = useCallback(() => {
    setShowBatchDialog(false);
    setBatch({ id: null, name: "", products: [] });
    router.push('/dashboard/generate');
  }, [router]);

  const handleStayAndUpload = useCallback(() => {
    setShowBatchDialog(false);
  }, []);

  const handleBatchNameChange = useCallback((name: string) => {
    setBatch(prev => ({ ...prev, name }));
  }, []);

  const handleBatchIdCreated = useCallback((id: string) => {
    setBatch(prev => ({ ...prev, id }));
  }, []);

  const handleEditBatch = useCallback(() => {
    if (batch.id && batch.products.length > 0) {
      setShowBatchDialog(true);
    } else {
      toast({
        title: "No active batch",
        description: "There is no active batch to edit.",
        variant: "destructive",
      });
    }
  }, [batch.id, batch.products.length]);

  const handleProductUpdate = useCallback((updatedProduct: Product) => {
    setProducts(prev => prev.map(p => 
      p._id.toString() === updatedProduct._id.toString() ? updatedProduct : p
    ));
  }, []);

  return (
    <div className="space-y-6">
      <PromptsForm 
        onProductsCreated={handleProductsCreated} 
        onProcessingCountChange={handleProcessingCountChange}
        sessionBatchId={batch.id}
        sessionBatchName={batch.name}
        onBatchNameChange={handleBatchNameChange}
        onBatchIdCreated={handleBatchIdCreated}
      />

      <BatchStatus
        batchId={batch.id}
        batchName={batch.name}
        itemCount={batch.products.length}
        onEditBatch={handleEditBatch}
      />

      <div className="space-y-4">
        <ProductGrid
          products={products}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          processingCount={processingCount}
        />
      </div>

      {batch.id && (
        <BatchEditDialog
          batchId={batch.id}
          batchName={batch.name}
          products={batch.products}
          onUpdate={handleProductUpdate}
        />
      )}
    </div>
  );
} 