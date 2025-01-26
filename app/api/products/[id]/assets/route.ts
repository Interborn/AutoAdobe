import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api-handler";
import { ProductService } from "@/lib/services/product.service";

const assetSchema = z.object({
  type: z.enum(["original", "prompt", "generated", "enhanced"]),
  url: z.string().url(),
  mimeType: z.string(),
  size: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  prompt: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const POST = withAuth(async (req: NextRequest, { params, userId }) => {
  const product = await ProductService.findById(params.id);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (product.userId.toString() !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const data = assetSchema.parse(body);

  const updatedProduct = await ProductService.addAsset(params.id, data, data.type);
  return NextResponse.json(updatedProduct);
});

export const GET = withAuth(async (req: NextRequest, { params, userId }) => {
  const product = await ProductService.findById(params.id);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (product.userId.toString() !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const searchParams = new URL(req.url).searchParams;
  const type = searchParams.get("type");

  if (type) {
    const assets = product.assets?.filter(asset => asset.type === type) || [];
    return NextResponse.json(assets);
  }

  return NextResponse.json(product.assets || []);
}); 