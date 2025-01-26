import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { ProductGrid } from "@/components/dashboard/product-grid";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductService } from "@/lib/services/product.service";
import { PromptsForm } from "@/components/dashboard/prompts-form";
import { Product } from "@/models/Product";
import { PromptsClient } from "@/components/dashboard/prompts-client";

export default async function PromptsPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const { items: initialProducts, ...pagination } = await ProductService.findByUserId(session.user.id, {
    stage: "prompts",
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Prompts</h1>
        <p className="text-muted-foreground">
          Upload images and generate prompts for your products.
        </p>
      </div>
      <Separator />
      
      <Suspense fallback={<div>Loading...</div>}>
        <PromptsClient
          initialProducts={initialProducts}
          pagination={pagination}
        />
      </Suspense>
    </div>
  );
}