import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Product, CreateProduct, Asset } from "@/models/Product";
import { CounterService } from "@/lib/services/counter.service";

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
      generatedImages: product.generatedImages?.map(img => ({
        ...img,
        createdAt: img.createdAt.toISOString()
      })),
      enhancedImages: product.enhancedImages?.map(img => ({
        ...img,
        createdAt: img.createdAt.toISOString()
      })),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      completedAt: product.completedAt?.toISOString(),
      processingErrors: product.processingErrors?.map(err => ({
        ...err,
        timestamp: err.timestamp.toISOString()
      }))
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
        $push: { products: result.insertedId },
        $set: { updatedAt: now }
      }
    );

    return this.serializeProduct(createdProduct);
  }

  static async findById(id: string): Promise<any | null> {
    const db = await getDb();
    const product = await db
      .collection(this.collection)
      .findOne({ _id: new ObjectId(id) }) as Product | null;
    
    return product ? this.serializeProduct(product) : null;
  }

  static async findByUserId(userId: string, options?: {
    stage?: Product["stage"];
    status?: Product["status"];
    batchId?: string;
    limit?: number;
    page?: number;
  }): Promise<PaginatedResult<any>> {
    const db = await getDb();
    const query: any = { userId: new ObjectId(userId) };
    
    if (options?.stage) query.stage = options.stage;
    if (options?.status) query.status = options.status;
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
        { returnDocument: "after" }
      );

    return result ? this.serializeProduct(result) : null;
  }

  static async updateStage(id: string, stage: Product["stage"]): Promise<any | null> {
    return this.update(id, { stage });
  }

  static async updateStatus(id: string, status: Product["status"]): Promise<any | null> {
    const updates: Partial<Product> = { status };
    if (status === "completed") {
      updates.completedAt = new Date();
    }
    return this.update(id, updates);
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
          $push: {
            assets: {
              ...asset,
              type,
              createdAt: new Date(),
            },
          },
          $set: { updatedAt: new Date() },
        },
        { returnDocument: "after" }
      );

    return result ? this.serializeProduct(result) : null;
  }

  static async addProcessingError(
    id: string,
    stage: string,
    error: string
  ): Promise<any | null> {
    const db = await getDb();
    const result = await db
      .collection(this.collection)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $push: {
            processingErrors: {
              stage,
              error,
              timestamp: new Date(),
            },
          },
          $set: {
            status: "failed",
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );

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
          $pull: { products: new ObjectId(id) },
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
      .toArray() as Product[];

    return products.map(this.serializeProduct);
  }
} 