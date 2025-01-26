import { mkdir } from "fs/promises";
import { join } from "path";

export async function ensureUploadDir(userId: string) {
  const uploadDir = join(process.cwd(), "public", "uploads", userId);
  
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error: any) {
    if (error.code !== "EEXIST") {
      throw error;
    }
  }
  
  return uploadDir;
} 