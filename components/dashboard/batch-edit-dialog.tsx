import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
import { Loader2, Save, Trash2, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface BatchEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onContinue: () => void;
  onStay: () => void;
  onProductsChanged?: () => void;
}

export function BatchEditDialog({ 
  open, 
  onOpenChange, 
  products, 
  onContinue, 
  onStay,
  onProductsChanged 
}: BatchEditDialogProps) {
  const [batchName, setBatchName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editedPrompts, setEditedPrompts] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showDeleteBatchAlert, setShowDeleteBatchAlert] = useState(false);
  const [deletingProducts, setDeletingProducts] = useState<Set<string>>(new Set());

  const handleClose = () => {
    onStay();
    onOpenChange(false);
  };

  // Auto-select first product when dialog opens or when current selection is deleted
  useEffect(() => {
    if (open && products.length > 0 && (!selectedProduct || !products.find(p => p._id === selectedProduct._id))) {
      setSelectedProduct(products[0]);
    }
  }, [open, products, selectedProduct]);

  // Initialize batch name from first product
  useEffect(() => {
    if (products.length > 0 && !batchName) {
      setBatchName(products[0].batchName || "");
    }
  }, [products]);

  // Debounced auto-save
  useEffect(() => {
    const saveTimeout = setTimeout(async () => {
      if (Object.keys(editedPrompts).length === 0 && !batchName) return;
      
      setSaveStatus("saving");
      try {
        // Update batch name for all products if changed
        if (batchName) {
          const results = await Promise.allSettled(products.map(product => 
            fetch(`/api/products/${product._id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ batchName })
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
        if (onProductsChanged) {
          onProductsChanged();
        }
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
  }, [batchName, editedPrompts, products, onProductsChanged]);

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

      if (onProductsChanged) {
        onProductsChanged();
      }
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
    setIsSubmitting(true);

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

      if (onProductsChanged) {
        onProductsChanged();
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Batch delete error:', error);
      toast({
        variant: "destructive",
        title: "Error deleting batch",
        description: error instanceof Error ? error.message : "Failed to delete some or all products. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription>
              Edit batch information and descriptions before continuing.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="images" className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="images" className="flex-1">Individual Images ({products.length})</TabsTrigger>
              <TabsTrigger value="batch" className="flex-1">Batch Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="batch" className="flex-1 space-y-4 p-4">
              <div className="grid gap-6 max-w-2xl mx-auto">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="batchName">Batch Name</Label>
                    <Input
                      id="batchName"
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      placeholder="Enter a name for this batch"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Batch Summary</Label>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{products.length} images</Badge>
                      {batchName && <Badge>{batchName}</Badge>}
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      variant="destructive" 
                      onClick={() => setShowDeleteBatchAlert(true)}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Entire Batch
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="images" className="flex-1 flex flex-col min-h-0">
              <div className="grid grid-cols-[250px,1fr] gap-6 flex-1 min-h-0 p-1">
                <ScrollArea className="border rounded-lg">
                  <div className="p-2 grid grid-cols-2 gap-2">
                    {products.map(product => {
                      const isDeleting = deletingProducts.has(product._id.toString());
                      return (
                        <Card
                          key={product._id.toString()}
                          className={cn(
                            "cursor-pointer hover:bg-accent transition-colors overflow-hidden",
                            selectedProduct?._id === product._id && "bg-accent ring-2 ring-primary",
                            isDeleting && "opacity-50"
                          )}
                          onClick={() => !isDeleting && setSelectedProduct(product)}
                        >
                          <div className="relative aspect-square rounded-md overflow-hidden">
                            <Image
                              src={product.originalImages?.[0]?.url || ""}
                              alt={product.description || ""}
                              fill
                              className="object-cover hover:scale-105 transition-transform"
                            />
                            {isDeleting && (
                              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                                <Loader2 className="w-6 h-6 animate-spin" />
                              </div>
                            )}
                          </div>
                          <div className="text-[10px] truncate p-1">
                            {editedPrompts[product._id.toString()] || product.description || "No description yet"}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>

                <div className="space-y-4 min-h-0 flex flex-col">
                  {selectedProduct ? (
                    <>
                      <div className="flex justify-between items-start">
                        <div className="relative aspect-video rounded-lg overflow-hidden border flex-1">
                          <Image
                            src={selectedProduct.originalImages?.[0]?.url || ""}
                            alt={selectedProduct.description || ""}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="ml-2"
                          onClick={() => setShowDeleteAlert(true)}
                          disabled={deletingProducts.has(selectedProduct._id.toString())}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2 flex-1">
                        <Label className="text-lg">Description</Label>
                        <Textarea
                          value={editedPrompts[selectedProduct._id.toString()] || selectedProduct.description || ""}
                          onChange={(e) => handlePromptChange(selectedProduct._id.toString(), e.target.value)}
                          placeholder="Enter a description for this image"
                          className="flex-1 min-h-[200px] text-base"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Select an image to edit its description
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex min-w-full justify-between items-center border-t pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground w-full">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving changes...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Save className="h-4 w-4" />
                  <span>All changes saved</span>
                </>
              )}
              {saveStatus === "error" && (
                <span className="text-destructive">Connection error - retrying...</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Upload More Images
              </Button>
              <Button 
                onClick={onContinue} 
                disabled={isSubmitting || saveStatus === "saving"}
                className="min-w-[140px]"
              >
                Continue to Generate
              </Button>
            </div>
          </DialogFooter>
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
