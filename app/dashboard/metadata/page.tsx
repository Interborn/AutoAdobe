import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { ProductGrid } from "@/components/dashboard/product-grid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ProductService } from "@/lib/services/product.service";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default async function MetadataPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const products = await ProductService.findByUserId(session.user.id, {
    stage: "metadata",
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Metadata</h1>
        <p className="text-muted-foreground">
          Manage metadata and prepare for Adobe Stock submission.
        </p>
      </div>
      <Separator />
      
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Metadata Template</h2>
            <p className="text-sm text-muted-foreground">
              Configure default metadata for selected products.
            </p>
          </div>
          
          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter a descriptive title" />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nature">Nature</SelectItem>
                    <SelectItem value="people">People</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter a detailed description"
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Enter tags separated by commas"
              />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Content Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="illustration">Illustration</SelectItem>
                    <SelectItem value="vector">Vector</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Editorial Usage</Label>
                  <p className="text-sm text-muted-foreground">
                    Mark as editorial content
                  </p>
                </div>
                <Switch />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Release Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between">
                  <Label>Model Release</Label>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Property Release</Label>
                  <Switch />
                </div>
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Price</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount"
                    className="w-32"
                  />
                  <Select defaultValue="usd">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="gbp">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline">
              Export Selected to CSV
            </Button>
            <Button>
              Apply to Selected
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Products</h2>
          <Button variant="outline">
            Generate Metadata
          </Button>
        </div>
        
        <Suspense fallback={<div>Loading products...</div>}>
          <ProductGrid
            products={products.items}
            stage="metadata"
            onSelect={(id) => {}}
            selectedIds={[]}
            onAction={(product) => {}}
            actionLabel="Edit Metadata"
          />
        </Suspense>
      </div>
    </div>
  );
}