import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { StorageService } from "@/lib/storage";
import { ProductService } from "@/lib/services/product.service";
import { generateImageDescription } from "@/lib/services/openai.service";

export const config = {
  api: {
    bodyParser: false,
  },
};

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    console.log('Starting file upload process');
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const stage = formData.get("stage") as string || "prompts";
    const batchName = formData.get("batchName") as string || undefined;
    const batchId = formData.get("batchId") as string;

    if (!batchId) {
      return NextResponse.json(
        { error: "Batch ID is required" },
        { status: 400 }
      );
    }

    console.log(`Received ${files.length} files, batchId: ${batchId}, batchName: ${batchName || 'unnamed'}`);

    if (!files.length) {
      console.warn('No files received in request');
      return NextResponse.json(
        { error: "No files uploaded" },
        { status: 400 }
      );
    }

    const uploadPromises = files.map(async (file) => {
      console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);
      const buffer = Buffer.from(await file.arrayBuffer());
      const url = await StorageService.uploadFile(buffer, file.name);
      console.log(`Successfully uploaded file: ${file.name} -> ${url}`);

      // Create an asset object for the uploaded file
      const base64Image = buffer.toString('base64');
      const asset = {
        url,
        type: "original" as const,
        mimeType: file.type,
        size: file.size,
        width: 0, // We could get this from the image if needed
        height: 0,
        createdAt: new Date(),
        base64Image: base64Image
      };

      // Generate description for the image
      const description = await generateImageDescription(base64Image);

      // Create a product for each uploaded image
      const product = await ProductService.create({
        userId,
        stage,
        status: "draft",
        batchId,
        batchName,
        description,
        originalImages: [asset]
      });

      return {
        url,
        productId: product._id.toString(),
        description,
        base64Image,
        batchId: product.batchId
      };
    });

    const results = await Promise.all(uploadPromises);
    console.log(`Successfully processed ${results.length} files`);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}); 
