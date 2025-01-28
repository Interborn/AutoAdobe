import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'crypto';
import { join } from 'path';
import fs from 'fs';

const storageConfig = {
  projectId: 'autostock-442118',
  credentials: {
    client_email: "autostock@autostock-442118.iam.gserviceaccount.com",
    private_key: process.env.GOOGLE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCyw8dMMJ+V3Hrv\nxQs3O73ZTbjOF30ORlYNWhJdtM0io+oqV3JmZ2na/L2v+XBfeDAaWU5XfbiY8/N+\nhgzXLBi2ZWurhE8onlyaNnDXSiSskEXf8dkEzp/3bqMJS7+/fZ0qcN9XFZi/8wue\n7bfvMYIhVroybwCRDTFE7joIBcaE0MmLwDk65t2JcOm1h5O1BPrxmLm47aw9YX5M\nOljtlU3MvalNpKJrazuf+/C77nkB+J158ujjnHdL8IuVvFDU1Ntb6oi8zP1c64Kl\nuzIOKfQE+aISq0gbY55QzrBuWUVp7iCX8JMP+wtvwupAMOPBzhUM48tKMvE+FnG5\nrG0LlxqnAgMBAAECggEANuYeCf1yvQS5cnIKeDtuGdKfGxemjaA3JCGRu1pflzBM\npRU26lD+9sQggu7xPjh8WVMs1nyjGMHueOA1CE2gBz/NWZ6n6rr7iFaIv+0ipyYl\nd1lgAvRrtwKwqhWrvOSYRCTmyek1gFllK7kogBotswxd4UgqneE1zMv2YWlYpoet\njy3OuuHyp7RLMe2VR1Qu92KCmWcP41WVxnEpAINtRh42AbnqHySCIfslrxlpm/hT\njKQ4RVaDaJcvqRVWTmvZmX6Xq2CtKPWdhZz3h0+npQoDK1Bsj+0I/XarQlg90mK1\nwaRVrbCc389OYrJSE/GrFmf1N52H1hldx16NRY1xgQKBgQD0wc7he9H/ucb4xdAo\nAnQ2osJVQSnefbvXDltERqQ+APQtMYwFJatBFsGUWOaiOqDWvTrr0074suui6NqA\nb2lrrXPlovX1MClszaKRVErM9/a60WBk8LOsDlKe3gSsogFWAdIRdMGWLu0rslvp\nHXzu5t10g5f1nPTgmOs7ZS2igQKBgQC6+fEQaAoUbU+BpnYIgVdg+uoIGX3rNvtz\nnNlezGuzLzdI45CrdDta0rsOIG4Js/ClXiu+cDEYUYpb9J0v52r3IkqjWw+49KyV\nSoV63N+hTWOrx9hX0dPI468O9mRhMET2Ijesl3zQRnyKJ+N079yS7ni3yxEah6hb\nhldsOOTZJwKBgQDJOtbWuDCNqbYXLrvXST029lYENhEwZfub8qfC2LmMaMhYp9XR\nHYlReF4rk3P7iWxXYTkiTpctDh2B0SRkWDU6XF9fO74wmipU1DSGe+EL6AqoyiAQ\nnX17RkNTboI1VPT4O4L06yOGUIqaVIgQfzgKSzFj7BVx0FvclJ1CNgtxAQJ/VXPl\nuJnUAYHz1E0/pKN4S9phG1KLOfTm9u+4aJsEnd/2ZFmcxL9aYSfuVYZ8w/J5CRsA\n4whjZ7ncgipJrJsXR9tkQURc6yrntVNZrc1EZ3P3GYs8VOaQ5D8qwqvZNJHa8qKw\nzzBs2sNcJ8gTLF5zcLOMeHNWXcmiKDI9wjg+XwKBgQC4N5X/TgfN1NIxouJ7tBEy\n7JVsvjcX+rYOV/Jv52+rb8cVvnMeGOfqgwwcwN8J0RD8pAUN65ufUrQSpPePHY3o\nsXhOtMMRn3UV0Mbg1MbbPeYJzNJ854a/pOGuH2V2jVobboABkJk8Y5hMntjD0NWd\noix4+jPBFBsaWIQuvDgzUA==\n-----END PRIVATE KEY-----\n",
  },
};

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
  static async uploadFile(file: Buffer, originalName: string, folder: string = 'library'): Promise<string> {
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

