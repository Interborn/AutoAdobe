import { ObjectId } from "mongodb";

export interface ImageConfig {
  base64Image?: string;
  originalImageUrl?: string;
  generatedImageUrl?: string;
  enhancedImageUrl?: string;
  finalImageUrl?: string;
  aspectRatio?: string;
  artStyle?: string;
  quality?: "low" | "medium" | "high";
  format?: "jpg" | "png" | "webp";
}

export interface EnhancementOptions {
  removeSubject?: boolean;
  removeBackground?: boolean;
  enhanceQuality?: boolean;
  compress?: boolean;
  targetSize?: number; // in bytes
}

export interface StockMetadata {
  title: string;
  description: string;
  tags: string[];
  category?: string;
  contentType?: "photo" | "illustration" | "vector";
  editorialUsage?: boolean;
  releaseInfo?: {
    modelRelease?: boolean;
    propertyRelease?: boolean;
    editorialRelease?: boolean;
  };
  price?: {
    amount: number;
    currency: string;
  };
}

export interface Asset {
  url: string;
  type: "original" | "generated" | "enhanced";
  mimeType: string;
  size: number;
  width: number;
  height: number;
  createdAt: Date;
  base64Image?: string;
  aspectRatio?: string;
  artStyle?: string;
  quality?: "low" | "medium" | "high";
  format?: "jpg" | "png" | "webp";
}

export interface Product {
  _id: ObjectId;
  userId: ObjectId;
  productId: string; // Incremental ID in format "p-{number}"
  batchId?: string; // Incremental ID in format "b-{number}"
  batchName?: string; // User-provided name for the batch
  description?: string; // Generated description from GPT-4
  
  // Input/Original Images
  originalImages?: Asset[];
  
  // Image Configuration
  imageConfig?: ImageConfig;
  
  // Metadata
  metadata?: StockMetadata;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Helper type for creating a new product
export type CreateProduct = Omit<Product, "_id" | "createdAt" | "updatedAt">; 