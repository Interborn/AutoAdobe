import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};
const dbName = "AutoStock";

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db(dbName);
}

export async function initializeCollections() {
  const db = await getDb();
  
  // Create collections if they don't exist
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(col => col.name);

  if (!collectionNames.includes('users')) {
    await db.createCollection('users');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
  }

  if (!collectionNames.includes('prompts')) {
    await db.createCollection('prompts');
    await db.collection('prompts').createIndex({ userId: 1 });
  }

  if (!collectionNames.includes('generatedPhotos')) {
    await db.createCollection('generatedPhotos');
    await db.collection('generatedPhotos').createIndex({ userId: 1 });
  }

  if (!collectionNames.includes('enhancedPhotos')) {
    await db.createCollection('enhancedPhotos');
    await db.collection('enhancedPhotos').createIndex({ userId: 1 });
  }

  // Initialize products collection
  if (!collectionNames.includes('products')) {
    await db.createCollection('products');
    await db.collection('products').createIndex({ userId: 1 });
    await db.collection('products').createIndex({ batchId: 1 });
    await db.collection('products').createIndex({ status: 1 });
    await db.collection('products').createIndex({ stage: 1 });
    await db.collection('products').createIndex({ createdAt: -1 });
    await db.collection('products').createIndex(
      { userId: 1, stage: 1, status: 1 },
      { name: 'products_workflow_index' }
    );
  }
}