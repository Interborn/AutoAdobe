import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { ProductGrid } from "@/components/dashboard/product-grid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ProductService } from "@/lib/services/product.service";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export default async function EnhancePage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const products = await ProductService.findByUserId(session.user.id, {
    stage: "enhance",
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Enhance</h1>
        <p className="text-muted-foreground">
          Enhance and optimize your generated images.
        </p>
      </div>
      <Separator />
      
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Enhancement Options</h2>
            <p className="text-sm text-muted-foreground">
              Configure image enhancement and optimization settings.
            </p>
          </div>
          
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Remove Subject</Label>
                <p className="text-sm text-muted-foreground">
                  Remove the main subject from the image
                </p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Remove Background</Label>
                <p className="text-sm text-muted-foreground">
                  Remove the background, keeping only the main subject
                </p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enhance Quality</Label>
                <p className="text-sm text-muted-foreground">
                  Improve image quality and resolution
                </p>
              </div>
              <Switch />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Compression</Label>
                <Switch />
              </div>
              <div className="pt-2">
                <Slider
                  defaultValue={[80]}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-muted-foreground">Quality</span>
                  <span className="text-sm text-muted-foreground">80%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
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
            Enhance Selected Images
          </Button>
        </div>
        
        <Suspense fallback={<div>Loading products...</div>}>
          <ProductGrid
            products={products.items}
            stage="enhance"
            onSelect={(id) => {}}
            selectedIds={[]}
            onAction={(product) => {}}
            actionLabel="Enhance Image"
          />
        </Suspense>
      </div>
    </div>
  );
}