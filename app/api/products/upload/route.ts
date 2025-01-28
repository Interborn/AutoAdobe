import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { StorageService } from "@/lib/storage";
import { ObjectId } from "mongodb";
import sharp from "sharp";
import { ProductService } from "@/lib/services/product.service";

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const batchId = formData.get("batchId") as string;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image with sharp
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    // Compress image if needed
    const processedBuffer = await image
      .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Convert to base64 for OpenAI
    const base64Image = processedBuffer.toString("base64");

    // Upload to Google Cloud Storage
    const uploadedUrl = await StorageService.uploadFile(
      processedBuffer,
      file.name,
      "library"
    );

    // Create product using ProductService
    const product = await ProductService.create({
      userId: new ObjectId(session.user.id),
      batchId,
      originalImages: [{
        url: uploadedUrl,
        type: "original" as const,
        mimeType: file.type,
        size: file.size,
        width: metadata.width || 0,
        height: metadata.height || 0,
        createdAt: new Date(),
      }],
      imageConfig: {
        base64Image,
        originalImageUrl: uploadedUrl,
      },
      productId: "", // This will be overwritten by the service
    });
    
    return NextResponse.json(product);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}

