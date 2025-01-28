import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon, Wand2Icon, FileTextIcon, ImagePlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ProductService } from "@/lib/services/product.service";

interface Activity {
  type: 'prompt' | 'generate' | 'enhance';
  description: string;
  timestamp: string;
}

async function getStats() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      totalPrompts: 0,
      imagesGenerated: 0,
      enhancements: 0,
      metadataFiles: 0,
      recentActivity: [] as Activity[],
      storageUsed: 0,
      storageLimit: 0,
      apiCalls: 0,
      apiLimit: 0
    };
  }

  const productService = new ProductService();
  const stats = await productService.getMonthlyStats(session.user.email);
  return stats;
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome to your AI-powered stock photo platform
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard/prompts">
            <Button>
              <ImagePlusIcon className="w-4 h-4 mr-2" />
              Upload Images
            </Button>
          </Link>
          <Link href="/dashboard/generate">
            <Button variant="outline">
              <Wand2Icon className="w-4 h-4 mr-2" />
              Generate
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Prompts"
          value={stats.totalPrompts.toString()}
          description="Generated this month"
          icon={<ImageIcon className="w-4 h-4" />}
        />
        <StatsCard
          title="Images Generated"
          value={stats.imagesGenerated.toString()}
          description="Created this month"
          icon={<Wand2Icon className="w-4 h-4" />}
        />
        <StatsCard
          title="Enhancements"
          value={stats.enhancements.toString()}
          description="Processed this month"
          icon={<ImagePlusIcon className="w-4 h-4" />}
        />
        <StatsCard
          title="Metadata Files"
          value={stats.metadataFiles.toString()}
          description="Generated this month"
          icon={<FileTextIcon className="w-4 h-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length > 0 ? (
              <ul className="space-y-4">
                {stats.recentActivity.map((activity: Activity, index: number) => (
                  <li key={index} className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-muted">
                      {activity.type === 'prompt' && <ImageIcon className="w-4 h-4" />}
                      {activity.type === 'generate' && <Wand2Icon className="w-4 h-4" />}
                      {activity.type === 'enhance' && <ImagePlusIcon className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent activities to display
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/prompts" className="block">
              <Button variant="outline" className="w-full justify-start">
                <ImagePlusIcon className="w-4 h-4 mr-2" />
                Upload New Images
              </Button>
            </Link>
            <Link href="/dashboard/generate" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Wand2Icon className="w-4 h-4 mr-2" />
                Generate Images
              </Button>
            </Link>
            <Link href="/dashboard/metadata" className="block">
              <Button variant="outline" className="w-full justify-start">
                <FileTextIcon className="w-4 h-4 mr-2" />
                Manage Metadata
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Usage Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Storage Used</span>
                  <span className="font-medium">
                    {formatBytes(stats.storageUsed || 0)} / {formatBytes(stats.storageLimit || 0)}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary"
                    style={{ 
                      width: `${Math.min(
                        ((stats.storageUsed || 0) / (stats.storageLimit || 1)) * 100, 
                        100
                      )}%` 
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>API Calls</span>
                  <span className="font-medium">
                    {stats.apiCalls || 0} / {stats.apiLimit || 0}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary"
                    style={{ 
                      width: `${Math.min(
                        ((stats.apiCalls || 0) / (stats.apiLimit || 1)) * 100, 
                        100
                      )}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}