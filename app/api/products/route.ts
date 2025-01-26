import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api-handler";
import { ProductService } from "@/lib/services/product.service";
import { generateImageDescription } from "@/lib/services/openai.service";

// Validation schema for query parameters
const querySchema = z.object({
  stage: z.enum(["prompts", "generate", "enhance", "metadata"]).optional(),
  status: z.enum(["draft", "processing", "completed", "failed"]).optional(),
  page: z.string().transform(Number).default("1"),
  limit: z.string().transform(Number).default("10"),
});

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const { searchParams } = new URL(req.url);
  const query = querySchema.parse(Object.fromEntries(searchParams));

  const skip = (query.page - 1) * query.limit;
  const products = await ProductService.findByUserId(userId, {
    stage: query.stage,
    status: query.status,
    skip,
    limit: query.limit,
  });

  return NextResponse.json(products);
});

// Validation schema for creating a product
const createSchema = z.object({
  stage: z.enum(["prompts", "generate", "enhance", "metadata"]),
  status: z.enum(["draft", "processing", "completed", "failed"]).optional(),
  imageConfig: z.object({
    base64Image: z.string().optional(),
    originalImageUrl: z.string().url().optional(),
    generatedImageUrl: z.string().url().optional(),
    enhancedImageUrl: z.string().url().optional(),
    finalImageUrl: z.string().url().optional(),
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
  batchId: z.string().optional(),
  batchName: z.string().optional(),
  priority: z.number().optional(),
  originalImages: z.array(z.object({
    url: z.string().url(),
    mimeType: z.string(),
    size: z.number(),
    width: z.number().optional(),
    height: z.number().optional(),
  })).optional(),
});

// POST /api/products
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = await req.json();
  const data = createSchema.parse(body);

  let description: string | undefined = undefined;
  let originalImages = data.originalImages || [];

  // Generate description from base64 image if provided
  if (data.imageConfig?.base64Image) {
    description = await generateImageDescription(data.imageConfig.base64Image);
  }

  // Convert imageConfig URLs to assets if they exist
  if (data.imageConfig?.originalImageUrl && !originalImages.length) {
    originalImages = [{
      url: data.imageConfig.originalImageUrl,
      mimeType: 'image/jpeg', // Default to JPEG if not specified
      size: 0, // Size unknown
      type: 'original' as const,
      createdAt: new Date()
    }];
  }

  // Create and store the product
  const product = await ProductService.create({
    userId,
    status: data.status || "draft",
    description,
    originalImages,
    ...data,
  });

  return NextResponse.json(product, { status: 201 });
});
