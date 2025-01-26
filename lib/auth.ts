import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/signin");
  }

  return session;
}

export async function requireNoAuth() {
  const session = await getServerSession();

  if (session?.user) {
    redirect("/dashboard");
  }
} 