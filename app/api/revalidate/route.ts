import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAuth } from "@/lib/api-handler";

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { path } = await req.json();
    
    if (!path) {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 }
      );
    }

    revalidatePath(path);
    
    return NextResponse.json({ revalidated: true, path });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}); 