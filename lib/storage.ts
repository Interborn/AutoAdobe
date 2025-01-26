import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'crypto';
import { join } from 'path';

let storageConfig = {};

if (process.env.NODE_ENV === 'production') {
  if (!process.env.GOOGLE_SERVICE_KEY) {
    throw new Error('Missing GOOGLE_SERVICE_KEY environment variable');
  }
  
  const credential = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_KEY, 'base64').toString()
  );

  storageConfig = {
    projectId: 'autostock-442118',
    credentials: {
      client_email: credential.client_email,
      private_key: credential.private_key,
    },
  };
} else {
  storageConfig = {
    projectId: 'autostock-442118',
    keyFilename: join(process.cwd(), 'google-cloud-key.json'),
  };
}

const storage = new Storage(storageConfig);

const BUCKET_NAME = 'autostock_product_photos';
const bucket = storage.bucket(BUCKET_NAME);

// Verify bucket exists on startup
(async () => {
  try {
    const [exists] = await bucket.exists();
    if (!exists) {
      console.error(`Bucket ${BUCKET_NAME} does not exist!`);
      throw new Error(`Bucket ${BUCKET_NAME} does not exist`);
    }
    console.log(`Successfully connected to bucket ${BUCKET_NAME}`);
    
    // Check bucket public access
    const [metadata] = await bucket.getMetadata();
    console.log('Bucket public access:', metadata.iamConfiguration);
  } catch (error) {
    console.error('Error verifying bucket:', error);
  }
})();

export class StorageService {
  static async uploadFile(file: Buffer, originalName: string, folder: string = 'prompts'): Promise<string> {
    console.log(`Starting upload for file: ${originalName} to folder: ${folder}`);
    
    const extension = originalName.split('.').pop();
    const fileName = `${folder}/${randomUUID()}.${extension}`;
    console.log(`Generated filename: ${fileName}`);
    
    const blob = bucket.file(fileName);
    
    const blobStream = blob.createWriteStream({
      resumable: false,
      gzip: true,
      metadata: {
        contentType: `image/${extension}`,
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        console.error('Error uploading file:', err);
        reject(err);
      });

      blobStream.on('finish', async () => {
        try {
          // Verify the file exists
          const [exists] = await blob.exists();
          if (!exists) {
            throw new Error('File failed to upload');
          }
          
          // Get the file's metadata
          const [metadata] = await blob.getMetadata();
          console.log('File metadata:', metadata);
          
          // Use a simpler URL format
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          console.log('Using URL:', publicUrl);
          
          resolve(publicUrl);
        } catch (error) {
          console.error('Error in upload finish:', error);
          reject(error);
        }
      });

      blobStream.end(file);
    });
  }

  static async deleteFile(url: string): Promise<void> {
    try {
      const fileName = url.split(`${bucket.name}/`)[1];
      if (!fileName) {
        console.warn('No filename found in URL:', url);
        return;
      }
      
      console.log(`Attempting to delete file: ${fileName}`);
      const file = bucket.file(fileName);
      
      const [exists] = await file.exists();
      if (!exists) {
        console.warn('File does not exist:', fileName);
        return;
      }
      
      await file.delete();
      console.log('Successfully deleted file:', fileName);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
} 

