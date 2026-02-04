import { api } from "@/trpc/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, CircleDot, Users, Clock } from "lucide-react";
import { CreateIssueModal } from "@/components/create-issue-modal";

export default async function WorkspaceDashboard({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const workspace = await api.workspace.getBySlug({ slug: workspaceSlug });

  const stats = [
    { label: "Total Projects", value: workspace.projects.length, icon: Layers },
    { label: "Active Issues", value: 0, icon: CircleDot },
    { label: "Team Members", value: workspace.members.length, icon: Users },
    { label: "Avg. Cycle Time", value: "0d", icon: Clock },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of {workspace.name}.</p>
        </div>
        <CreateIssueModal workspaceId={workspace.id} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border bg-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest changes across the workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground italic">No recent activity found.</p>
          </CardContent>
        </Card>
        <Card className="col-span-3 border-border bg-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequent tasks and shortcuts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
             <p className="text-sm text-muted-foreground italic">Coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
