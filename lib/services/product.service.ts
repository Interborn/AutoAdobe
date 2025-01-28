import { ObjectId, Document } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Product, CreateProduct, Asset } from "@/models/Product";
import { CounterService } from "@/lib/services/counter.service";
import { connectToDatabase } from "@/lib/mongodb";

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Activity {
  type: 'prompt' | 'generate' | 'enhance';
  description: string;
  timestamp: string;
}

interface MonthlyStats {
  totalPrompts: number;
  imagesGenerated: number;
  enhancements: number;
  metadataFiles: number;
  storageUsed: number;
  storageLimit: number;
  apiCalls: number;
  apiLimit: number;
  recentActivity: Activity[];
}

export class ProductService {
  private static collection = "products";

  private static serializeProduct(product: Product): any {
    return {
      ...product,
      _id: product._id.toString(),
      userId: product.userId.toString(),
      originalImages: product.originalImages?.map(img => ({
        ...img,
        createdAt: img.createdAt.toISOString()
      })),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  static async create(data: CreateProduct): Promise<any> {
    const db = await getDb();
    const now = new Date();
    
    // Get next product ID for this user
    const productSeq = await CounterService.getNextSequence(data.userId.toString(), "product");
    const productId = `p-${productSeq}`;

    // Handle batch ID - always create a new one if not provided
    let batchId = data.batchId;
    if (!batchId) {
      const batchSeq = await CounterService.getNextSequence(data.userId.toString(), "batch");
      batchId = `b-${batchSeq}`;
    }
    
    const product: Omit<Product, "_id"> = {
      ...data,
      productId,
      batchId,
      batchName: data.batchName,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection(this.collection).insertOne(product);
    const createdProduct = {
      ...product,
      _id: result.insertedId,
    } as Product;

    // Update user's products array
    await db.collection("users").updateOne(
      { _id: new ObjectId(data.userId.toString()) },
      { 
        $push: { "products": result.insertedId } as any,
        $set: { updatedAt: now }
      }
    );

    return this.serializeProduct(createdProduct);
  }

  static async findById(id: string): Promise<any | null> {
    const db = await getDb();
    const product = await db
      .collection(this.collection)
      .findOne({ _id: new ObjectId(id) }) as unknown as Product | null;
    
    return product ? this.serializeProduct(product) : null;
  }

  static async findByUserId(userId: string, options?: {
    batchId?: string;
    limit?: number;
    page?: number;
  }): Promise<PaginatedResult<any>> {
    const db = await getDb();
    const query: any = { userId: new ObjectId(userId) };
    
    if (options?.batchId) query.batchId = options.batchId;

    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      db
        .collection(this.collection)
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray() as Promise<Product[]>,
      db.collection(this.collection).countDocuments(query),
    ]);

    return {
      items: items.map(this.serializeProduct),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async update(id: string, data: Partial<Product>): Promise<any | null> {
    const db = await getDb();
    const result = await db
      .collection(this.collection)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...data,
            updatedAt: new Date(),
          },
        },
        { 
          returnDocument: "after",
          projection: {
            _id: 1,
            userId: 1,
            productId: 1,
            batchId: 1,
            batchName: 1,
            description: 1,
            originalImages: 1,
            imageConfig: 1,
            enhancementOptions: 1,
            metadata: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      ) as unknown as Product | null;

    return result ? this.serializeProduct(result) : null;
  }

  static async addAsset(
    id: string,
    asset: Omit<Asset, "createdAt">,
    type: Asset["type"]
  ): Promise<any | null> {
    const db = await getDb();
    const result = await db
      .collection(this.collection)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $push: { "assets": { ...asset, type, createdAt: new Date() } } as any,
          $set: { updatedAt: new Date() },
        },
        { returnDocument: "after" }
      ) as unknown as Product | null;

    return result ? this.serializeProduct(result) : null;
  }

  static async addProcessingError(
    id: string,
    error: string
  ): Promise<any | null> {
    const db = await getDb();
    const result = await db
      .collection(this.collection)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $push: { "processingErrors": { error, timestamp: new Date() } } as any,
          $set: {
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      ) as unknown as Product | null;

    return result ? this.serializeProduct(result) : null;
  }

  static async delete(id: string): Promise<boolean> {
    const db = await getDb();
    
    // First get the product to know its userId
    const product = await this.findById(id);
    if (!product) return false;

    // Delete the product
    const result = await db
      .collection(this.collection)
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 1) {
      // Remove the product reference from the user's products array
      await db.collection("users").updateOne(
        { _id: product.userId },
        { 
          $pull: { "products": new ObjectId(id) } as any,
          $set: { updatedAt: new Date() }
        }
      );
      return true;
    }

    return false;
  }

  static async findByIds(ids: string[]): Promise<any[]> {
    if (!ids.length) return [];
    
    const db = await getDb();
    const objectIds = ids.map(id => new ObjectId(id));
    
    const products = await db
      .collection(this.collection)
      .find({ _id: { $in: objectIds } })
      .toArray() as unknown as Product[];

    return products.map(this.serializeProduct);
  }

  async getMonthlyStats(userEmail: string): Promise<MonthlyStats> {
    // TODO: Implement actual stats gathering from database
    // For now, return mock data
    return {
      totalPrompts: 25,
      imagesGenerated: 12,
      enhancements: 18,
      metadataFiles: 8,
      storageUsed: 1024 * 1024 * 500, // 500 MB
      storageLimit: 1024 * 1024 * 1024 * 2, // 2 GB
      apiCalls: 150,
      apiLimit: 500,
      recentActivity: [
        {
          type: 'prompt',
          description: 'Created 5 new prompts',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        },
        {
          type: 'generate',
          description: 'Generated 3 images',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
        },
        {
          type: 'enhance',
          description: 'Enhanced 2 images',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        }
      ]
    };
  }
}

export async function getProducts(userId: string): Promise<Product[]> {
  const result = await ProductService.findByUserId(userId, { limit: 1000 });
  return result.items;
}

export async function getProduct(productId: string): Promise<Product | null> {
  const { db } = await connectToDatabase();
  
  const product = await db
    .collection("products")
    .findOne({
      _id: new ObjectId(productId),
    });

  return product as Product;
}

export async function updateProduct(productId: string, update: Partial<Product>): Promise<void> {
  const { db } = await connectToDatabase();
  
  await db
    .collection("products")
    .updateOne(
      { _id: new ObjectId(productId) },
      { $set: { ...update, updatedAt: new Date() } }
    );
}

export async function deleteProduct(productId: string): Promise<void> {
  const { db } = await connectToDatabase();
  
  await db
    .collection("products")
    .deleteOne({
      _id: new ObjectId(productId),
    });
} 