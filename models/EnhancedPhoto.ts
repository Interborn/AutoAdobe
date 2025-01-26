import { ObjectId } from "mongodb";

export interface EnhancedPhoto {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  description?: string;
  originalPhoto: string; // Original photo URL
  enhancedPhoto: string; // Enhanced photo URL
  options: {
    removeSubject?: boolean;
    removeBackground?: boolean;
    enhanceQuality?: boolean;
    compress?: boolean;
    additionalOptions?: Record<string, any>;
  };
  metadata?: {
    stockTitle?: string;
    stockDescription?: string;
    stockTags?: string[];
    csvData?: string;
  };
  createdAt: Date;
  updatedAt: Date;
} 