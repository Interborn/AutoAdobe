import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";

export type ApiHandler = (
  req: NextRequest,
  context: { params: any; userId: string }
) => Promise<NextResponse>;

export const withAuth = (handler: ApiHandler) => {
  return async (req: NextRequest, { params }: { params: any }) => {
    try {
      const token = await getToken({ req });

      if (!token?.sub) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      return handler(req, { params, userId: token.sub });
    } catch (error) {
      console.error("API error:", error);
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}; 