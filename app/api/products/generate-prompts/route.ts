import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { ProductService } from "@/lib/services/product.service";
import { generateImageDescription } from "@/lib/services/openai.service";

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const { productIds } = await req.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: "Product IDs must be a non-empty array" },
        { status: 400 }
      );
    }

    const products = await Promise.all(
      productIds.map(id => ProductService.findById(id))
    );

    // Filter out any null results and products without base64 images
    const validProducts = products.filter(
      (product): product is NonNullable<typeof product> =>
        product !== null &&
        !!product.imageConfig?.base64Image
    );

    if (validProducts.length === 0) {
      return NextResponse.json(
        { error: "No valid products found with base64 images" },
        { status: 404 }
      );
    }

    // Generate descriptions for each product
    const updatedProducts = await Promise.all(
      validProducts.map(async (product) => {
        try {
          // Generate new description
          const description = await generateImageDescription(
            product.imageConfig.base64Image
          );
          
          // Force update the description field
          const updatedProduct = await ProductService.update(product._id.toString(), {
            description,
            updatedAt: new Date() // Force update timestamp
          });
          
          if (!updatedProduct) {
            throw new Error(`Failed to update product ${product._id}`);
          }
          
          return updatedProduct;
        } catch (error) {
          console.error(`Failed to generate description for product ${product._id}:`, error);
          return null;
        }
      })
    );

    const successfulUpdates = updatedProducts.filter(Boolean);

    if (successfulUpdates.length === 0) {
      return NextResponse.json(
        { error: "Failed to update any products" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Successfully generated descriptions for ${successfulUpdates.length} out of ${validProducts.length} products`,
      successCount: successfulUpdates.length,
      totalCount: validProducts.length,
      updatedProducts: successfulUpdates
    });
  } catch (error) {
    console.error("Error generating prompts:", error);
    return NextResponse.json(
      { error: "Failed to generate prompts" },
      { status: 500 }
    );
  }
}); 

