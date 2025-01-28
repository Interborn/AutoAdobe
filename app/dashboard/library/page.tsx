import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getProducts } from "@/lib/services/product.service";
import { LibraryClient } from "@/components/dashboard/library-client";

export default async function LibraryPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) return null;

  const products = await getProducts(session.user.id);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Image Library</h1>
          <p className="text-muted-foreground">Upload and manage your images</p>
        </div>
      </div>
      <LibraryClient initialProducts={products} userId={session.user.id} />
    </div>
  );
} 