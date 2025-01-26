import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api-handler";
import { ProductService } from "@/lib/services/product.service";
import { Asset } from "@/models/Product";

const assetSchema = z.object({
  type: z.enum(["original", "generated", "enhanced"]),
  url: z.string().url(),
  mimeType: z.string(),
  size: z.number(),
  width: z.number(),
  height: z.number(),
  base64Image: z.string().optional(),
  aspectRatio: z.string().optional(),
  artStyle: z.string().optional(),
  quality: z.enum(["low", "medium", "high"]).optional(),
  format: z.enum(["jpg", "png", "webp"]).optional(),
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
  const type = searchParams.get("type") as Asset["type"] | null;

  if (type) {
    const assets = (product.assets || []).filter((asset: Asset) => asset.type === type);
    return NextResponse.json(assets);
  }

  return NextResponse.json(product.assets || []);
}); 