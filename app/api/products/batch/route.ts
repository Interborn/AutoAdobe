import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api-handler";
import { ProductService } from "@/lib/services/product.service";

const batchUpdateSchema = z.object({
  batchId: z.string(),
  updates: z.object({
    stage: z.enum(["prompts", "generate", "enhance", "metadata"]).optional(),
    status: z.enum(["draft", "processing", "completed", "failed"]).optional(),
    imageConfig: z.object({
      aspectRatio: z.string(),
      artStyle: z.string(),
      quality: z.enum(["low", "medium", "high"]),
      format: z.enum(["jpg", "png", "webp"]),
    }).optional(),
    enhancementOptions: z.object({
      removeSubject: z.boolean(),
      removeBackground: z.boolean(),
      enhanceQuality: z.boolean(),
      compress: z.boolean(),
      targetSize: z.number(),
    }).optional(),
    metadata: z.object({
      title: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
      category: z.string(),
      contentType: z.enum(["photo", "illustration", "vector"]),
      editorialUsage: z.boolean(),
      releaseInfo: z.object({
        modelRelease: z.boolean(),
        propertyRelease: z.boolean(),
        editorialRelease: z.boolean(),
      }),
      price: z.object({
        amount: z.number(),
        currency: z.string(),
      }),
    }).optional(),
  }),
});

const batchDeleteSchema = z.object({
  batchId: z.string(),
});

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const searchParams = new URL(req.url).searchParams;
  const batchId = searchParams.get("batchId");

  if (!batchId) {
    return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
  }

  const products = await ProductService.findByUserId(userId, { 
    batchId,
    page: 1,
    limit: 100
  });

  return NextResponse.json(products);
});

export const PATCH = withAuth(async (req: NextRequest, { userId }) => {
  const body = await req.json();
  const { batchId, updates } = batchUpdateSchema.parse(body);

  const products = await ProductService.findByUserId(userId, { 
    batchId,
    page: 1,
    limit: 100
  });

  if (!products.items.length) {
    return NextResponse.json({ error: "No products found for batch" }, { status: 404 });
  }

  const updatePromises = products.items.map(product => 
    ProductService.update(product._id.toString(), updates)
  );

  await Promise.all(updatePromises);

  const updatedProducts = await ProductService.findByUserId(userId, { 
    batchId,
    page: 1,
    limit: 100
  });

  return NextResponse.json(updatedProducts);
});

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  const body = await req.json();
  const { batchId } = batchDeleteSchema.parse(body);

  const products = await ProductService.findByUserId(userId, { 
    batchId,
    page: 1,
    limit: 100
  });

  if (!products.items.length) {
    return NextResponse.json({ error: "No products found for batch" }, { status: 404 });
  }

  const deletePromises = products.items.map(product => 
    ProductService.delete(product._id.toString())
  );

  await Promise.all(deletePromises);

  return new NextResponse(null, { status: 204 });
}); 