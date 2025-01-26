import { ObjectId } from "mongodb";

export interface Prompt {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  description?: string;
  inputPhotos: string[]; // Array of photo URLs
  outputPrompts: string[];
  options: {
    aspectRatio?: string;
    artStyle?: string;
    additionalOptions?: Record<string, any>;
  };
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
} 