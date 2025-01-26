import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ProductService } from "@/lib/services/product.service";
import { GenerateClient } from "@/components/dashboard/generate-client";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function GeneratePage() {
  const session = await getServerSession(authOptions);
  
  console.log("Session data:", {
    exists: !!session,
    user: session?.user,
    userId: session?.user?.id
  });
  
  if (!session?.user?.id) {
    redirect("/signin");
  }

  // Get user's products from the users collection
  const db = await getDb();
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(session.user.id) },
    { projection: { products: 1 } }
  );
  
  console.log("User data:", {
    exists: !!user,
    hasProducts: !!user?.products,
    productCount: user?.products?.length,
    productIds: user?.products?.map(id => id.toString())
  });

  // Fetch all products referenced in user.products
  const products = user?.products 
    ? await ProductService.findByIds(user.products.map(id => id.toString()))
    : [];

  console.log("Products data:", {
    count: products.length,
    productsWithImages: products.filter(p => p.originalImages && p.originalImages.length > 0).length,
    products: products.map(p => ({
      id: p._id.toString(),
      hasOriginalImages: !!(p.originalImages && p.originalImages.length > 0),
      originalImagesCount: p.originalImages?.length || 0,
      firstImageUrl: p.originalImages?.[0]?.url || null
    }))
  });

  // Filter out products without images
  const productsWithImages = products.filter(
    product => product.originalImages && product.originalImages.length > 0
  );

  console.log("Filtered products data:", {
    count: productsWithImages.length,
    products: productsWithImages.map(p => ({
      id: p._id.toString(),
      originalImagesCount: p.originalImages?.length || 0,
      firstImageUrl: p.originalImages?.[0]?.url || null
    }))
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate</h1>
        <p className="text-muted-foreground">
          Generate high-quality images from prompts.
        </p>
      </div>
      <Separator />
      
      <Suspense fallback={<div>Loading...</div>}>
        <GenerateClient
          initialProducts={productsWithImages}
          pagination={{
            total: productsWithImages.length,
            page: 1,
            limit: productsWithImages.length,
            totalPages: 1
          }}
        />
      </Suspense>
    </div>
  );
}