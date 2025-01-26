import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api-handler";
import { CounterService } from "@/lib/services/counter.service";

const createBatchSchema = z.object({
  batchName: z.string().optional()
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = await req.json();
  const { batchName } = createBatchSchema.parse(body);

  // Get next batch ID for this user
  const batchSeq = await CounterService.getNextSequence(userId.toString(), "batch");
  const batchId = `b-${batchSeq}`;

  return NextResponse.json({ batchId });
}); 