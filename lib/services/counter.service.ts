import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

interface Counter {
  _id: string;
  userId: ObjectId;
  type: "batch" | "product";
  seq: number;
}

export class CounterService {
  private static collection = "counters";

  static async getNextSequence(userId: string, type: Counter["type"]): Promise<number> {
    const db = await getDb();
    const result = await db.collection(this.collection).findOneAndUpdate(
      { userId: new ObjectId(userId), type },
      { $inc: { seq: 1 } },
      { 
        upsert: true,
        returnDocument: "after"
      }
    );

    return result?.seq || 1;
  }

  static async getCurrentSequence(userId: string, type: Counter["type"]): Promise<number> {
    const db = await getDb();
    const counter = await db.collection(this.collection).findOne({
      userId: new ObjectId(userId),
      type
    });

    return counter?.seq || 0;
  }

  static async resetSequence(userId: string, type: Counter["type"]): Promise<void> {
    const db = await getDb();
    await db.collection(this.collection).updateOne(
      { userId: new ObjectId(userId), type },
      { $set: { seq: 0 } },
      { upsert: true }
    );
  }
} 