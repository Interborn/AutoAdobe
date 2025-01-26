import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Sidebar } from '@/components/dashboard/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex max-w-screen-2xl mx-auto">
        <Sidebar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}