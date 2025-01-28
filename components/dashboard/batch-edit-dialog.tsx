"use client";

import { useEffect, useState, useCallback, KeyboardEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Product } from "@/models/Product";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Loader2, Save, Trash2, AlertTriangle, ChevronLeft, ChevronRight, Copy, Check, Edit2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface BatchEditDialogProps {
  batchId: string;
  batchName?: string;
  products: Product[];
  onUpdate: (updatedProduct: Product) => void;
}

export function BatchEditDialog({ batchId, batchName, products, onUpdate }: BatchEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(batchName || "");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editedPrompts, setEditedPrompts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showDeleteBatchAlert, setShowDeleteBatchAlert] = useState(false);
  const [deletingProducts, setDeletingProducts] = useState<Set<string>>(new Set());
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update all products in the batch
      const updatedProducts = await Promise.all(
        products.map((product) =>
          fetch(`/api/products/${product._id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              batchName: name,
            }),
          }).then(res => res.json())
        )
      );

      updatedProducts.forEach(product => {
        if (product) {
          onUpdate(product);
        }
      });

      toast.success("Batch updated successfully");
      setOpen(false);
    } catch (error) {
      console.error("Failed to update batch:", error);
      toast.error("Failed to update batch");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-select first product when dialog opens or when current selection is deleted
  useEffect(() => {
    if (open && products.length > 0 && (!selectedProduct || !products.find(p => p._id === selectedProduct._id))) {
      setSelectedProduct(products[0]);
    }
  }, [open, products, selectedProduct]);

  // Initialize batch name from first product
  useEffect(() => {
    if (products.length > 0 && !name) {
      setName(products[0].batchName || "");
    }
  }, [products]);

  // Debounced auto-save
  useEffect(() => {
    const saveTimeout = setTimeout(async () => {
      if (Object.keys(editedPrompts).length === 0 && !name) return;
      
      setSaveStatus("saving");
      try {
        // Update batch name for all products if changed
        if (name) {
          const results = await Promise.allSettled(products.map(product => 
            fetch(`/api/products/${product._id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ batchName: name })
            })
          ));

          // Check if any requests failed
          const failures = results.filter(r => r.status === 'rejected');
          if (failures.length > 0) {
            throw new Error(`Failed to update batch name for ${failures.length} products`);
          }
        }

        // Update individual product descriptions
        const results = await Promise.allSettled(
          Object.entries(editedPrompts).map(([productId, description]) =>
            fetch(`/api/products/${productId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ description })
            })
          )
        );

        // Check if any requests failed
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
          throw new Error(`Failed to update descriptions for ${failures.length} products`);
        }

        setSaveStatus("saved");
      } catch (error) {
        console.error('Save error:', error);
        setSaveStatus("error");
        toast({
          variant: "destructive",
          title: "Error saving changes",
          description: error instanceof Error ? error.message : "Your changes will be saved automatically when connection is restored."
        });
      }
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [name, editedPrompts, products]);

  const handlePromptChange = (productId: string, prompt: string) => {
    setEditedPrompts(prev => ({
      ...prev,
      [productId]: prompt
    }));
    setSaveStatus("saving");
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    setShowDeleteAlert(false);
    const productId = selectedProduct._id.toString();
    setDeletingProducts(prev => new Set(prev).add(productId));

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete product");
      }

      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted."
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        variant: "destructive",
        title: "Error deleting product",
        description: error instanceof Error ? error.message : "Failed to delete the product. Please try again."
      });
    } finally {
      setDeletingProducts(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleDeleteBatch = async () => {
    setShowDeleteBatchAlert(false);
    setIsLoading(true);

    try {
      const results = await Promise.allSettled(products.map(product => 
        fetch(`/api/products/${product._id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" }
        })
      ));

      // Check if any requests failed
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        throw new Error(`Failed to delete ${failures.length} products`);
      }

      toast({
        title: "Batch deleted",
        description: "All products in the batch have been deleted."
      });

      onUpdate(products[0]);
      setOpen(false);
    } catch (error) {
      console.error('Batch delete error:', error);
      toast({
        variant: "destructive",
        title: "Error deleting batch",
        description: error instanceof Error ? error.message : "Failed to delete some or all products. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedProduct) return;

    const currentIndex = products.findIndex(p => p._id === selectedProduct._id);
    if (currentIndex === -1) return;

    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : products.length - 1;
      setSelectedProduct(products[prevIndex]);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < products.length - 1 ? currentIndex + 1 : 0;
      setSelectedProduct(products[nextIndex]);
    }
  }, [selectedProduct, products]);

  const handleCopyPrompt = useCallback(() => {
    if (!selectedProduct) return;
    const prompt = editedPrompts[selectedProduct._id.toString()] || selectedProduct.description || "";
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(selectedProduct._id.toString());
    setTimeout(() => setCopiedPrompt(null), 2000);
  }, [selectedProduct, editedPrompts]);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[85vw] h-[85vh] p-0">
          <div className="flex h-full bg-background">
            {/* Main Image View */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="px-6 h-14 border-b flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold">Edit Batch</h2>
                  <div className="flex items-center gap-3">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter batch name"
                      className="h-9 w-[240px] text-sm"
                    />
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {products.length} {products.length === 1 ? 'image' : 'images'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {saveStatus === "saving" && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Saving changes...</span>
                    </div>
                  )}
                  {saveStatus === "saved" && (
                    <div className="flex items-center gap-1.5 text-xs text-green-500">
                      <Save className="h-3 w-3" />
                      <span>All changes saved</span>
                    </div>
                  )}
                  {saveStatus === "error" && (
                    <div className="flex items-center gap-1.5 text-xs text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Failed to save</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedProduct ? (
                <div className="flex-1 flex flex-col p-6 min-h-0 bg-muted/5">
                  <div className="relative flex-[0.7] mb-4 rounded-lg border bg-background shadow-sm">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const currentIndex = products.findIndex(p => p._id === selectedProduct._id);
                        const prevIndex = currentIndex > 0 ? currentIndex - 1 : products.length - 1;
                        setSelectedProduct(products[prevIndex]);
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/90 hover:bg-background shadow-sm border z-10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Image
                      src={selectedProduct.originalImages?.[0]?.url || ""}
                      alt={selectedProduct.description || ""}
                      fill
                      className="object-contain rounded-lg"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const currentIndex = products.findIndex(p => p._id === selectedProduct._id);
                        const nextIndex = currentIndex < products.length - 1 ? currentIndex + 1 : 0;
                        setSelectedProduct(products[nextIndex]);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/90 hover:bg-background shadow-sm border z-10"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-2 py-1 rounded-md bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 border shadow-sm">
                      <span className="text-xs font-medium">
                        {products.indexOf(selectedProduct) + 1} of {products.length}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyPrompt}
                        className="h-7 px-2 text-xs bg-background/90 hover:bg-background shadow-sm"
                      >
                        {copiedPrompt === selectedProduct._id.toString() ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteAlert(true)}
                        disabled={deletingProducts.has(selectedProduct._id.toString())}
                        className="h-7 px-2 text-xs bg-destructive/90 hover:bg-destructive shadow-sm"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={editedPrompts[selectedProduct._id.toString()] || selectedProduct.description || ""}
                    onChange={(e) => handlePromptChange(selectedProduct._id.toString(), e.target.value)}
                    placeholder="Enter a description for this image"
                    className="flex-[0.3] text-sm resize-none bg-background shadow-sm"
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/5">
                  Select an image to edit
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            <div className="w-[280px] flex flex-col border-l bg-muted/5">
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 gap-2 p-3">
                  {products.map(product => {
                    const isDeleting = deletingProducts.has(product._id.toString());
                    const isSelected = selectedProduct?._id === product._id;
                    return (
                      <Card
                        key={product._id.toString()}
                        className={cn(
                          "cursor-pointer hover:bg-accent transition-colors overflow-hidden border shadow-sm",
                          isSelected && "ring-2 ring-primary bg-accent",
                          isDeleting && "opacity-50"
                        )}
                        onClick={() => !isDeleting && setSelectedProduct(product)}
                      >
                        <div className="relative aspect-video">
                          <Image
                            src={product.originalImages?.[0]?.url || ""}
                            alt={product.description || ""}
                            fill
                            className="object-cover"
                          />
                          {isDeleting && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                              <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
                          <p className="text-xs text-muted-foreground truncate">
                            {editedPrompts[product._id.toString()] || product.description || "No description"}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
              <div className="p-3 bg-background border-t">
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setShowDeleteBatchAlert(true)}
                    disabled={isLoading}
                    className="text-xs gap-1.5 col-span-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete All
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isLoading || saveStatus === "saving"}
                    size="sm"
                    className="text-xs gap-1.5"
                  >
                    {isLoading ? "Deleting..." : "Delete All"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteBatchAlert} onOpenChange={setShowDeleteBatchAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entire Batch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all {products.length} products in this batch? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBatch} className="bg-destructive hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 
