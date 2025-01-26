"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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

export function PromptsClient({ initialProducts, pagination }: PromptsClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [processingCount, setProcessingCount] = useState(0);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<Product[]>([]);
  const [sessionBatchId, setSessionBatchId] = useState<string | null>(null);
  const [sessionBatchName, setSessionBatchName] = useState<string>("");

  // Reset batch ID when component mounts (i.e., when user returns to page)
  useEffect(() => {
    setSessionBatchId(null);
    setSessionBatchName("");
    setCurrentBatch([]);
  }, []);

  // Update current batch whenever products change
  useEffect(() => {
    if (sessionBatchId) {
      const batchProducts = products.filter(p => p.batchId === sessionBatchId);
      setCurrentBatch(batchProducts);
    }
  }, [products, sessionBatchId]);

  const refreshData = async () => {
    try {
      const response = await fetch(`/api/products?stage=prompts&page=1&limit=${pagination.limit}`);
      if (!response.ok) throw new Error('Failed to refresh data');
      const data = await response.json();
      setProducts(data.items);
      setPage(1);
      setHasMore(data.items.length < data.total);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const handleProductsCreated = async (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
  };

  const handleBatchComplete = () => {
    if (currentBatch.length > 0) {
      setShowBatchDialog(true);
    }
  };

  const handleProcessingCountChange = (count: number) => {
    setProcessingCount(count);
    if (count === 0 && processingCount > 0) {
      handleBatchComplete();
    }
  };

  const handleLoadMore = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(`/api/products?stage=prompts&page=${nextPage}&limit=12`);
      
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
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load more products",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToGenerate = () => {
    setShowBatchDialog(false);
    setSessionBatchId(null);
    setSessionBatchName("");
    setCurrentBatch([]);
    router.push('/dashboard/generate');
  };

  const handleStayAndUpload = () => {
    setShowBatchDialog(false);
  };

  const handleBatchNameChange = (name: string) => {
    setSessionBatchName(name);
  };

  const handleEditBatch = () => {
    if (sessionBatchId && currentBatch.length > 0) {
      setShowBatchDialog(true);
    } else {
      toast({
        title: "No active batch",
        description: "There is no active batch to edit.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PromptsForm 
        onProductsCreated={handleProductsCreated} 
        onProcessingCountChange={handleProcessingCountChange}
        sessionBatchId={sessionBatchId}
        sessionBatchName={sessionBatchName}
        onBatchNameChange={handleBatchNameChange}
        onBatchIdCreated={setSessionBatchId}
      />

      <BatchStatus
        batchId={sessionBatchId}
        batchName={sessionBatchName}
        itemCount={currentBatch.length}
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

      <BatchEditDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        products={currentBatch}
        onContinue={handleContinueToGenerate}
        onStay={handleStayAndUpload}
      />
    </div>
  );
} 