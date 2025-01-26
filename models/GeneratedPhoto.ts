import { ObjectId } from "mongodb";

export interface GeneratedPhoto {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  description?: string;
  inputPrompt: string;
  outputPhotos: string[]; // Array of photo URLs
  options: {
    aspectRatio?: string;
    artStyle?: string;
    additionalOptions?: Record<string, any>;
  };
  tags?: string[];
  metadata?: {
    stockTitle?: string;
    stockDescription?: string;
    stockTags?: string[];
    csvData?: string;
  };
  createdAt: Date;
  updatedAt: Date;
} 