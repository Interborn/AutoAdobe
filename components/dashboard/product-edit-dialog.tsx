"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Product } from "@/models/Product";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ProductEditDialogProps {
  product: Product;
  onUpdate: (updatedProduct: Product) => void;
  onDelete: (productId: string) => void;
}

export function ProductEditDialog({ product, onUpdate, onDelete }: ProductEditDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState(product.description || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/products/${product._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      const updatedProduct = await response.json();
      toast({
        title: "Success",
        description: "Product updated successfully"
      });
      onUpdate(updatedProduct);
      setOpen(false);
    } catch (error) {
      console.error("Failed to update product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update product"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/products/${product._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      toast({
        title: "Success",
        description: "Product deleted successfully"
      });
      onDelete(product._id.toString());
      setOpen(false);
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete product"
      });
    } finally {
      setIsLoading(false);
      setShowDeleteAlert(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}>
            <Edit2 className="h-4 w-4" />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product {product.productId}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter product description"
                rows={4}
              />
            </div>
            <div className="flex justify-between">
              <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className={cn(buttonVariants({ variant: "destructive" }), "gap-2")}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Product</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this product? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="flex space-x-2">
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "outline" }))}
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={buttonVariants()}
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 

