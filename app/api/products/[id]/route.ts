import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api-handler";
import { ProductService } from "@/lib/services/product.service";

// Validation schema for updating a product
const updateSchema = z.object({
  batchName: z.string().optional(),
  description: z.string().optional(),
  imageConfig: z.object({
    aspectRatio: z.string().optional(),
    artStyle: z.string().optional(),
    quality: z.enum(["low", "medium", "high"]).optional(),
    format: z.enum(["jpg", "png", "webp"]).optional(),
  }).optional(),
  enhancementOptions: z.object({
    removeSubject: z.boolean().optional(),
    removeBackground: z.boolean().optional(),
    enhanceQuality: z.boolean().optional(),
    compress: z.boolean().optional(),
    targetSize: z.number().optional(),
  }).optional(),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    contentType: z.enum(["photo", "illustration", "vector"]).optional(),
    editorialUsage: z.boolean().optional(),
    releaseInfo: z.object({
      modelRelease: z.boolean().optional(),
      propertyRelease: z.boolean().optional(),
      editorialRelease: z.boolean().optional(),
    }).optional(),
    price: z.object({
      amount: z.number(),
      currency: z.string(),
    }).optional(),
  }).optional(),
  priority: z.number().optional(),
});

export const GET = withAuth(async (req: NextRequest, { params, userId }) => {
  const product = await ProductService.findById(params.id);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (product.userId.toString() !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json(product);
});

export const PATCH = withAuth(async (req: NextRequest, { params, userId }) => {
  const product = await ProductService.findById(params.id);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (product.userId.toString() !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const data = updateSchema.parse(body);

  const updatedProduct = await ProductService.update(params.id, data);
  return NextResponse.json(updatedProduct);
});

export const DELETE = withAuth(async (req: NextRequest, { params, userId }) => {
  const product = await ProductService.findById(params.id);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (product.userId.toString() !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await ProductService.delete(params.id);
  return new NextResponse(null, { status: 204 });
}); 