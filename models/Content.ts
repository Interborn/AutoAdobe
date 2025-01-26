import { ObjectId } from "mongodb";

export interface GeneratedContent {
  _id: ObjectId;
  projectId: ObjectId;
  userId: ObjectId;
  type: 'prompt' | 'photo' | 'enhancement';
  originalContent?: {
    url?: string;
    prompt?: string;
  };
  generatedContent: {
    url?: string;
    prompt?: string;
  };
  metadata?: {
    model?: string;
    parameters?: Record<string, any>;
    processingTime?: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
} 