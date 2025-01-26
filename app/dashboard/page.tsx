import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon, Wand2Icon, FileTextIcon, ImagePlusIcon } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your AI-powered stock photo platform
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Prompts"
          value="25"
          description="Generated this month"
          icon={<ImageIcon className="w-4 h-4" />}
        />
        <StatsCard
          title="Images Generated"
          value="12"
          description="Created this month"
          icon={<Wand2Icon className="w-4 h-4" />}
        />
        <StatsCard
          title="Enhancements"
          value="18"
          description="Processed this month"
          icon={<ImagePlusIcon className="w-4 h-4" />}
        />
        <StatsCard
          title="Metadata Files"
          value="8"
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
            <p className="text-sm text-muted-foreground">
              Your recent activities will appear here
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Common actions and shortcuts will appear here
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Usage Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your usage statistics will appear here
            </p>
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